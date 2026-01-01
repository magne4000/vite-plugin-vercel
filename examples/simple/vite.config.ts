import { defineConfig } from "vite";
import { getVercelEntries } from "vite-plugin-vercel";

const routes = await getVercelEntries("src/routes", {
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
