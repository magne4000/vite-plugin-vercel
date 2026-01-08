import { cp } from "node:fs/promises";
import path from "node:path";
import { store } from "@universal-deploy/store";
import {
  BuildEnvironment,
  createRunnableDevEnvironment,
  type EnvironmentOptions,
  mergeConfig,
  type Plugin,
} from "vite";
import { getConfig } from "../config.js";
import type { ViteVercelConfig } from "../types.js";
import { virtualEntry } from "../utils/const.js";
import { edgeConditions } from "../utils/edge.js";
import { edgeExternal } from "../utils/external.js";

const outDir = path.posix.join(process.cwd(), ".vercel/output");
const DUMMY = "__DUMMY__";

let injected = false;
export function setupEnvs(pluginConfig: ViteVercelConfig): Plugin[] {
  return [
    {
      name: "vite-plugin-vercel:setup-envs",

      buildApp: {
        order: "post",
        async handler(builder) {
          try {
            await builder.build(builder.environments.vercel_client);
          } catch (e) {
            if (e instanceof Error && e.message.includes(`Could not resolve entry module "index.html"`)) {
              // ignore error
            } else {
              throw e;
            }
          }
          await builder.build(builder.environments.vercel_edge);
          await builder.build(builder.environments.vercel_node);
        },
      },

      config: {
        order: "post",
        handler() {
          if (!injected) {
            injected = true;
            if (pluginConfig.entries) {
              store.entries.push(...pluginConfig.entries);
            }
          }

          const outDirOverride: EnvironmentOptions = pluginConfig.outDir
            ? {
                build: {
                  outDir: pluginConfig.outDir,
                },
              }
            : {};

          // rollup inputs are computed by the bundle plugin dynamically
          return {
            environments: {
              vercel_edge: createVercelEnvironmentOptions(outDirOverride),
              vercel_node: createVercelEnvironmentOptions(outDirOverride),
              vercel_client: {
                build: {
                  outDir: path.join(pluginConfig.outDir ?? outDir, "static"),
                  copyPublicDir: true,
                  rollupOptions: {
                    input: getDummyInput(),
                  },
                },
                consumer: "client",
              },
            },
            // Required for environments to be taken into account
            builder: {},
          };
        },
      },

      sharedDuringBuild: true,
    },
    {
      name: "vite-plugin-vercel:setup-envs:vercel_edge",
      applyToEnvironment(env) {
        return env.name === "vercel_edge";
      },

      configEnvironment(name, config, env) {
        if (name !== "vercel_edge") return;

        const isDev = env.command === "serve";
        // In dev, we're running on node, so we do not apply edge conditions
        const conditions = !isDev
          ? {
              conditions: edgeConditions,
            }
          : {};

        return {
          resolve: {
            external: edgeExternal,
            ...conditions,
          },
          build: {
            target: "es2022",
            rollupOptions: {
              input: {},
              treeshake: {
                preset: "smallest",
              },
            },
          },
          optimizeDeps: {
            ...config.optimizeDeps,
            // biome-ignore lint/suspicious/noExplicitAny: vite@8 types
            ...((this.meta as any).rolldownVersion
              ? {
                  rolldownOptions: {
                    target: "es2022",
                    format: "esm",
                  },
                }
              : {
                  esbuildOptions: {
                    target: "es2022",
                    format: "esm",
                  },
                }),
          },
        };
      },

      generateBundle: {
        order: "post",
        async handler(_opts, bundle) {
          cleanupDummy(bundle);
        },
      },

      sharedDuringBuild: true,
    },
    {
      name: "vite-plugin-vercel:setup-envs:vercel_node",
      applyToEnvironment(env) {
        return env.name === "vercel_node";
      },

      configEnvironment(name, config) {
        if (name !== "vercel_node") return;

        return {
          optimizeDeps: {
            ...config.optimizeDeps,
          },
        };
      },

      generateBundle: {
        order: "post",
        async handler(_opts, bundle) {
          cleanupDummy(bundle);

          // Generate config.json
          this.emitFile({
            type: "asset",
            fileName: "config.json",
            source: JSON.stringify(getConfig(pluginConfig), undefined, 2),
          });
        },
      },

      sharedDuringBuild: true,
    },
    {
      name: "vite-plugin-vercel:setup-envs:vercel_client",
      applyToEnvironment(env) {
        return env.name === "vercel_client";
      },

      generateBundle: {
        async handler(_opts, bundle) {
          cleanupDummy(bundle);

          const topLevelConfig = this.environment.getTopLevelConfig();
          const clientEnv = topLevelConfig.environments.client;
          if (clientEnv) {
            try {
              await cp(path.join(topLevelConfig.root, clientEnv.build.outDir), this.environment.config.build.outDir, {
                recursive: true,
                force: true,
                dereference: true,
              });
            } catch (e) {
              if (e instanceof Error && e.message.includes("ENOENT")) {
                // ignore
              } else throw e;
            }
          }
        },
      },

      sharedDuringBuild: true,
    },
  ];
}

function createVercelEnvironmentOptions(overrides?: EnvironmentOptions): EnvironmentOptions {
  return mergeConfig(
    {
      dev: {
        async createEnvironment(name, config) {
          return createRunnableDevEnvironment(name, config);
        },
      },
      build: {
        createEnvironment(name, config) {
          return new BuildEnvironment(name, config);
        },
        outDir,
        copyPublicDir: false,
        rollupOptions: {
          input: getDummyInput(),
          output: {
            sanitizeFileName: false,
            sourcemap: false,
          },
        },
        target: "es2022",
        emptyOutDir: false,
        emitAssets: true,
      },

      consumer: "server",

      keepProcessEnv: true,
    } satisfies EnvironmentOptions,
    overrides ?? {},
  );
}

function getDummyInput(): Record<string, string> {
  // Workaround to be able to have a complete build process even without entries.
  // __DUMMY__ is deleted from the bundle before being written.
  return { [DUMMY]: `${virtualEntry}:${DUMMY}` };
}

function cleanupDummy(bundle: Record<string, unknown>) {
  // Vite usually replaces __ by _
  const dummy = Object.keys(bundle).find((key) => key.includes("_DUMMY_"));
  if (dummy) {
    delete bundle[dummy];
  }
}
