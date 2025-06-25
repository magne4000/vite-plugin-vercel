import type { Photon } from "@photonjs/core";
import type { PluginContext } from "rollup";

export function getServersWithConfig(pluginContext: PluginContext) {
  return pluginContext.environment.config.photon.additionalServerConfigs.map((config, i) =>
    getServerWithConfig(pluginContext.environment.config.photon.server, config, i),
  );
}

export function getServerWithConfig(
  server: Photon.EntryServer,
  config: Omit<Photon.EntryBase, "id" | "resolvedId">,
  key: number,
) {
  const id = `photon:server-entry-with-config:${key}`;
  const serverEntry: Photon.EntryServer = Object.assign({}, server, config, {
    id,
    resolvedId: id,
  });
  serverEntry.vercel ??= {};
  // biome-ignore lint/performance/noDelete: <explanation>
  delete serverEntry.vercel.disabled;
  Object.assign(serverEntry.vercel, config?.vercel);
  return serverEntry;
}
