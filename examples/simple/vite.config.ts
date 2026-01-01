import { defineConfig } from "vite";
import { getEntriesFromFs } from "vite-plugin-vercel";
import vercel from "vite-plugin-vercel/vite";

const routes = await getEntriesFromFs("src/routes", {
  destination: "",
});

export default defineConfig({
  plugins: [
    vercel({
      // Scan `src/routes` directory for entries, and map them to `/*`
      entries: routes,
    }),
  ],
});
