import type { Photon } from "@photonjs/core";
import type { Config } from "vike/types";
import { vercel } from "vite-plugin-vercel";
import { vikeVercel } from "./plugins";

export default {
  name: "vike-vercel",
  require: {
    vike: ">=0.4.238",
  },
  vite: {
    // biome-ignore lint/suspicious/noExplicitAny: avoid type mismatch between different Vite versions
    plugins: [vercel(), vikeVercel] as any[],
  },
  extends: ["import:vike-server/config"],
  meta: {
    isr: {
      env: { server: true, config: true },
      eager: true,
      effect({ configValue }) {
        // an actual ISR value exists for a Page
        if (configValue) {
          return {
            prerender: false,
          };
        }
      },
    },
    edge: {
      env: { server: true, config: true },
      eager: true,
    },
    headers: {
      env: { server: true, config: true },
      eager: true,
    },
    photon: {
      env: { config: true },
      global: true,
    },
  },
  prerender: {
    enable: null,
    partial: true,
    keepDistServer: true,
  },
} satisfies Config;

declare global {
  namespace Vike {
    export interface Config {
      isr?: boolean | { expiration: number };
      edge?: boolean;
      headers?: Record<string, string>;
      photon?: Photon.Config;
    }
  }
}
