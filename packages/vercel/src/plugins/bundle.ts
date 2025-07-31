import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { findRoot } from "@manypkg/find-root";
import { nodeFileTrace } from "@vercel/nft";
import { build, type BuildOptions, type Plugin as ESBuildPlugin } from "esbuild";
import type { Environment, Plugin } from "vite";
import { getVercelAPI, type ViteVercelOutFile, type ViteVercelOutFileChunk } from "../api";
import { joinAbsolute, joinAbsolutePosix } from "../helpers";
import type { ViteVercelConfig } from "../types";
import { isVercelLastBuildStep } from "../utils/env";
import { edgeExternal } from "../utils/external";
import { edgeConditions } from "../utils/edge";
import { builtinModules } from "node:module";

const builtIns = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));

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

// Treat dynamic imports of native modules as external
const dynamicNativeImportPlugin: ESBuildPlugin = {
  name: "edge-dynamic-import-native",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.kind === "dynamic-import" && builtIns.has(args.path)) {
        return { path: args.path, external: true };
      }
    });
  },
};

const reactEdgePlugin: ESBuildPlugin = {
  name: "react-edge-plugin",
  setup(build) {
    build.onResolve({ filter: /^react-dom\/server$/ }, (args) => {
      const { path: _, ...rest } = args;
      return build.resolve("react-dom/server.edge", rest);
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
// so we use esbuild when all files are written on the filesystem to bundle each function.
export function bundlePlugin(pluginConfig: ViteVercelConfig): Plugin[] {
  const bundledAssets = new Map<string, BundleAsset>();

  return [
    {
      name: "vite-plugin-vercel:bundle",
      enforce: "post",
      apply: "build",

      generateBundle(_opts, bundle) {
        for (const b of Object.values(bundle)) {
          if (b.type === "asset") {
            const originalFileNames = b.originalFileNames.map((relativePath) =>
              path.resolve(this.environment.config.root, relativePath),
            );

            const asset: BundleAsset = {
              env: this.environment.name,
              root: this.environment.config.root,
              outDir: this.environment.config.build.outDir,
              outFile: joinAbsolute(this.environment, this.environment.config.build.outDir, b.fileName),
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
          if (!isVercelLastBuildStep(this.environment)) return;

          this.environment.logger.info("Creating Vercel bundles...");

          const api = getVercelAPI(this);
          const outfiles = api.getOutFiles();

          // TODO concurrency
          for (const outfile of outfiles) {
            if (outfile.type === "asset") {
              const { source, destination } = getAbsoluteOutFileWithout_tmp(outfile);
              // TODO instead move from _tmp to parent folder
              await mkdir(path.dirname(destination), { recursive: true });
              await copyFile(source, destination);
            } else {
              await bundle(this.environment, bundledAssets, outfile);
            }
          }

          const tmpDir = pluginConfig.outDir ? path.posix.join(pluginConfig.outDir, "_tmp") : ".vercel/output/_tmp";

          await rm(tmpDir, { recursive: true });
        },
      },

      sharedDuringBuild: true,
    },
  ];
}

function getAbsoluteOutFileWithout_tmp(outfile: ViteVercelOutFile) {
  const source = joinAbsolutePosix(outfile.root, outfile.outdir, outfile.filepath);
  // effectively removes appended _tmp folder
  const destination = source.replace(outfile.outdir, path.dirname(outfile.outdir));
  return {
    source,
    destination,
  };
}

async function bundle(
  environment: Environment,
  bundledAssets: Map<string, BundleAsset>,
  outfile: ViteVercelOutFileChunk,
) {
  const { source, destination } = getAbsoluteOutFileWithout_tmp(outfile);
  const isEdge = Boolean(outfile.relatedEntry.vercel?.edge);

  const buildOptions: BuildOptions = {
    format: "esm",
    target: "es2022",
    legalComments: "none",
    bundle: true,
    entryPoints: [source],
    treeShaking: true,
    logOverride: { "ignored-bare-import": "silent" },
  };

  if (isEdge) {
    // TODO unenv behind an opt-out option
    buildOptions.platform = "browser";
    buildOptions.external = edgeExternal;
    buildOptions.conditions = edgeConditions;
    buildOptions.define = {
      "process.env.NODE_ENV": JSON.stringify("production"),
    };
    buildOptions.outExtension = { ".js": ".mjs" };
    buildOptions.outfile = destination.replace(/\.mjs$/, ".js");
    buildOptions.plugins = [edgeWasmPlugin, dynamicNativeImportPlugin, reactEdgePlugin];
  } else {
    buildOptions.platform = "node";
    buildOptions.outfile = destination.replace(/\.js$/, ".mjs");
    buildOptions.banner = {
      js: `import { createRequire as topLevelCreateRequire } from 'module';
import { dirname as topLevelDirname } from 'path';
import { fileURLToPath as topLevelFileURLToPath } from 'url';
const require = topLevelCreateRequire(import.meta.url);
const __filename = topLevelFileURLToPath(import.meta.url);
const __dirname = topLevelDirname(__filename);
`,
    };
  }

  try {
    await build(buildOptions);
  } catch (e) {
    // @ts-ignore
    throw new Error(`Error while bundling ${destination}`, { cause: e });
  }

  let base = environment.config.root;
  try {
    const dir = await findRoot(environment.config.root);
    base = dir.rootDir;
  } catch (_e) {
    // ignore error
  }

  const entryFilePath = existsSync(outfile.relatedEntry.id)
    ? outfile.relatedEntry.id
    : outfile.relatedEntry.resolvedId && existsSync(outfile.relatedEntry.resolvedId)
      ? outfile.relatedEntry.resolvedId
      : null;

  if (entryFilePath === null) {
    return;
  }

  const { fileList, reasons } = await nodeFileTrace([entryFilePath], {
    base,
    processCwd: environment.config.root,
    mixedModules: true,
    // https://github.com/vercel/next.js/blob/7c8e2b4e50449ce2d2c83de0b5638c61b7de2362/packages/next/src/build/collect-build-traces.ts#L201
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
          entryPoints: [entryFilePath],
          bundle: false,
          write: false,
        });

        return result.outputFiles[0].text;
      }

      return readFileSync(filepath, "utf-8");
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
      const absolutePath = path.join(base, file);

      // @vercel/nft needs to scan the original entries in order to find missing assets.
      // But Vite already did a pass, and assets imports can have already been rewritten.
      // If so, instead of using the original filename found by @vercel/nft,
      // we use the one generated by Vite.
      const assetRenamedByVite = bundledAssets.get(absolutePath);

      const basename = path.basename(assetRenamedByVite ? assetRenamedByVite.fileName : absolutePath);

      if (assetRenamedByVite) {
        // Edit imports in-place to make them relative
        writeFileSync(
          destination,
          readFileSync(destination, "utf-8").replaceAll(
            `/${assetRenamedByVite.fileName}`,
            `./${path.basename(assetRenamedByVite.fileName)}`,
          ),
        );
      }

      await copyFile(absolutePath, path.join(path.dirname(destination), basename));
    }
  }
}
