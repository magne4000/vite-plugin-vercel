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
import { buildEndpoints, getVcConfig } from "./build";
import { getConfig, writeConfig } from "./config";
import { copyDir } from "./helpers";
import { buildPrerenderConfigs, execPrerender } from "./prerender";
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
  let nodeVersion!: NodeVersion;

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
          const destination = `${path.posix.resolve("/", curr.destination)}.func/index`;
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
          fileName: `${path.posix.resolve("/", entry.destination)}.func/.vc-config.json`,
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

        // TODO generate *.prerender-config.json when necessary

        //language=javascript
        return `
import { ${fn} } from "@universal-middleware/vercel";
import handler from "${input}";

return ${fn}(handler)();
`;
      }
    },

    generateBundle(options) {
      this.emitFile({
        type: "asset",
        fileName: "config.json",
        // TODO rewrites
        // TODO overrides
        // TODO headers
        source: JSON.stringify(getConfig(pluginConfig), undefined, 2),
      });
    },

    writeBundle: {
      order: "post",
      sequential: true,
      async handler() {
        const resolvedConfig = this.environment.config;

        // step 2:	Execute prerender
        const overrides = await execPrerender(resolvedConfig);

        // step 3:	Compute overrides for static HTML files
        const userOverrides = await computeStaticHtmlOverrides(resolvedConfig);

        // step 4:	Compile serverless functions to ".vercel/output/functions"
        const { rewrites, isr, headers } = await buildEndpoints(resolvedConfig);

        // step 5:	Generate prerender config files
        rewrites.push(...(await buildPrerenderConfigs(resolvedConfig, isr)));

        // step 6:	Generate config file
        await writeConfig(
          resolvedConfig,
          rewrites,
          {
            ...userOverrides,
            ...overrides,
          },
          headers,
        );

        // step 7: Copy dist folder to static
        await copyDistToStatic(resolvedConfig);
      },
    },
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

/**
 * Auto import `@vite-plugin-vercel/vike` if it is part of dependencies.
 * Ensures that `vike/plugin` is also present to ensure predictable behavior
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function tryImportVpvv(options: any) {
  try {
    // @ts-ignore
    await import("vike/plugin");
    // @ts-ignore
    const vpvv = await import("@vite-plugin-vercel/vike");
    return vpvv.default(options);
  } catch (e) {
    try {
      // @ts-ignore
      await import("vite-plugin-ssr/plugin");
      // @ts-ignore
      const vpvv = await import("@vite-plugin-vercel/vike");
      return vpvv.default(options);
    } catch (e) {
      return null;
    }
  }
}

// `smart` param only exist to circumvent a pnpm issue in dev
// See https://github.com/pnpm/pnpm/issues/3697#issuecomment-1708687974
// FIXME: Could be fixed by:
//  - shared-workspace-lockfile=false in .npmrc. See https://pnpm.io/npmrc#shared-workspace-lockfile
//  - Moving demo test in dedicated repo, with each a correct package.json
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default function allPlugins(options: any = {}): PluginOption[] {
  const { smart, ...rest } = options;
  return [vercelPluginCleanup(), vercelPlugin(), smart !== false ? tryImportVpvv(rest) : null];
}
