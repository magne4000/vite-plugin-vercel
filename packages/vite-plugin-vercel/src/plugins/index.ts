import { catchAll, devServer } from "@universal-deploy/store/vite";
import type { ViteVercelConfig } from "../types.js";
import { apiPlugin } from "./api.js";
import { bundlePlugin } from "./bundle.js";
import { vercelCleanupPlugin } from "./clean-outdir.js";
import { loaderPlugin } from "./loader.js";
import { setupEnvs } from "./setupEnvs.js";
import { wasmPlugin } from "./wasm.js";

type PluginInterop = Record<string, unknown> & { name: string };
export function vercel(pluginConfig: ViteVercelConfig = {}): PluginInterop[] {
  return [
    vercelCleanupPlugin(),
    apiPlugin(pluginConfig),
    ...setupEnvs(pluginConfig),
    wasmPlugin(),
    ...loaderPlugin(pluginConfig),
    ...bundlePlugin(),
    catchAll(),
    devServer(),
  ] as PluginInterop[];
}

export default vercel;
