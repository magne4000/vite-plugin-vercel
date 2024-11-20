import fs from "node:fs/promises";
import path from "node:path";
import { getNodeVersion } from "@vercel/build-utils";
import type { NodeVersion } from "@vercel/build-utils/dist";
import {
  BuildEnvironment,
  type EnvironmentOptions,
  type Plugin,
  type PluginOption,
  type ResolvedConfig,
  mergeConfig,
} from "vite";
import { getVcConfig } from "./build";
import { getConfig } from "./config";
import { copyDir } from "./helpers";
import { vercelOutputPrerenderConfigSchema } from "./schemas/config/prerender-config";
import type { ViteVercelConfig, ViteVercelPrerenderRoute } from "./types";
import { getOutput, getPublic } from "./utils";

export * from "./types";

function vercelPluginCleanup(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    apply: "build",
    name: "vite-plugin-vercel:cleanup",
    enforce: "pre",

    configResolved(config) {
      resolvedConfig = config;
    },
    writeBundle: {
      order: "pre",
      sequential: true,
      async handler() {
        if (!resolvedConfig.build?.ssr) {
          // step 1:	Clean .vercel/ouput dir
          await cleanOutputDirectory(resolvedConfig);
        }
      },
    },
  };
}

const outDir = path.join(".vercel", "output");

function createVercelEnvironmentOptions(
  input: Record<string, string>,
  overrides?: EnvironmentOptions,
): EnvironmentOptions {
  return mergeConfig(
    {
      build: {
        createEnvironment(name, config) {
          return new BuildEnvironment(name, config);
        },
        outDir,
        rollupOptions: {
          input,
        },
      },
      keepProcessEnv: true,
    } satisfies EnvironmentOptions,
    overrides ?? {},
  );
}

function vercelPlugin(pluginConfig: ViteVercelConfig): Plugin {
  const virtualEntry = "virtual:vite-plugin-vercel:entry";
  const resolvedVirtualEntry = "\0virtual:vite-plugin-vercel:entry";
  let nodeVersion: NodeVersion;

  return {
    apply: "build",
    name: "vite-plugin-vercel",
    enforce: "post",

    async buildStart() {
      nodeVersion = await getNodeVersion(process.cwd());
    },

    config(config) {
      const entries = pluginConfig.entries ?? [];
      const inputs = entries.reduce(
        (acc, curr) => {
          const destination = `${path.posix.resolve("/functions/", curr.destination)}.func/index`;
          if (curr.edge) {
            // .vercel/output/**/*.func/index.js
            acc.edge[destination] = `${virtualEntry}:${curr.input}`;
          } else {
            // .vercel/output/**/*.func/index.mjs
            acc.node[destination] = `${virtualEntry}:${curr.input}`;
          }

          return acc;
        },
        { node: {} as Record<string, string>, edge: {} as Record<string, string> },
      );
      config.environments ??= {};
      config.environments["vercel-edge"] = createVercelEnvironmentOptions(inputs.edge);
      config.environments["vercel-node"] = createVercelEnvironmentOptions(inputs.node);
    },

    resolveId(id) {
      if (id.startsWith(virtualEntry)) {
        return `\0${id}`;
      }
    },

    load(id) {
      if (id.startsWith(resolvedVirtualEntry)) {
        const isEdge = this.environment.name === "vercel-edge";
        const fn = isEdge ? "createEdgeHandler" : "createNodeHandler";
        const [, , , input] = id.split(":");

        const entries = pluginConfig.entries ?? [];
        const entry = entries.find((e) => e.input === input);

        if (!entry) {
          throw new Error("TODO");
        }

        // Generate .vc-config.json
        const filename = entry.edge ? "index.js" : "index.mjs";
        this.emitFile({
          type: "asset",
          fileName: `${path.posix.resolve("/functions/", entry.destination)}.func/.vc-config.json`,
          source: JSON.stringify(
            getVcConfig(pluginConfig, filename, {
              nodeVersion,
              edge: Boolean(entry.edge),
              streaming: entry.streaming,
            }),
            undefined,
            2,
          ),
        });

        // Generate *.prerender-config.json when necessary
        if (entry.isr) {
          this.emitFile({
            type: "asset",
            fileName: `${path.posix.resolve("/functions/", entry.destination)}.prerender-config.json`,
            source: JSON.stringify(vercelOutputPrerenderConfigSchema.parse(entry.isr), undefined, 2),
          });
        }

        // Generate rewrites
        if (entry.route) {
          pluginConfig.rewrites ??= [];
          pluginConfig.rewrites.push({
            source: `(${entry.route})`,
            destination: `${entry.destination}/?__original_path=$1`,
          });
        }

        //language=javascript
        return `
import { ${fn} } from "@universal-middleware/vercel";
import handler from "${input}";

return ${fn}(handler)();
`;
      }
    },

    async generateBundle() {
      // Compute overrides for static HTML files
      const userOverrides = await computeStaticHtmlOverrides(this.environment.config);
      // Copy dist folder to static
      await copyDistToStatic(this.environment.config);

      // Update overrides with static files paths
      pluginConfig.config ??= {};
      pluginConfig.config.overrides ??= {};
      Object.assign(pluginConfig.config.overrides, userOverrides);

      // Generate config.json
      this.emitFile({
        type: "asset",
        fileName: "config.json",
        source: JSON.stringify(getConfig(pluginConfig), undefined, 2),
      });
    },

    // writeBundle: {
    //   order: "post",
    //   sequential: true,
    //   async handler() {
    //     // Compile serverless functions to ".vercel/output/functions"
    //     // /api auto bundling
    //     // TODO: make this opt-in, and /api folder should be configurable
    //     // const { rewrites, isr, headers } = await buildEndpoints(resolvedConfig);
    //     // Generate prerender config files
    //     // rewrites.push(...(await buildPrerenderConfigs(resolvedConfig, isr)));
    //     // Generate config file
    //     // await writeConfig(
    //     //   resolvedConfig,
    //     //   rewrites,
    //     //   {
    //     //     ...userOverrides,
    //     //     ...overrides,
    //     //   },
    //     //   headers,
    //     // );
    //   },
    // },
  };
}

