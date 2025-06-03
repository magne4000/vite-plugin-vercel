import type { ViteVercelConfig } from "../types";
import type { PluginOption } from "vite";
import { vercelCleanupPlugin } from "./clean-outdir";
import { wasmPlugin } from "./wasm";
import { apiPlugin } from "./api";
import { bundlePlugin } from "./bundle";
import { installPhoton, photon } from "@photonjs/core/vite";
import { configPlugin } from "./config";
import { loaderPlugin } from "./loader";
import { devServerPlugin } from "./devServer";

export function vercel(pluginConfig: ViteVercelConfig): PluginOption[] {
  return [
    vercelCleanupPlugin(),
    wasmPlugin(),
    devServerPlugin(),
    apiPlugin(pluginConfig),
    configPlugin(pluginConfig),
    loaderPlugin(pluginConfig),
    ...bundlePlugin(pluginConfig),
    photon({
      handlers: pluginConfig.handlers,
      server: pluginConfig.server,
      devServer: {
        env: "vercel_node",
      },
    }),
    ...installPhoton("vite-plugin-vercel"),
  ];
}

export default vercel;
