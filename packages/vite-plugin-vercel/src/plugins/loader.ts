import { getNodeVersion } from "@vercel/build-utils";
import { vercelOutputPrerenderConfigSchema } from "@vite-plugin-vercel/schemas";
import { toPathToRegexpV6 } from "convert-route/path-to-regexp-v6";
import { fromRou3 } from "convert-route/rou3";
import type { Plugin } from "vite";
import { getVcConfig } from "../build.js";

import type { ViteVercelConfig } from "../types.js";
import { dedupeRoutes } from "../utils/dedupeRoutes";
import { entryDestination, entryDestinationDefault } from "../utils/destination.js";

const DUMMY = "__DUMMY__";
const re_DUMMY = new RegExp(`${DUMMY}$`);

export function loaderPlugin(pluginConfig: ViteVercelConfig): Plugin[] {
  let root: string | undefined;
  return [
    {
      name: "vite-plugin-vercel:dummy",
      enforce: "pre",

      resolveId: {
        filter: {
          id: re_DUMMY,
        },

        handler(id) {
          return id;
        },
      },

      load: {
        filter: {
          id: re_DUMMY,
        },

        handler() {
          // console.log avoids warning "Generated an empty chunk"
          return "console.log('');export default {};";
        },
      },
    },
    {
      name: "vite-plugin-vercel:build-functions",
      apply: "build",

      applyToEnvironment(env) {
        return env.name === "vercel_node" || env.name === "vercel_edge";
      },

      config: {
        order: "post",
        handler(config) {
          root = config.root;
        },
      },

      configEnvironment: {
        order: "post",
        handler(name) {
          const isEdge = name === "vercel_edge";
          if (name === "vercel_node" || isEdge) {
            const entries = dedupeRoutes().filter((e) => (e.vercel?.edge ?? false) === isEdge);
            return {
              build: {
                rollupOptions: {
                  input: Object.fromEntries(
                    entries.map((e) => [entryDestination(root ?? process.cwd(), e, ".func/index"), e.id]),
                  ),
                  output: {
                    // Avoids empty imports at the top of entry chunks
                    hoistTransitiveImports: false,
                  },
                },
              },
            };
          }
        },
      },

      async buildStart() {
        const isEdge = this.environment.name === "vercel_edge";
        const nodeVersion = await getNodeVersion(process.cwd());
        const entries = dedupeRoutes();

        for (const entry of entries.filter((e) => (e.vercel?.edge ?? false) === isEdge)) {
          const isEdge = this.environment.name === "vercel_edge";

          // Generate .vc-config.json
          this.emitFile({
            type: "asset",
            fileName: entryDestination(root ?? process.cwd(), entry, ".func/.vc-config.json"),
            source: JSON.stringify(
              // Unpredictable things happen when the extension is .mjs on edge
              getVcConfig(pluginConfig, isEdge ? "index.js" : "index.mjs", {
                nodeVersion,
                edge: isEdge,
                streaming: entry.vercel?.streaming,
              }),
              undefined,
              2,
            ),
          });

          // Generate *.prerender-config.json when necessary
          if (entry.vercel?.isr) {
            this.emitFile({
              type: "asset",
              fileName: entryDestination(root ?? process.cwd(), entry, ".prerender-config.json"),
              source: JSON.stringify(vercelOutputPrerenderConfigSchema.parse(entry.vercel.isr), undefined, 2),
            });
          }

          // Append patterns rewrites
          pluginConfig.rewrites ??= [];
          for (const pattern of [entry.pattern].flat()) {
            // FIXME assume rou3 routes for now
            const route = pattern as string;
            const source = toPathToRegexpV6(fromRou3(route));

            pluginConfig.rewrites.push({
              enforce: entry.vercel?.enforce,
              source,
              destination: `/${entryDestinationDefault(root ?? process.cwd(), entry)}`,
            });

            // Generate headers
            if (entry.vercel?.headers) {
              pluginConfig.headers ??= [];
              pluginConfig.headers.push({
                source,
                headers: Object.entries(entry.vercel.headers).map(([key, value]) => ({
                  key,
                  value,
                })),
              });
            }
          }

          // FIXME can we get rid of this?
          // Append additional rewrite rules
          // if (entry.vercel?.route) {
          //   const source =
          //     typeof entry.vercel?.route === "string" ? `(${entry.vercel.route})` : entryToPathtoregex(entry);
          //   pluginConfig.rewrites.push({
          //     enforce: entry.vercel?.enforce,
          //     source,
          //     destination:
          //       typeof entry.vercel?.route === "string"
          //         ? `/${photonEntryDestinationDefault(entry)}?__original_path=$1`
          //         : `/${photonEntryDestinationDefault(entry)}`,
          //   });
          // }
        }
      },

      sharedDuringBuild: true,
    },
  ];
}
