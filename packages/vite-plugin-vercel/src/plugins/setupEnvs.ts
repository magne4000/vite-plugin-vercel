import { cp } from "node:fs/promises";
import path from "node:path";
import { store } from "@universal-deploy/store";
import {
  BuildEnvironment,
  createRunnableDevEnvironment,
  type EnvironmentOptions,
  mergeConfig,
  type Plugin,
  type UserConfig,
} from "vite";
import { getConfig } from "../config.js";
import type { ViteVercelConfig } from "../types.js";
import { getBuildEnvNames } from "../utils/buildEnvs";
import { virtualEntry } from "../utils/const.js";
import { edgeConditions } from "../utils/edge.js";
import { edgeExternal } from "../utils/external.js";

const outDir = path.posix.join(process.cwd(), ".vercel/output");
const DUMMY = "__DUMMY__";

let injected = false;
export function setupEnvs(pluginConfig: ViteVercelConfig): Plugin[] {
  const envNames = getBuildEnvNames(pluginConfig);

  return [
    {
      name: "vite-plugin-vercel:setup-envs",

      buildApp: {
        order: "post",
        async handler(builder) {
          try {
            await builder.build(builder.environments[envNames.client]);
          } catch (e) {
            if (e instanceof Error && e.message.includes(`Could not resolve entry module "index.html"`)) {
              // ignore error
            } else {
              throw e;
            }
          }
          if (envNames.edge !== false) {
            await builder.build(builder.environments[envNames.edge]);
          }
          await builder.build(builder.environments[envNames.node]);
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

          const environments: UserConfig["environments"] = {};

          if (envNames.client) {
            environments[envNames.client] = {
              build: {
                outDir: path.join(pluginConfig.outDir ?? outDir, "static"),
                copyPublicDir: true,
                rollupOptions: {
                  input: getDummyInput(),
                },
              },
              consumer: "client",
            };
          }

          if (envNames.edge) {
            environments[envNames.edge] = createVercelEnvironmentOptions(outDirOverride);
          }

          if (envNames.node) {
            environments[envNames.node] = createVercelEnvironmentOptions(outDirOverride);
          }

          // rollup inputs are computed by the bundle plugin dynamically
          return {
            environments,
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
        return env.name === envNames.edge;
      },

      configEnvironment(name, config, env) {
        if (name !== envNames.edge) return;

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
        return env.name === envNames.node;
      },

      configEnvironment(name, config) {
        if (name !== envNames.node) return;

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
        return env.name === envNames.client;
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
