import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export function vercelCleanupPlugin(): Plugin {
  let alreadyRun = false;

  return {
    apply: "build",
    name: "vite-plugin-vercel:cleanup",
    enforce: "pre",

    applyToEnvironment(env) {
      return env.name === "vercel_edge" || env.name === "vercel_node";
    },

    writeBundle: {
      order: "pre",
      sequential: true,
      handler() {
        if (alreadyRun) return;
        alreadyRun = true;
        const absoluteOutdir = path.join(this.environment.config.root, this.environment.config.build.outDir);
        cleanOutputDirectory(absoluteOutdir.endsWith("_tmp") ? path.dirname(absoluteOutdir) : absoluteOutdir);
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
