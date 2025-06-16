import vikeReact from "vike-react/config";
import vikeVercel from "vike-vercel/config";
import type { Config } from "vike/types";
import { Layout } from "../components/Layout";

export default {
  prerender: true,
  Layout,
  vite6BuilderApp: true,
  extends: [vikeReact, vikeVercel],
  photon: {
    server: {
      id: "hono-entry.ts",
      type: "server",
      // catch-all
      vercel: {
        destination: "index",
        route: ".*",
        edge: Boolean(process.env.EDGE),
      },
    },
  },
} satisfies Config;
