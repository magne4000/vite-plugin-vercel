import react from "@vitejs/plugin-react";
import vike from "vike/plugin";
import type { UserConfig } from "vite";

export default {
  plugins: [react(), vike()],
  // We manually add a list of dependencies to be pre-bundled to avoid a page reload at dev start which breaks vike's CI
  // Also, react ones are here to fix issues while loading CJS
  optimizeDeps: { include: ["react/jsx-runtime", "react/jsx-dev-runtime"] },
} as UserConfig;
