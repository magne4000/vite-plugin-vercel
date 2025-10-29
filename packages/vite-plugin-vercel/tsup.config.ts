import { defineConfig } from "tsup";

const entry = {
  index: "./src/vite.ts",
  utils: "./src/utils.ts",
  api: "./src/api.ts",
  types: "./src/types.ts",
  "universal-middleware-dev": "./src/universal-middleware-dev.ts",
  "universal-middleware-prod": "./src/universal-middleware-prod.ts",
};

export default defineConfig([
  {
    entry,
    external: ["esbuild"],
    format: "esm",
    platform: "node",
    target: "es2022",
    dts: {
      entry,
      compilerOptions: {
        paths: {},
      },
    },
  },
]);
