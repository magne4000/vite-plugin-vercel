import { readFileSync } from "fs";
import { writeFileSync } from "node:fs";
import { copyFile, readFile } from "node:fs/promises";
import path, { join, resolve } from "node:path";
import { findRoot } from "@manypkg/find-root";
import { nodeFileTrace } from "@vercel/nft";
import { build, type Plugin as ESBuildPlugin } from "esbuild";
import type { Plugin } from "vite";
import { getAPI } from "../api";

const edgeWasmPlugin: ESBuildPlugin = {
  name: "edge-wasm-vercel",
  setup(build) {
    build.onResolve({ filter: /\.wasm/ }, (args) => {
      return {
        path: args.path.replace(/\.wasm\?module$/i, ".wasm"),
        external: true,
      };
    });
  },
};

interface BundleAsset {
  env: string;
  root: string;
  outDir: string;
  fileName: string;
  outFile: string;
}

// We cannot disable code-splitting with Vite/Rollup,
// so we use esbuild when all files are written on the filesystem to bundle each functions.
export function bundlePlugin(): Plugin {
  const bundledAssets = new Map<string, BundleAsset>();

  return {
    name: "vite-plugin-vercel:bundle",
    enforce: "post",

    generateBundle(_opts, bundle) {
      for (const b of Object.values(bundle)) {
        if (b.type === "asset") {
          const originalFileNames = b.originalFileNames.map((relativePath) =>
            resolve(this.environment.config.root, relativePath),
          );

          const asset: BundleAsset = {
            env: this.environment.name,
            root: this.environment.config.root,
            outDir: this.environment.config.build.outDir,
            outFile: join(this.environment.config.root, this.environment.config.build.outDir, b.fileName),
            fileName: b.fileName,
          };

          for (const originalFileName of originalFileNames) {
            bundledAssets.set(originalFileName, asset);
          }
        }
      }
    },

    closeBundle: {
      order: "post",
      async handler() {
        // We assume that vercel_client always runs last
        if (this.environment.name !== "vercel_client") return;

        console.log("ASSETS", bundledAssets);

        const api = getAPI(this);

        // console.log("api.getOutFiles()", api.getOutFiles());

        await build({
          platform: "browser",
          format: "esm",
          target: "es2022",

          bundle: true,
          // TODO put back esbuild plugins from v9 branch
          // external: configResolvedVike.server.external,
          entryPoints: [".vercel/output/_tmp/functions/og-edge.func/index.js"],
          // outExtension: { ".js": ".mjs" },
          outfile: ".vercel/output/functions/og-edge.func/index.js",
          // allowOverwrite: true,
          // metafile: true,
          logOverride: { "ignored-bare-import": "silent" },

          plugins: [edgeWasmPlugin],
        });

        let base = this.environment.config.root;
        try {
          const dir = await findRoot(this.environment.config.root);
          base = dir.rootDir;
        } catch (e) {
          // ignore error
        }

        const entry = path.join(process.cwd(), "endpoints/og-edge.tsx");

        const { fileList, reasons } = await nodeFileTrace([entry], {
          base,
          processCwd: this.environment.config.root,
          mixedModules: true,
          ignore: [
            "**/node_modules/react{,-dom,-dom-server-turbopack}/**/*.development.js",
            "**/*.d.ts",
            "**/*.map",
            "**/node_modules/webpack5/**/*",
          ],
          async readFile(filepath) {
            if (filepath.endsWith(".ts") || filepath.endsWith(".tsx")) {
              const result = await build({
                target: "es2022",
                format: "esm",
                platform: "node",
                logLevel: "info",
                logOverride: {
                  "ignored-bare-import": "verbose",
                  "require-resolve-not-external": "verbose",
                },
                minify: false,
                plugins: [],
                define: {
                  "process.env.NODE_ENV": '"production"',
                  "import.meta.env.NODE_ENV": '"production"',
                },
                entryPoints: [entry],
                bundle: false,
                write: false,
              });

              return result.outputFiles[0].text;
            }

            return readFile(filepath, "utf-8");
          },
        });

        for (const file of fileList) {
          if (
            reasons.has(file) &&
            reasons.get(file)?.type.includes("asset") &&
            !file.endsWith(".js") &&
            !file.endsWith(".cjs") &&
            !file.endsWith(".mjs") &&
            !file.endsWith("package.json")
          ) {
            const absolutePath = join(base, file);

            // @vercel/nft needs to scan the original entries in order to find missing assets.
            // But Vite already did a pass, and assets imports can have qlready been rewritten.
            // If so, instead of using the original filename found by @vercel/nft,
            // we use the one generated by Vite.
            const assetRenamedByVite = bundledAssets.get(absolutePath);

            console.log("COPY", absolutePath, assetRenamedByVite);

            const basename = path.basename(assetRenamedByVite ? assetRenamedByVite.fileName : absolutePath);

            if (assetRenamedByVite) {
              // Edit imports in-place to make them relative
              writeFileSync(
                ".vercel/output/functions/og-edge.func/index.js",
                readFileSync(".vercel/output/functions/og-edge.func/index.js", "utf-8").replaceAll(
                  `/${assetRenamedByVite.fileName}`,
                  `./${path.basename(assetRenamedByVite.fileName)}`,
                ),
              );
            }

            await copyFile(
              absolutePath,
              path.join(this.environment.config.root, ".vercel/output/functions/og-edge.func", basename),
            );
          }
        }

        console.log("BUILD COMPLETE");
      },
    },

    sharedDuringBuild: true,
  };
}
