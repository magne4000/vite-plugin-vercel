import type { PluginContext } from "rollup";
import type { Plugin, ViteDevServer } from "vite";
import { assert } from "./assert";
import type { VercelOutputConfig, ViteVercelConfig } from "./types";

export function createAPI(outfiles: ViteVercelOutFile[], pluginConfig: ViteVercelConfig) {
  return {
    /**
     * @internal
     */
    getOutFiles(): ViteVercelOutFile[] {
      return outfiles;
    },
    get config(): Partial<Omit<VercelOutputConfig, "version">> {
      pluginConfig.config ??= {};
      return pluginConfig.config;
    },
    get defaultMaxDuration() {
      return pluginConfig.defaultMaxDuration;
    },
    set defaultMaxDuration(value) {
      pluginConfig.defaultMaxDuration = value;
    },
    get expiration() {
      return pluginConfig.expiration;
    },
    set expiration(value) {
      pluginConfig.expiration = value;
    },
    get rewrites() {
      pluginConfig.rewrites ??= [];
      return pluginConfig.rewrites;
    },
    get headers() {
      pluginConfig.headers ??= [];
      return pluginConfig.headers;
    },
    get redirects() {
      pluginConfig.redirects ??= [];
      return pluginConfig.redirects;
    },
    get cleanUrls() {
      return pluginConfig.cleanUrls;
    },
    set cleanUrls(value) {
      pluginConfig.cleanUrls = value;
    },
    get trailingSlash() {
      return pluginConfig.trailingSlash;
    },
    set trailingSlash(value) {
      pluginConfig.trailingSlash = value;
    },
    get defaultSupportsResponseStreaming() {
      return pluginConfig.defaultSupportsResponseStreaming;
    },
    set defaultSupportsResponseStreaming(value) {
      pluginConfig.defaultSupportsResponseStreaming = value;
    },
  };
}

export function getVercelAPI(pluginContextOrServer: PluginContext | ViteDevServer) {
  const config =
    "environment" in pluginContextOrServer ? pluginContextOrServer.environment.config : pluginContextOrServer.config;
  const vpv: Plugin<(pluginContext?: PluginContext) => ViteVercelApi> | undefined = config.plugins.find(
    (p) => p.name === "vite-plugin-vercel:api",
  );
  assert(vpv, "Could not find vite-plugin-vercel:api plugin");
  assert(vpv.api, "Missing `api`. Make sure vite-plugin-vercel is up-to-date");

  return vpv.api("environment" in pluginContextOrServer ? pluginContextOrServer : undefined);
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
  relatedEntry: Photon.Entry;
}

export interface ViteVercelOutFileAsset extends ViteVercelOutFileCommon {
  type: "asset";
}
