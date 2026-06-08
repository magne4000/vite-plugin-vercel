import { cp } from "node:fs/promises";
import path from "node:path";
import { addEntry } from "@universal-deploy/store";
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
          const vercelClientEnv = builder.environments[envNames.client];

          if (!vercelClientEnv.isBuilt) {
            try {
              await builder.build(vercelClientEnv);
            } catch (e) {
              // vercel_client builds from a dummy entry, so a missing index.html
              // is expected and harmless — copyClientOutput copies the real
              // client output regardless of whether this build produced any.
              if (!(e instanceof Error && e.message.includes(`Could not resolve entry module "index.html"`))) {
                throw e;
              }
            }
          }
          await copyClientOutput(vercelClientEnv);

          if (envNames.edge !== false && !builder.environments[envNames.edge].isBuilt) {
            await builder.build(builder.environments[envNames.edge]);
          }
          if (!builder.environments[envNames.node].isBuilt) {
            await builder.build(builder.environments[envNames.node]);
          }
        },
      },

      config: {
        order: "post",
        handler() {
          if (!injected) {
            injected = true;
            if (pluginConfig.entries) {
              pluginConfig.entries.forEach((entry) => {
                addEntry(entry);
              });
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
                emptyOutDir: false,
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
              treeshake: true,
            },
            rolldownOptions: {},
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
            sanitizeFileName: (filename) => {
              return filename.replace("\0", "_");
            },
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

// Copies the framework's client output into Vercel's static directory so it is
// served as the SPA shell.
async function copyClientOutput(vercelClientEnv: BuildEnvironment) {
  const topLevelConfig = vercelClientEnv.getTopLevelConfig();
  const srcDir = path.resolve(topLevelConfig.root, topLevelConfig.environments.client.build.outDir);
  const destDir = path.resolve(topLevelConfig.root, vercelClientEnv.config.build.outDir);

  // When vercel_client is the only client environment, src and dest are the
  // same directory and the output is already where Vercel expects it.
  if (srcDir === destDir) return;

  try {
    await cp(srcDir, destDir, { recursive: true, force: true, dereference: true });
  } catch (e) {
    // The client environment may not have produced any output to copy.
    if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
  }
}
