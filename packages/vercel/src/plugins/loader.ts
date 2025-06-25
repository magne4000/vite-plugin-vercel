import type { Plugin } from "vite";
import { photonEntryDestination, photonEntryDestinationDefault } from "../utils/destination";
import { getVcConfig } from "../build";
import type { ViteVercelConfig } from "../types";
import { getNodeVersion, type NodeVersion } from "@vercel/build-utils";
import { assert } from "../assert";
import path from "node:path";
import { getPhotonMeta } from "@photonjs/core/api";
import type { Photon } from "@photonjs/core";
import { vercelOutputPrerenderConfigSchema } from "@vite-plugin-vercel/schemas";

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

    async resolveId(id) {
      if (id.startsWith(virtualEntry)) {
        const [, , , ..._input] = id.split(":");
        const input = _input.join(":");
        if (input === DUMMY) {
          return `${resolvedVirtualEntry}:${DUMMY}`;
        }
        const resolved = await this.resolve(input, undefined, { isEntry: true });
        if (resolved) {
          return `${resolvedVirtualEntry}:${resolved.id}`;
        }
      }
    },

    async load(id) {
      if (id.startsWith(resolvedVirtualEntry)) {
        if (id.includes(DUMMY)) {
          return "export default {};";
        }

        const [, , , ..._input] = id.split(":");
        const input = _input.join(":");

        const entry = await getPhotonMeta(this, input);
        const isEdge = Boolean(entry.vercel?.edge);

        // Generate .vc-config.json
        this.emitFile({
          type: "asset",
          fileName: photonEntryDestination(entry, ".func/.vc-config.json"),
          source: JSON.stringify(
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
                ? rou3ToPathtoregex(entry.route)
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

        //language=javascript
        return `
          import { ${fn} } from "photon:resolve-from-photon:${importFrom}";
          import handler from "${entry.resolvedId ?? entry.id}";

          export default ${fn}(() => handler)();
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

function rou3ToPathtoregex(rou3route: string) {
  return rou3route
    .split("/")
    .map((segment) =>
      segment
        .replace(/^\*$/g, ":splat?")
        .replace(/^\*\*$/g, ":splat*")
        .replace(/^\*\*:([^/]+)$/g, ":$1*")
        .replace(/^:([^/]+)$/g, ":$1"),
    )
    .join("/");
}
