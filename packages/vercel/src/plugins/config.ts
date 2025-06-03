import {
  BuildEnvironment,
  createRunnableDevEnvironment,
  type Environment,
  type EnvironmentOptions,
  mergeConfig,
  type Plugin,
} from "vite";
import type { ViteVercelConfig, ViteVercelRouteOverrides } from "../types";
import { resolvePhotonConfig } from "@photonjs/core/api";
import path from "node:path";
import { photonEntryDestination } from "../utils/destination";
import { vercelBuildApp } from "../api";
import { getConfig } from "../config";
import { joinAbsolute } from "../helpers";
import fs from "node:fs/promises";

const outDir = ".vercel/output";
const DUMMY = "__DUMMY__";

function createVercelEnvironmentOptions(
  input: Record<string, string>,
  extension: "js" | "mjs",
  overrides?: EnvironmentOptions,
): EnvironmentOptions {
  return mergeConfig(
    {
      resolve: {
        noExternal: true,
      },
      dev: {
        async createEnvironment(name, config) {
          return createRunnableDevEnvironment(name, config);
        },
      },
      build: {
        createEnvironment(name, config) {
          return new BuildEnvironment(name, config);
        },
        outDir: path.posix.join(outDir, "_tmp"),
        copyPublicDir: false,
        rollupOptions: {
          input,
          output: {
            entryFileNames() {
              return `[name].${extension}`;
            },
            sanitizeFileName: false,
            sourcemap: false,
          },
        },
        target: "es2022",
        emptyOutDir: false,
      },

      consumer: "server",

      keepProcessEnv: true,
    } satisfies EnvironmentOptions,
    overrides ?? {},
  );
}

export function configPlugin(pluginConfig: ViteVercelConfig): Plugin {
  const virtualEntry = "virtual:vite-plugin-vercel:entry";

  return {
    name: "vite-plugin-vercel:config",

    applyToEnvironment(env) {
      return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
    },

    config(config, env) {
      const photon = resolvePhotonConfig(config.photon);
      const outDirOverride: EnvironmentOptions = pluginConfig.outDir
        ? {
            build: {
              outDir: path.posix.join(pluginConfig.outDir, "_tmp"),
            },
          }
        : {};

      // TODO handle photon.server
      const inputs = Object.values(photon.handlers).reduce(
        (acc, curr) => {
          const destination = photonEntryDestination(curr, ".func/index");
          if (curr.vercel?.edge) {
            // .vercel/output/**/*.func/index.js
            acc.edge[destination] = `${virtualEntry}:${curr.id}`;
          } else {
            // .vercel/output/**/*.func/index.mjs
            acc.node[destination] = `${virtualEntry}:${curr.id}`;
          }

          return acc;
        },
        { node: {} as Record<string, string>, edge: {} as Record<string, string> },
      );

      const environments: Record<string, EnvironmentOptions> = {};

      // vercel_edge
      if (Object.keys(inputs.edge).length > 0) {
        // See https://vercel.com/docs/functions/runtimes/edge#compatible-node.js-modules
        const external = ["async_hooks", "events", "buffer", "assert", "util"];
        // In dev, we're running on node, so we do not apply edge conditions
        const conditions =
          env.command === "build"
            ? {
                conditions: ["edge-light", "worker", "browser", "module", "import", "require"],
              }
            : {};
        environments.vercel_edge = createVercelEnvironmentOptions(
          inputs.edge,
          "js",
          mergeConfig<EnvironmentOptions, EnvironmentOptions>(
            {
              resolve: {
                external: [...external, ...external.map((e) => `node:${e}`)],
                ...conditions,
              },
              optimizeDeps: {
                ...config.optimizeDeps,
                esbuildOptions: {
                  target: "es2022",
                  format: "esm",
                },
              },
            },
            outDirOverride,
          ),
        );
      }

      // vercel_node
      environments.vercel_node = createVercelEnvironmentOptions(
        {
          // Workaround to be able to have a complete build process even without entries.
          // __DUMMY__ is deleted from the bundle before being written.
          [DUMMY]: `${virtualEntry}:${DUMMY}`,
          ...inputs.node,
        },
        "mjs",
        mergeConfig<EnvironmentOptions, EnvironmentOptions>(
          {
            optimizeDeps: {
              ...config.optimizeDeps,
            },
          },
          outDirOverride,
        ),
      );

      // vercel_client
      environments.vercel_client = {
        build: {
          outDir: path.join(pluginConfig.outDir ?? outDir, "static"),
          copyPublicDir: true,
        },
        consumer: "client",
      };

      return {
        builder: {
          buildApp: async (builder) => {
            await vercelBuildApp(builder);
          },
        },
        environments,
      };
    },

    generateBundle: {
      order: "post",
      async handler(_opts, bundle) {
        const dummy = Object.keys(bundle).find((key) => key.includes(DUMMY));
        if (dummy) {
          delete bundle[dummy];
        }

        // Compute overrides for static HTML files
        const userOverrides = await computeStaticHtmlOverrides(this.environment);
        // Update overrides with static files paths
        pluginConfig.config ??= {};
        pluginConfig.config.overrides ??= {};
        Object.assign(pluginConfig.config.overrides, userOverrides);

        if (this.environment.name === "vercel_node") {
          // Generate config.json
          this.emitFile({
            type: "asset",
            fileName: "config.json",
            source: JSON.stringify(getConfig(pluginConfig), undefined, 2),
          });
        }
      },
    },

    sharedDuringBuild: true,
  };
}

async function computeStaticHtmlOverrides(env: Environment): Promise<NonNullable<ViteVercelRouteOverrides>> {
  if (env.name === "vercel_client") {
    const outDir = joinAbsolute(env, env.config.build.outDir);
    // public files copied by vite by default https://vitejs.dev/guide/assets.html#the-public-directory
    const copyPublicDir = env.getTopLevelConfig().build.copyPublicDir;
    if (copyPublicDir) {
      const publicDir = env.getTopLevelConfig().publicDir;
      const publicFiles = await getStaticHtmlFiles(publicDir);
      const files = publicFiles.map((f) => f.replace(publicDir, outDir));

      return files.reduce(
        (acc, curr) => {
          const relPath = path.relative(outDir, curr);
          const parsed = path.parse(relPath);
          const pathJoined = path.join(parsed.dir, parsed.name);
          acc[relPath] = {
            path: pathJoined,
          };
          return acc;
        },
        {} as NonNullable<ViteVercelRouteOverrides>,
      );
    }
  }

  return {};
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
