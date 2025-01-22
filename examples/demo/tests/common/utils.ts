import os from "node:os";
import path from "node:path";
import { build, type InlineConfig, mergeConfig } from "vite";

export function getTmpDir(displayName: string) {
  return path.join(os.tmpdir(), `vpv-demo-${displayName}`);
}

export async function callBuild(config: InlineConfig) {
  await build(
    mergeConfig(config, {
      ...config,
      // build: {
      //   ssr: true,
      //   ...config.build,
      //   rollupOptions: {
      //     input: {
      //       "index.html": "tests/common/index.html",
      //     },
      //   },
      // },
      logLevel: "info",
    }),
  );
}
