import { defineConfig } from "tsup";

const entry = {
  index: "./src/plugins/index.ts",
  utils: "./src/utils/index.ts",
  api: "./src/api.ts",
  "universal-middleware-dev": "./src/photon/universal-middleware-dev.ts",
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
      banner: `/// <reference types="@photonjs/core/api" />\n`,
    },
  },
]);
