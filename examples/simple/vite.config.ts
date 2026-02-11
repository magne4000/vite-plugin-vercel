import { defineConfig } from "vite";
import { getVercelEntries } from "vite-plugin-vercel";
import { vercel } from "vite-plugin-vercel/vite";

// Scan `src/routes` directory for entries
const routes = await getVercelEntries("src/routes", {
  destination: "",
});

export default defineConfig({
  plugins: [
    vercel({
      entries: routes,
    }),
  ],
});
