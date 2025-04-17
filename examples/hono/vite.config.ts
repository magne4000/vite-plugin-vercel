import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default {
  plugins: [
    vercel({
      entries: {
        index: {
          id: "hono-entry.ts",
          // catch-all
          vercel: {
            destination: "index",
            route: ".*",
            edge: Boolean(process.env.EDGE),
          },
        },
      },
    }),
  ],
} as UserConfig;
