import type { NodeVersion } from "@vercel/build-utils";
import type { ViteVercelConfig } from "./types";
import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";

export function getVcConfig(
  pluginConfig: ViteVercelConfig,
  filename: string,
  options: {
    edge: boolean;
    nodeVersion: NodeVersion;
    streaming?: boolean;
  },
) {
  return vercelOutputVcConfigSchema.parse(
    options.edge
      ? {
          runtime: "edge",
          entrypoint: filename,
        }
      : {
          runtime: options.nodeVersion.runtime,
          handler: filename,
          maxDuration: pluginConfig.defaultMaxDuration,
          launcherType: "Nodejs",
          shouldAddHelpers: true,
          supportsResponseStreaming: options.streaming ?? pluginConfig.defaultSupportsResponseStreaming,
        },
  );
}
