import { defineConfig, type UserConfig as TsdownOptions } from "tsdown";

const commonOptions = {
  format: ["esm"],
  target: "es2022",
  dts: true,
  outDir: "dist",
  treeshake: true,
  nodeProtocol: true,
  fixedExtension: false,
  external: [/^virtual:photon:get-middlewares:/, /^@photonjs\/core\/dev/, /^@photonjs\/vercel/],
} satisfies TsdownOptions;

export default defineConfig([
  {
    ...commonOptions,
    platform: "node",
    entry: {
      index: "./src/index.ts",
      vite: "./src/plugins/index.ts",
      api: "./src/api.ts",
      types: "./src/types.ts",
    },
  },
]);
