import type { Plugin } from "vite";
import { build } from "esbuild";

// We cannot disable code-splitting with Vite/Rollup,
// so we use esbuild when all files are written on the filesystem to bundle each functions.
export function bundlePlugin(): Plugin {
  return {
    name: "vike-vercel:bundle",
    enforce: "post",

    applyToEnvironment(env) {
      // We assume that vercel_client always runs last
      return env.name === "vercel_client";
    },

    closeBundle: {
      order: "post",
      async handler() {
        // TODO api.getVercelEntries()
        await build({
          platform: "browser",
          format: "esm",
          target: "es2022",

          bundle: true,
          // TODO put back esbuild plugins from v9 branch
          // external: configResolvedVike.server.external,
          entryPoints: [".vercel/output/_tmp/functions/edge.func/index.js"],
          // outExtension: { ".js": ".mjs" },
          outfile: ".vercel/output/functions/edge.func/index.js",
          // allowOverwrite: true,
          // metafile: true,
          logOverride: { "ignored-bare-import": "silent" },
        });
        console.log("BUILD COMPLETE");
      },
    },
  };
}
