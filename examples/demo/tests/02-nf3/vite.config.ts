import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { getVercelEntries } from "vite-plugin-vercel";
import { vercel } from "vite-plugin-vercel/vite";
import { minimalReactSsrPlugin } from "../../vite-common";

// Scan `src/routes` directory for entries
const routes = await getVercelEntries("src/routes", {
  destination: "",
});

export default defineConfig({
  plugins: [
    react(),
    vercel({
      entries: routes,
      bundleStrategy: "nf3",
    }),
    minimalReactSsrPlugin(),
  ],
});
