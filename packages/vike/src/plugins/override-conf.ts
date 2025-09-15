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
          const api = getVercelAPI(this);
          // Override `vite-plugin-vercel` config
          api.defaultSupportsResponseStreaming = true;
        },
      },
    },
  ];
}
