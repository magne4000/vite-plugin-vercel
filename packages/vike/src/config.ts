import type { Config } from "vike/types";
import { plugins } from "./plugins";

export default {
  name: "vike-vercel",
  require: {
    vike: ">=0.4.227",
  },
  vite: {
    plugins: [...plugins],
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
  },
  prerender: {
    partial: true,
  },
  server: {
    entry: "virtual:vike-cloudflare:auto-entry",
    // We're using rollup's noExternal instead
    // @ts-ignore
    standalone: false,
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
    interface ConfigResolved {
      server?: {
        entry: string;
      }[];
    }
  }
}
