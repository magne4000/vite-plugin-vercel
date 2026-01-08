import { catchAll, devServer } from "@universal-deploy/store/vite";
import type { ViteVercelConfig } from "../types.js";
import { apiPlugin } from "./api.js";
import { nf3BundlePlugin } from "./bundle/nf3.js";
import { vercelCleanupPlugin } from "./clean-outdir.js";
import { loaderPlugin } from "./loader.js";
import { reactEdgePlugin } from "./react-edge.js";
import { setupEnvs } from "./setupEnvs.js";

type PluginInterop = Record<string, unknown> & { name: string };
export function vercel(pluginConfig: ViteVercelConfig = {}): PluginInterop[] {
  return [
    reactEdgePlugin(),
    vercelCleanupPlugin(),
    apiPlugin(pluginConfig),
    ...setupEnvs(pluginConfig),
    ...loaderPlugin(pluginConfig),
    ...nf3BundlePlugin(),
    catchAll(),
    devServer(),
  ] as PluginInterop[];
}

export default vercel;
