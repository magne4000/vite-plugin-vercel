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
  meta: {
    isr: {
      env: { server: true },
    },
    edge: {
      env: { server: true },
    },
    headers: {
      env: { server: true },
    },
  },
} satisfies Config;
