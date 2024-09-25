import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["./src/index.ts"],
    external: ["esbuild", "vike"],
    format: ["esm", "cjs"],
    platform: "node",
    target: "node18",
    dts: {
      entry: "./src/index.ts",
      compilerOptions: {
        paths: {}
      }
    },
  },
]);
