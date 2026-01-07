import type { EntryMeta } from "@universal-deploy/store";
import type { Plugin } from "vite";
import { createAPI, type ViteVercelOutFile } from "../api";
import type { ViteVercelConfig } from "../types.js";
import { dedupeRoutes } from "../utils/dedupeRoutes";
import { entryDestination } from "../utils/destination.js";
import { removeExtension } from "../utils/extension";

export function apiPlugin(pluginConfig: ViteVercelConfig): Plugin {
  const outfiles: ViteVercelOutFile[] = [];

  return {
    name: "vite-plugin-vercel:api",

    api() {
      return createAPI(outfiles, pluginConfig);
    },

    applyToEnvironment({ name }) {
      return name === "vercel_edge" || name === "vercel_node";
    },

    // Compute outfiles for the API
    writeBundle(_opts, bundle) {
      const root = this.environment.config.root ?? process.cwd();
      const entryMapByDestination = new Map<string, EntryMeta>(
        dedupeRoutes().map((e) => [entryDestination(root, e, ".func/index"), e]),
      );

      for (const [key, value] of Object.entries(bundle)) {
        if (value.type === "chunk" && entryMapByDestination.has(removeExtension(key))) {
          outfiles.push({
            type: "chunk",
            root: this.environment.config.root,
            outdir: this.environment.config.build.outDir,
            filepath: key,
            // biome-ignore lint/style/noNonNullAssertion: guarded by entryMap.has(...)
            relatedEntry: entryMapByDestination.get(removeExtension(key))!,
          });
        } else if ((value.type === "asset" && key.startsWith("functions/")) || key === "config.json") {
          outfiles.push({
            type: "asset",
            root: this.environment.config.root,
            outdir: this.environment.config.build.outDir,
            filepath: key,
          });
        }
      }
    },

    sharedDuringBuild: true,
  };
}
