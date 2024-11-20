import { defineConfig } from "tsup";

const entry = {
  index: "./src/index.ts",
  "universal-middleware": "./src/universal-middleware.ts",
};

export default defineConfig([
  {
    entry,
    external: ["esbuild", "vike"],
    format: ["esm", "cjs"],
    platform: "node",
    target: "node18",
    dts: {
      entry,
      compilerOptions: {
        paths: {},
      },
    },
  },
]);
