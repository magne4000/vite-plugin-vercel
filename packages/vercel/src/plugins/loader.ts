import type { Plugin } from "vite";
import { photonEntryDestination, photonEntryDestinationDefault } from "../utils/destination";
import { getVcConfig } from "../build";
import type { ViteVercelConfig } from "../types";
import { getNodeVersion, type NodeVersion } from "@vercel/build-utils";
import { vercelOutputPrerenderConfigSchema } from "../schemas/config/prerender-config";
import { assert } from "../assert";
import path from "node:path";
import { isPhotonMeta } from "@photonjs/core/api";

const DUMMY = "__DUMMY__";
const nonEdgeServers = ["express", "fastify"];

export function loaderPlugin(pluginConfig: ViteVercelConfig): Plugin {
  const virtualEntry = "virtual:vite-plugin-vercel:entry";
  const resolvedVirtualEntry = "\0virtual:vite-plugin-vercel:entry";
  let nodeVersion: NodeVersion;

  return {
    name: "vite-plugin-vercel:loader",

    async buildStart() {
      nodeVersion = await getNodeVersion(process.cwd());
    },

    applyToEnvironment(env) {
      return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
    },

    resolveId(id) {
      if (id.startsWith(virtualEntry)) {
        return `\0${id}`;
      }
    },

    async load(id) {
      if (id.startsWith(resolvedVirtualEntry)) {
        if (id.includes(DUMMY)) {
          return "export default {};";
        }

        const entries = this.environment.config.photon.handlers;

        const isEdge = this.environment.name === "vercel_edge";
        const fn = isEdge ? "createEdgeHandler" : "createNodeHandler";
        const [, , , ..._input] = id.split(":");
        const input = _input.join(":");

        const entry = Object.values(entries).find((e) => e.id === input);

        if (!entry) {
          throw new Error(`Unable to find entry for "${input}"`);
        }

        // Generate .vc-config.json
        const filename = entry.vercel?.edge ? "index.js" : "index.mjs";
        this.emitFile({
          type: "asset",
          fileName: photonEntryDestination(entry, ".func/.vc-config.json"),
          source: JSON.stringify(
            getVcConfig(pluginConfig, filename, {
              nodeVersion,
              edge: Boolean(entry.vercel?.edge),
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
        if (entry.vercel?.route) {
          pluginConfig.rewrites ??= [];
          const source = typeof entry.vercel.route === "string" ? `(${entry.vercel.route})` : entryToPathtoregex(entry);
          pluginConfig.rewrites.push({
            enforce: entry.vercel?.enforce,
            source,
            destination:
              typeof entry.vercel.route === "string"
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

        const resolved = await this.resolve(input, undefined, {
          isEntry: true,
        });
        assert(resolved, `Failed to resolve input ${input}`);

        let appToHandler = (app: string) => app;

        if (isPhotonMeta(resolved.meta)) {
          // Ensures photon meta is up to date!
          await this.load({ ...resolved, resolveDependencies: true });

          if (resolved.meta.photon.type === "server") {
            if (isEdge) {
              assert(
                nonEdgeServers.includes(resolved.meta.photon.server),
                `${resolved.meta.photon.server} is not compatible with Vercel Edge target. Either use another server like Hono or change target to Node`,
              );
            }
            // Convert server to Universal Handler

            switch (resolved.meta.photon.server) {
              case "hono": {
                appToHandler = (app) => `${app}.handler`;
                break;
              }
              // TODO implement other compatible servers, and probably move that into UM or Photon
              default:
                assert(
                  false,
                  `${resolved.meta.photon.server} is not compatible with Vercel. Use a compatible server like Hono`,
                );
            }
          }
          // Otherwise, fallback to Universal Handler
        }

        //language=javascript
        return `
          import { ${fn} } from "vite-plugin-vercel/universal-middleware";
          import handler from "${resolved.id}";

          export default ${fn}(() => ${appToHandler("handler")})();
        `;
      }
    },

    sharedDuringBuild: true,
  };
}

// @vercel/routing-utils respects path-to-regexp syntax
function entryToPathtoregex(entry: Photon.Entry) {
  assert(typeof entry.vercel?.route !== "string", "Do not pass entry with route string to entryToPathtoregex");
  return path.posix
    .resolve("/", photonEntryDestinationDefault(entry))
    .split("/")
    .map((segment) =>
      segment
        .replace(/^\[\[\.\.\.([^/]+)\]\]$/g, ":$1*")
        .replace(/^\[\[([^/]+)\]\]$/g, ":$1?")
        .replace(/^\[\.\.\.([^/]+)\]$/g, ":$1+")
        .replace(/^\[([^/]+)\]$/g, ":$1"),
    )
    .join("/");
}
