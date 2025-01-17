import os from "node:os";
import path from "node:path";
import { type InlineConfig, build } from "vite";

export function getTmpDir(displayName: string) {
  return path.join(os.tmpdir(), `vpv-demo-${displayName}`);
}

export async function callBuild(dirname: string, config: InlineConfig) {
  const tmpdir = getTmpDir(dirname);

  await build({
    ...config,
    vercel: {
      ...config.vercel,
      additionalEndpoints: [
        {
          source: "endpoints/edge.ts",
          destination: "edge",
          route: true,
        },
        ...(config.vercel?.additionalEndpoints ?? []),
      ],
      outDir: tmpdir,
    },
    build: {
      ssr: true,
      ...config.build,
      rollupOptions: {
        input: {
          "index.html": "tests/common/index.html",
        },
      },
    },
    logLevel: "info",
  });
}
