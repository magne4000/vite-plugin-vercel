import path from "node:path";
import type { PluginContext } from "rollup";
import type { Plugin } from "vite";
import { assert } from "./assert";
import type { ViteVercelEntry } from "./types";

export function createAPI(entries: ViteVercelEntry[], outfiles: ViteVercelOutFile[], pluginContext: PluginContext) {
  return {
    emitVercelEntry(entry: ViteVercelEntry) {
      entries.push(entry);
      return pluginContext.emitFile({
        type: "chunk",
        fileName: `${path.posix.join("functions/", entry.destination)}.func/index.${entry.edge ? "js" : "mjs"}`,
        id: `virtual:vite-plugin-vercel:entry:${entry.input}`,
        importer: undefined,
      });
    },
    getOutFiles(): ViteVercelOutFile[] {
      assert(outfiles.length > 0, "getOutFiles() must be called after all outputs have been generated");

      return outfiles;
    },
  };
}

export function getAPI(pluginContext: PluginContext) {
  const vpv: Plugin<(pluginContext: PluginContext) => ViteVercelApi> | undefined =
    pluginContext.environment.config.plugins.find((p) => p.name === "vite-plugin-vercel");
  assert(vpv, "Could not find vite-plugin-vercel plugin");
  assert(vpv.api, "Missing `api`. Make sure vite-plugin-vercel is up-to-date");

  return vpv.api(pluginContext);
}

export type ViteVercelApi = ReturnType<typeof createAPI>;

export type ViteVercelOutFile = ViteVercelOutFileChunk | ViteVercelOutFileAsset;

interface ViteVercelOutFileCommon {
  filepath: string;
  root: string;
  outdir: string;
}

export interface ViteVercelOutFileChunk extends ViteVercelOutFileCommon {
  type: "chunk";
  relatedEntry: ViteVercelEntry;
}

export interface ViteVercelOutFileAsset extends ViteVercelOutFileCommon {
  type: "asset";
}
