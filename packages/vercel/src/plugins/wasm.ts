import type { Plugin } from "vite";

/**
 * .wasm?module files should only be imported on Vercel's Cloud Edge environment.
 * If imported locally or anywhere else, it means that packages resolution (based on `exports`) is incorrect.
 * .wasm?module is replaced by Vercel when deploying in Edge (and is the only way to load actual wasm files there).
 */
export function wasmPlugin(): Plugin {
  return {
    name: "vite-plugin-vercel:fix-wasm-module",
    enforce: "pre",

    resolveId: {
      order: "pre",
      async handler(id) {
        if (!id.endsWith(".wasm?module")) return;
        if (this.environment.name !== "vercel_edge") return;

        return {
          id,
          external: true,
        };
      },
    },
  };
}
