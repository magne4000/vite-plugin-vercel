import type { Plugin } from "vite";

export function wasmPlugin(): Plugin {
  return {
    name: "vite-plugin-vercel:fix-wasm-module",
    enforce: "pre",

    resolveId: {
      order: "pre",
      async handler(id, importer, options) {
        if (!id.endsWith(".wasm?module")) return;
        if (this.environment.name !== "vercel-edge") return;

        return {
          id,
          external: true,
        };
      },
    },
  };
}
