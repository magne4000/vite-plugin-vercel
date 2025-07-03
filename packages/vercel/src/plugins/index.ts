import type { ViteVercelConfig } from "../types";
import type { PluginOption } from "vite";
import { vercelCleanupPlugin } from "./clean-outdir";
import { wasmPlugin } from "./wasm";
import { apiPlugin } from "./api";
import { bundlePlugin } from "./bundle";
import { installPhoton } from "@photonjs/core/vite";
import { setupEnvs } from "./setupEnvs";
import { loaderPlugin } from "./loader";

export function vercel(pluginConfig: ViteVercelConfig = {}): PluginOption[] {
  const additionalConfig: Record<string, unknown> = {};
  if (pluginConfig.handlers) {
    additionalConfig.handlers = pluginConfig.handlers;
  }
  if (pluginConfig.server) {
    additionalConfig.server = pluginConfig.server;
  }

  return [
    ...installPhoton("vite-plugin-vercel", {
      ...additionalConfig,
      // FIXME avoid duplicate plugins
      fullInstall: true,
      defaultBuildEnv: "vercel_node",
      devServer: {
        env: "vercel_node",
      },
      resolveMiddlewares(env) {
        if (env === "dev") {
          return "vite-plugin-vercel/universal-middleware/dev";
        }
      },
    }),
    vercelCleanupPlugin(),
    apiPlugin(pluginConfig),
    ...setupEnvs(pluginConfig),
    wasmPlugin(),
    loaderPlugin(pluginConfig),
    ...bundlePlugin(pluginConfig),
  ];
}

export default vercel;
