import react from "@vitejs/plugin-react-swc";
import ssr from "vike/plugin";
import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

export default {
  plugins: [
    react(),
    ssr({
      prerender: true,
    }),
    vercel({
      expiration: 25,
      // Scan `_api` directory for entries, and map them to `/api/*`
      entries: [
        ...(await getEntriesFromFs("_api", {
          destination: "api",
        })),
        ...(await getEntriesFromFs("endpoints", {
          // Auto mapping:
          //   endpoints/edge.ts -> /edge
          //   endpoints/og-node.tsx -> /og-node
          //   endpoints/og-edge.tsx -> og-edge
          destination: "",
        })),
      ],
    }),
  ],
  // We manually add a list of dependencies to be pre-bundled, in order to avoid a page reload at dev start which breaks vike's CI
  // (The 'react/jsx-runtime' entry is not needed in Vite 3 anymore.)
  optimizeDeps: { include: ["cross-fetch", "react/jsx-runtime"] },
} as UserConfig;
