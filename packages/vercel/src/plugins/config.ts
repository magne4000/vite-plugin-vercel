import {
  BuildEnvironment,
  createRunnableDevEnvironment,
  type EnvironmentOptions,
  mergeConfig,
  type Plugin,
} from "vite";
import type { ViteVercelConfig } from "../types";
import { resolvePhotonConfig } from "@photonjs/core/api";
import path from "node:path";
import { photonEntryDestination } from "../utils/destination";
import { getConfig } from "../config";

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

    buildApp: {
      order: "post",
      async handler(builder) {
        await builder.build(builder.environments.vercel_client);
        await builder.build(builder.environments.vercel_edge);
        await builder.build(builder.environments.vercel_node);
      },
    },

    config(config, env) {
      const isDev = env.command === "serve";
      const photon = resolvePhotonConfig(config.photon);
      const outDirOverride: EnvironmentOptions = pluginConfig.outDir
        ? {
            build: {
              outDir: path.posix.join(pluginConfig.outDir, "_tmp"),
            },
          }
        : {};

      // A handler is either attached to a server, or standalone
      const inputs = Object.values(photon.handlers).reduce(
        (acc, curr) => {
          const destination = photonEntryDestination(curr, ".func/index");
          const nodeOrEdge = curr.vercel?.edge ? "edge" : "node";
          acc[nodeOrEdge][destination] = isDev
            ? // In dev, all entries are loaded under a unique instance of the server
              `${virtualEntry}:${curr.id}`
            : // In prod, each entry is wrapped with the server entry
              `${virtualEntry}:${photon.server}?photonCondition=${nodeOrEdge}&photonHandlerId=${curr.id}`;

          curr.env ??= `vercel_${nodeOrEdge}`;

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
        const conditions = !isDev
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
