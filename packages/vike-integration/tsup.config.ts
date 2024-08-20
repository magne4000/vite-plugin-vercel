import { defineConfig } from "tsup";
import { rename } from "node:fs/promises";
import { existsSync } from "node:fs";

export default defineConfig([
  {
    clean: true,
    entry: ["./vike.ts", "./templates/helpers.ts", "./+config.ts"],
    external: ["esbuild", "rollup", "vite", "vike"],
    format: ["esm"],

    platform: "node",
    target: "node18",
    dts: {
      entry: ["./vike.ts", "./templates/helpers.ts", "./+config.ts"],
    },
    async onSuccess() {
      // rollup-plugin-dts chooses to rename things its way
      // and tsup doesn't wait for dts to be done to trigger this callback...
      // so https://github.com/egoist/tsup/issues/700#issuecomment-1499745933

      const start = Date.now();

      // timeout after 5 seconds
      while (start + 5000 > Date.now()) {
        if (existsSync("./dist/_config.d.ts")) {
          break;
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 250);
        });
      }

      await rename("./dist/_config.d.ts", "./dist/+config.d.ts");
    },
  },
]);
