import type { Config } from "vike/types";

export default {
  name: "@vite-plugin-vercel/vike",
  meta: {
    isr: {
      env: { server: true },
    },
    edge: {
      env: { server: true },
    },
    // TODO
    // headers: {
    //   env: { server: true },
    // },
  },
} satisfies Config;
