import type { ViteVercelConfig } from "../types";

export function getBuildEnvNames(pluginConfig: ViteVercelConfig) {
  return {
    client: pluginConfig.viteEnvNames?.client ?? "vercel_client",
    edge: pluginConfig.viteEnvNames?.edge ?? "vercel_edge",
    node: pluginConfig.viteEnvNames?.node ?? "vercel_node",
  };
}
