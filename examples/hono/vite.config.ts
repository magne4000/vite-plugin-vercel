import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default defineConfig({
  plugins: [vercel()],
  photon: {
    server: "./hono-entry.ts",
  },
});
