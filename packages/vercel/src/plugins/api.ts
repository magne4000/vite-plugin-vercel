import type { Plugin, } from "vite";
import type { ViteVercelConfig } from "../types";
import { createAPI, type ViteVercelOutFile } from "../api";
import { photonEntryDestination } from "../utils/destination";

export function apiPlugin(pluginConfig: ViteVercelConfig): Plugin {
  const outfiles: ViteVercelOutFile[] = [];

  return {
    name: "vite-plugin-vercel:api",

    api() {
      return createAPI(outfiles, pluginConfig);
    },

    // Compute outfiles for the API
    writeBundle(_opts, bundle) {
      if (this.environment.name !== "vercel_edge" && this.environment.name !== "vercel_node") return;

      const entries = this.environment.config.photon.handlers;
      const entryMapByDestination = new Map(
        Object.values(entries).map((e) => [photonEntryDestination(e, ".func/index"), e]),
      );

      for (const [key, value] of Object.entries(bundle)) {
        if (value.type === "chunk" && value.isEntry && entryMapByDestination.has(removeExtension(key))) {
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

function removeExtension(subject: string) {
  return subject.replace(/\.[^/.]+$/, "");
}
