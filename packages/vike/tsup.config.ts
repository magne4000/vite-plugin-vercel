import { defineConfig } from "tsup";

const entry = {
  index: "./src/index.ts",
  plugins: "./src/plugins/index.ts",
  config: "./src/config.ts",
};

export default defineConfig([
  {
    clean: true,
    entry,
    external: ["esbuild", "vike"],
    format: "esm",
    platform: "node",
    target: "node20",
    dts: {
      entry,
      compilerOptions: {
        paths: {},
      },
    },
  },
]);