async function cleanOutputDirectory(resolvedConfig: ResolvedConfig) {
  await fs.rm(getOutput(resolvedConfig), {
    recursive: true,
    force: true,
  });

  await fs.mkdir(getOutput(resolvedConfig), { recursive: true });
}

async function copyDistToStatic(resolvedConfig: ResolvedConfig) {
  if (resolvedConfig.vercel?.distContainsOnlyStatic) {
    await copyDir(resolvedConfig.build.outDir, getOutput(resolvedConfig, "static"));
  }
}

async function computeStaticHtmlOverrides(
  resolvedConfig: ResolvedConfig,
): Promise<NonNullable<ViteVercelPrerenderRoute>> {
  const staticAbsolutePath = getOutput(resolvedConfig, "static");
  const files = await getStaticHtmlFiles(staticAbsolutePath);

  // public files copied by vite by default https://vitejs.dev/guide/assets.html#the-public-directory
  const publicDir = getPublic(resolvedConfig);
  const publicFiles = await getStaticHtmlFiles(publicDir);
  files.push(...publicFiles.map((f) => f.replace(publicDir, staticAbsolutePath)));

  return files.reduce(
    (acc, curr) => {
      const relPath = path.relative(staticAbsolutePath, curr);
      const parsed = path.parse(relPath);
      const pathJoined = path.join(parsed.dir, parsed.name);
      acc[relPath] = {
        path: pathJoined,
      };
      return acc;
    },
    {} as NonNullable<ViteVercelPrerenderRoute>,
  );
}

async function getStaticHtmlFiles(src: string) {
  try {
    await fs.stat(src);
  } catch (e) {
    return [];
  }

  const entries = await fs.readdir(src, { withFileTypes: true });
  const htmlFiles: string[] = [];

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);

    entry.isDirectory()
      ? htmlFiles.push(...(await getStaticHtmlFiles(srcPath)))
      : srcPath.endsWith(".html")
        ? htmlFiles.push(srcPath)
        : undefined;
  }

  return htmlFiles;
}

export default function allPlugins(pluginConfig: ViteVercelConfig): PluginOption[] {
  return [vercelPluginCleanup(), vercelPlugin(pluginConfig)];
}
