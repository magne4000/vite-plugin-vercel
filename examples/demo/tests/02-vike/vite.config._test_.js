import react from "@vitejs/plugin-react";
import vike from "vike/plugin";
import { plugins } from "vike-vercel/plugins";
import vercel from "vite-plugin-vercel";

export default {
  mode: "production",
  root: process.cwd(),
  plugins: [
    react(),
    vike(),
    vercel({
      outDir: getTmpDir(dirname),
      entries: [
        ...(await getEntriesFromFs("_api", {
          // Auto mapping:
          //   _api/page.ts -> /api/page
          //   _api/name/[name].ts -> /api/name/*
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
    plugins,
  ],
  // We manually add a list of dependencies to be pre-bundled, in order to avoid a page reload at dev start which breaks vike's CI
  // Also, react ones are here to fix issues while loading CJS
  optimizeDeps: { include: ["cross-fetch", "react/jsx-runtime", "react/jsx-dev-runtime"] },
};
