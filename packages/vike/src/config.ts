import type { Config } from "vike/types";
import { plugins } from "./plugins";
import photon from "@photonjs/core/vite";
import { vikeServer } from "vike-server/plugin";

export default {
  name: "vike-vercel",
  require: {
    vike: ">=0.4.227",
  },
  vite: {
    // biome-ignore lint/suspicious/noExplicitAny: avoid type mismatch between different Vite versions
    plugins: [...plugins, photon(), vikeServer()] as any[],
  },
  extends: ["import:vike-server/config"],
  meta: {
    isr: {
      env: { server: true, config: true },
      eager: true,
      effect({ configValue, configDefinedAt }) {
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
    server: {
      env: { config: true },
      global: true,
    },
  },
  prerender: {
    partial: true,
  },
} satisfies Config;

declare global {
  namespace Vike {
    export interface Config {
      isr?: boolean | { expiration: number };
      edge?: boolean;
      headers?: Record<string, string>;
      server?: {
        entry: string;
      };
    }
  }
}
