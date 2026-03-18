import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { ViteVercelConfig } from "../types";

const outDir = path.posix.join(process.cwd(), ".vercel/output");

export function vercelCleanupPlugin(pluginConfig: ViteVercelConfig): Plugin {
  let alreadyRun = false;
  return {
    apply: "build",
    name: "vite-plugin-vercel:cleanup",
    enforce: "pre",

    buildStart: {
      order: "pre",
      sequential: true,
      handler() {
        if (alreadyRun) return;
        alreadyRun = true;
        cleanOutputDirectory(pluginConfig.outDir ?? outDir);
      },
    },

    sharedDuringBuild: true,
  };
}

function cleanOutputDirectory(outdir: string) {
  fs.rmSync(outdir, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(outdir, { recursive: true });
}
