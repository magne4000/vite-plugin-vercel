import os from "node:os";
import path from "node:path";
import { build, type InlineConfig } from "vite";

export function getTmpDir(displayName: string) {
  return path.join(os.tmpdir(), `vpv-demo-${displayName}`);
}

declare module "vite" {
  interface BuildOptions {
    vitePluginSsr?: {
      prerender?:
        | boolean
        | {
            noExtraDir?: boolean;
            parallel?: boolean | number;
            partial?: boolean;
            disableAutoRun?: boolean;
          };
      pageFiles?: { include?: string[] };
      disableAutoFullBuild?: boolean;
      includeCSS?: string[];
      includeAssetsImportedByServer?: boolean;
    };
  }
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
          addRoute: true,
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
