import type { Config } from "vike/types";

declare global {
  namespace Vike {
    export interface Config {
      isr?: boolean | { expiration: number };
      edge?: boolean;
      headers?: Record<string, string>;
    }
  }
}

export default {
  name: "vike-vercel",
  require: {
    // FIXME should be >=0.4.224 when released
    vike: ">=0.4.223",
  },
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
} satisfies Config;
