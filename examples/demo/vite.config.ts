import react from "@vitejs/plugin-react-swc";
import vike from "vike/plugin";
import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default {
  plugins: [react(), vike(), vercel()],
  vercel: {
    expiration: 25,
    additionalEndpoints: [
      {
        source: "endpoints/edge.ts",
        destination: "edge",
        route: true,
      },
      {
        source: "endpoints/og-node.tsx",
        destination: "og-node",
        route: true,
      },
      {
        source: "endpoints/og-edge.tsx",
        destination: "og-edge",
        route: true,
      },
    ],
  },
  // We manually add a list of dependencies to be pre-bundled, in order to avoid a page reload at dev start which breaks vike's CI
  // (The 'react/jsx-runtime' entry is not needed in Vite 3 anymore.)
  optimizeDeps: { include: ["cross-fetch", "react/jsx-runtime"] },
} as UserConfig;
