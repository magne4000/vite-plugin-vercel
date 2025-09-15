import { defineConfig } from "tsup";

const entry = {
  index: "./src/plugins/index.ts",
  utils: "./src/utils/index.ts",
  api: "./src/api.ts",
  types: "./src/types.ts",
  "universal-middleware-dev": "./src/photon/universal-middleware-dev.ts",
  "universal-middleware-prod": "./src/photon/universal-middleware-prod.ts",
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
      banner: `/// <reference types="@photonjs/core" />\n`,
    },
  },
]);
