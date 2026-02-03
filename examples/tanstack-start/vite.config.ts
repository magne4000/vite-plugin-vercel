import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { compat } from "@universal-deploy/store/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";
import { defineConfig, type Plugin } from "vite";
import { vercel } from "vite-plugin-vercel/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // Auto extraction of entries from rollupOption.input (which is set by tanstack-start)
    compat() as Plugin,
    // Currently, tanstack-start does not support building multiple server envs
    vercel({
      viteEnvNames: {
        node: "ssr",
        edge: false,
        client: "client",
      },
    }),
  ],
});

export default config;
