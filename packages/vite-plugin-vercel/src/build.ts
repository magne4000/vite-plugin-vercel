import type { NodeVersion } from "@vercel/build-utils";
import { vercelOutputVcConfigSchema } from "@vite-plugin-vercel/schemas";
import type { ViteVercelConfig } from "./types.js";

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
          shouldAddHelpers: false,
          supportsResponseStreaming: options.streaming ?? pluginConfig.defaultSupportsResponseStreaming ?? true,
        },
  );
}
