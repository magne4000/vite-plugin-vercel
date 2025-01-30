import react from "@vitejs/plugin-react-swc";
import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default {
  plugins: [
    react(),
    vercel({
      entries: [
        {
          input: "hono-entry.ts",
          // catch-all
          destination: "index",
          route: ".*",
        },
      ],
    }),
  ],
} as UserConfig;
