import { installPhoton } from "@photonjs/runtime/vite";
import type { PluginOption } from "vite";
import type { ViteVercelConfig } from "../types";
import { apiPlugin } from "./api";
import { bundlePlugin } from "./bundle";
import { vercelCleanupPlugin } from "./clean-outdir";
import { loaderPlugin } from "./loader";
import { setupEnvs } from "./setupEnvs";
import { wasmPlugin } from "./wasm";

export function vercel(pluginConfig: ViteVercelConfig = {}): PluginOption[] {
  const additionalConfig: Record<string, unknown> = {};
  if (pluginConfig.entries) {
    additionalConfig.entries = pluginConfig.entries;
  }
  if (pluginConfig.server) {
    additionalConfig.server = pluginConfig.server;
  }

  return [
    ...installPhoton("vite-plugin-vercel", {
      ...additionalConfig,
      defaultBuildEnv: "vercel_node",
      codeSplitting: {
        target: true,
      },
      devServer: {
        env: "vercel_node",
      },
      resolveMiddlewares(env) {
        if (env === "dev") {
          return "vite-plugin-vercel/universal-middleware/dev";
        }
        return "vite-plugin-vercel/universal-middleware";
      },
    }),
    vercelCleanupPlugin(),
    apiPlugin(pluginConfig),
    ...setupEnvs(pluginConfig),
    wasmPlugin(),
    ...loaderPlugin(pluginConfig),
    ...bundlePlugin(pluginConfig),
  ];
}

export default vercel;
