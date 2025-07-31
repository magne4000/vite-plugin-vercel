import { getNodeVersion, type NodeVersion } from "@vercel/build-utils";
import { vercelOutputPrerenderConfigSchema } from "@vite-plugin-vercel/schemas";
import type { Plugin } from "vite";
import { assert } from "../assert";
import { getVcConfig } from "../build";
import type { ViteVercelConfig } from "../types";
import { photonEntryDestination, photonEntryDestinationDefault } from "../utils/destination";
import { fromRou3 } from "convert-route/rou3";
import { toPathToRegexpV6 } from "convert-route/path-to-regexp-v6";
import { entryToPathtoregex } from "../utils/route";
import { targetLoader } from "@photonjs/core/vite";

const DUMMY = "__DUMMY__";
const re_DUMMY = new RegExp(`${DUMMY}$`);
const nonEdgeServers = ["express", "fastify"];

export function loaderPlugin(pluginConfig: ViteVercelConfig): Plugin[] {
  let nodeVersion: NodeVersion;

  return [
    // TODO create another plugin for "smart mode",
    // where handlers are grouped by configuration
    {
      name: "vite-plugin-vercel:update-entries",
      apply: "build",

      buildStart: {
        order: "post",
        handler() {
          for (const entry of [this.environment.config.photon.server, ...this.environment.config.photon.entries]) {
            if (!entry.env) {
              entry.env = entry.vercel?.edge ? "vercel_edge" : "vercel_node";
            }
            if (entry.env === "vercel_edge" || entry.env === "vercel_node") {
              entry.target = `${photonEntryDestination(entry, ".func/index")}.js`;
            }
          }
        },
      },

      sharedDuringBuild: true,
    },
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
          return "export default {};";
        },
      },
    },
    ...targetLoader("vercel", {
      async buildStart() {
        nodeVersion = await getNodeVersion(process.cwd());
      },

      applyToEnvironment(env) {
        return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
      },

      async load(_id, { meta }) {
        const entry = meta;
        const isEdge = Boolean(entry.vercel?.edge);

        // Generate .vc-config.json
        this.emitFile({
          type: "asset",
          fileName: photonEntryDestination(entry, ".func/.vc-config.json"),
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
            fileName: photonEntryDestination(entry, ".prerender-config.json"),
            source: JSON.stringify(vercelOutputPrerenderConfigSchema.parse(entry.vercel.isr), undefined, 2),
          });
        }

        // Generate rewrites
        if (entry.route || entry.vercel?.route) {
          pluginConfig.rewrites ??= [];
          // TODO create a helper
          const source =
            typeof entry.vercel?.route === "string"
              ? `(${entry.vercel.route})`
              : typeof entry.route === "string"
                ? toPathToRegexpV6(fromRou3(entry.route))
                : entryToPathtoregex(entry);
          pluginConfig.rewrites.push({
            enforce: entry.vercel?.enforce,
            source,
            destination:
              typeof entry.vercel?.route === "string"
                ? `/${photonEntryDestinationDefault(entry)}?__original_path=$1`
                : `/${photonEntryDestinationDefault(entry)}`,
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

        const fn = isEdge ? "createEdgeHandler" : "createNodeHandler";
        const isServerEntry = entry.type === "server";

        if (isServerEntry) {
          assert(entry.server, `Could not determine server for entry ${entry.id}`);
          // TODO dynamically import the potential module and check if it exports expected function
          if (isEdge) {
            assert(
              !nonEdgeServers.includes(entry.server),
              `${entry.server} is not compatible with Vercel Edge target. Either use another server like Hono or change target to Node`,
            );
          }
        }

        const importFrom = isServerEntry
          ? `@universal-middleware/vercel/${entry.server}`
          : "@universal-middleware/vercel";

        const exportDefault = isServerEntry
          ? `export default ${fn}(handlerOrApp)`
          : `export default ${fn}(() => handlerOrApp)()`;

        //language=javascript
        return `
import { ${fn} } from "photon:resolve-from-photon:${importFrom}";
import handlerOrApp from "${entry.resolvedId ?? entry.id}";

${exportDefault};
`;
      },
    }),
  ];
}
