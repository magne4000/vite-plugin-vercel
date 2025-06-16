import react from "@vitejs/plugin-react";
import { plugins } from "vike-vercel/plugins";
import vike from "vike/plugin";
import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

export default {
  plugins: [
    react(),
    vike(),
    vercel({
      expiration: 25,
      handlers: {
        ...(await getEntriesFromFs("endpoints", {
          // Auto mapping:
          //   endpoints/edge.ts -> /edge
          //   endpoints/og-node.tsx -> /og-node
          //   endpoints/og-edge.tsx -> /og-edge
          //   endpoints/api/isr.ts -> /api/isr
          //   etc...
          destination: "",
        })),
      },
    }),
    plugins,
  ],
  // We manually add a list of dependencies to be pre-bundled to avoid a page reload at dev start which breaks vike's CI
  // Also, react ones are here to fix issues while loading CJS
  optimizeDeps: { include: ["cross-fetch", "react/jsx-runtime", "react/jsx-dev-runtime"] },
} as UserConfig;
