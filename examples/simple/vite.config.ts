import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

const routes = await getEntriesFromFs("src/routes", {
  destination: "",
});

// Override root route
routes.root.route = "/";

export default defineConfig({
  plugins: [
    vercel({
      // Scan `src` directory for entries, and map them to `/*`
      entries: routes,
    }),
  ],
});
