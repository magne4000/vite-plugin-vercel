import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default {
  plugins: [
    vercel({
      entries: [
        {
          input: "hono-entry.ts",
          // catch-all
          destination: "index",
          route: ".*",
          edge: Boolean(process.env.EDGE),
        },
      ],
    }),
  ],
} as UserConfig;
