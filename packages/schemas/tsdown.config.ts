import { defineConfig } from "tsdown";

const entry = {
  index: "./src/index.ts",
};

export default defineConfig([
  {
    entry,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    dts: true,
  },
]);
