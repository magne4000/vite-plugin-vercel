import { cp } from "node:fs/promises";
import path from "node:path";
import { addEntry } from "@universal-deploy/store";
import {
  BuildEnvironment,
  createRunnableDevEnvironment,
  type EnvironmentOptions,
  mergeConfig,
  type Plugin,
  type ResolvedConfig,
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
              if (e instanceof Error && e.message.includes(`Could not resolve entry module "index.html"`)) {
                // vercel_client build failed (expected for frameworks without
                // index.html). We still need to copy the real client output
                // into .vercel/output/static/ so Vercel can serve SPA shell
                // files.
                await copyClientOutput(vercelClientEnv, pluginConfig);
              } else {
                throw e;
              }
            }
          }
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

          const topLevelConfig = this.environment.getTopLevelConfig();
          const clientEnv = topLevelConfig.environments.client;
          if (clientEnv) {
            const clientOutDir = clientEnv.build.outDir;
            const srcDir = path.isAbsolute(clientOutDir)
              ? clientOutDir
              : path.join(topLevelConfig.root, clientOutDir);
            const destDir = this.environment.config.build.outDir;

            // When vercel_client is the **only** client environment, srcDir and
            // destDir resolve to the same path. That means the files are
            // already in the right place, so we should skip the copy.
            if (path.resolve(srcDir) === path.resolve(destDir)) {
              return;
            }

            try {
              await cp(srcDir, destDir, {
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

async function copyClientOutput(
  vercelClientEnv: {
    getTopLevelConfig(): ResolvedConfig;
    config: { build: { outDir: string } };
  },
  pluginConfig: ViteVercelConfig,
) {
  const topLevelConfig = vercelClientEnv.getTopLevelConfig();
  if (!topLevelConfig) {
    return;
  }

  const clientEnv = topLevelConfig.environments?.client;
  if (!clientEnv) {
    return;
  }

  const clientOutDir = clientEnv.build.outDir;
  const srcDir = path.isAbsolute(clientOutDir)
    ? clientOutDir
    : path.join(topLevelConfig.root, clientOutDir);
  const destDir = path.join(pluginConfig.outDir ?? outDir, "static");

  // When vercel_client is the **only** client environment, srcDir and destDir
  // resolve to the same path. The files are already in the right place so we
  // should skip the copy.
  if (path.resolve(srcDir) === path.resolve(destDir)) {
    return;
  }

  try {
    await cp(srcDir, destDir, {
      recursive: true,
      force: true,
      dereference: true,
    });
  } catch (e) {
    // ENOENT is expected when the client build hasn't produced output yet
    if (!(e instanceof Error && e.message.includes("ENOENT"))) {
      throw e;
    }
  }
}
