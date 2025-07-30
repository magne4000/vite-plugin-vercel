import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

export default defineConfig({
  plugins: [
    vercel({
      // Scan `_api` directory for entries, and map them to `/api/*`
      entries: await getEntriesFromFs("_api", {
        destination: "api",
      }),
    }),
  ],
});
