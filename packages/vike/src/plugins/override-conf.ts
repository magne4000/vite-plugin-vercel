import type { Plugin } from "vite";
import { getVercelAPI } from "vite-plugin-vercel/api";

export function overrideConfPlugin(): Plugin[] {
  return [
    {
      name: "vike-vercel:override-conf",
      apply: "build",

      buildStart: {
        order: "pre",
        handler() {
          this.environment.config.photon.server.vercel ??= {};
          // FIXME only for framework with code splitting, and it can be infered
          // We will only rely on `additionalServerConfigs` to generate all functions
          this.environment.config.photon.server.vercel.disabled = true;
          const api = getVercelAPI(this);
          // Override `vite-plugin-vercel` config
          api.defaultSupportsResponseStreaming = true;
        },
      },
    },
  ];
}
