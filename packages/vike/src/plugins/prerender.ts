import { normalizePath, type Plugin } from "vite";
import { getVikeConfig } from "vike/plugin";
import path from "node:path";

export function prerenderPlugin(): Plugin[] {
  let vikePrerenderOutdir: string | undefined;

  return [
    {
      name: "vike-vercel:prerender:read-config",
      apply: "build",

      applyToEnvironment(env) {
        return env.name === "client";
      },

      closeBundle: {
        order: "post",
        handler() {
          // Read outDir while in client env, where prerendering is executed
          vikePrerenderOutdir = normalizePath(
            path.isAbsolute(this.environment.config.build.outDir)
              ? this.environment.config.build.outDir
              : path.posix.join(this.environment.config.root, this.environment.config.build.outDir),
          );
        },
      },

      sharedDuringBuild: true,
    },
    {
      name: "vike-vercel:prerender",
      apply: "build",

      applyToEnvironment(env) {
        return env.name === "vercel_client";
      },

      buildStart() {
        const vikeConfig = getVikeConfig(this.environment.config);
        if (vikeConfig?.prerenderContext?.output && vikePrerenderOutdir) {
          for (const file of vikeConfig.prerenderContext.output) {
            const is404 = Boolean(file.pageContext.is404);
            const key = is404 ? "404.html" : normalizePath(file.filePath).substring(vikePrerenderOutdir.length + 1);

            // Emit static HTML files in `vercel_client` env
            this.emitFile({
              type: "asset",
              fileName: key,
              originalFileName: key,
              source: file.fileContent,
            });
          }
        }
      },

      sharedDuringBuild: true,
    },
  ];
}
