import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default {
  plugins: [
    vercel({
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
    }),
  ],
} as UserConfig;
