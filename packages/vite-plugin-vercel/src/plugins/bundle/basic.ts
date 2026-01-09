import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile, rmdir, unlink } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { findRoot } from "@manypkg/find-root";
import { nodeFileTrace } from "@vercel/nft";
import { type BuildOptions, build } from "rolldown";
import type { Environment, Plugin } from "vite";
import { getVercelAPI, type ViteVercelOutFile, type ViteVercelOutFileChunk } from "../../api.js";
import type { PluginContext, ViteVercelConfig } from "../../types.js";
import { getBuildEnvNames } from "../../utils/buildEnvs";
import { edgeConditions } from "../../utils/edge.js";
import { edgeExternal } from "../../utils/external.js";

const builtIns = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));

const edgeWasmPlugin: Plugin = {
  name: "edge-wasm-vercel",
  resolveId: {
    filter: {
      id: [/\.wasm\?module$/],
    },
    handler(id) {
      return {
        id: id.replace(/\.wasm\?module$/, ".wasm"),
        external: true,
      };
    },
  },
};

// Treat dynamic imports of native modules as external
const dynamicNativeImportPlugin: Plugin = {
  name: "edge-dynamic-import-native",
  resolveDynamicImport(specifier) {
    if (typeof specifier === "string" && builtIns.has(specifier)) {
      return { id: specifier, external: true };
    }
  },
};

const reactEdgePlugin: Plugin = {
  name: "react-edge-plugin",
  resolveId: {
    filter: {
      id: [/react-dom\/server/],
    },
    async handler(_id, importer, options) {
      return this.resolve("react-dom/server.edge", importer, options);
    },
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
export function basicBundlePlugin(pluginConfig: ViteVercelConfig): Plugin[] {
  const bundledAssets = new Map<string, BundleAsset>();
  const bundledChunks: string[] = [];

  return [
    {
      name: "vite-plugin-vercel:bundle",
      enforce: "post",
      apply: "build",

      generateBundle(_opts, bundle) {
        for (const b of Object.values(bundle)) {
          const outFile = joinAbsolute(this.environment, this.environment.config.build.outDir, b.fileName);
          if (b.type === "asset") {
            const originalFileNames = b.originalFileNames.map((relativePath) =>
              path.resolve(this.environment.config.root, relativePath),
            );

            const asset: BundleAsset = {
              env: this.environment.name,
              root: this.environment.config.root,
              outDir: this.environment.config.build.outDir,
              outFile,
              fileName: b.fileName,
            };

            for (const originalFileName of originalFileNames) {
              bundledAssets.set(originalFileName, asset);
            }
          } else {
            bundledChunks.push(outFile);
          }
        }
      },

      closeBundle: {
        order: "post",
        async handler() {
          if (!isVercelLastBuildStep(this.environment, pluginConfig)) return;

          this.environment.logger.info("Creating Vercel bundles...");

          const api = getVercelAPI(this);
          const outfiles = api.getOutFiles();
          const filesToKeep: string[] = [];

          // TODO concurrency
          for (const outfile of outfiles) {
            if (outfile.type === "chunk") {
              filesToKeep.push(...(await bundle(this, bundledAssets, outfile)));
            }
          }

          await cleanup(filesToKeep, bundledChunks);
        },
      },

      sharedDuringBuild: true,
    },
  ];
}

function getAbsoluteOutFile(outfile: ViteVercelOutFile) {
  const source = joinAbsolutePosix(outfile.root, outfile.outdir, outfile.filepath);
  const destination = source.replace(outfile.outdir, outfile.outdir);
  return {
    source,
    destination,
  };
}

async function bundle(
  pluginContext: PluginContext,
  bundledAssets: Map<string, BundleAsset>,
  outfile: ViteVercelOutFileChunk,
) {
  const output: string[] = [];
  const { source, destination } = getAbsoluteOutFile(outfile);
  const isEdge = Boolean(outfile.relatedEntry.vercel?.edge);
  const { environment } = pluginContext;

  const buildOptions: BuildOptions = {};
  buildOptions.output = {
    format: "esm",
    legalComments: "none",
    inlineDynamicImports: true,
  };
  buildOptions.checks = {
    pluginTimings: false,
  };
  buildOptions.input = [source];
  buildOptions.treeshake = true;
  buildOptions.resolve ??= {};
  if (isEdge) {
    // TODO unenv behind an opt-out option
    buildOptions.platform = "browser";
    buildOptions.external = edgeExternal;
    buildOptions.resolve.conditionNames = edgeConditions;
    buildOptions.transform = {
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    };
    buildOptions.output.file = destination.replace(/\.mjs$/, ".js");
    buildOptions.plugins = [edgeWasmPlugin, dynamicNativeImportPlugin, reactEdgePlugin];
  } else {
    buildOptions.platform = "node";
    buildOptions.output.file = destination.replace(/\.js$/, ".mjs");
    buildOptions.output.banner = `import { createRequire as topLevelCreateRequire } from 'node:module';
import { dirname as topLevelDirname } from 'node:path';
import { fileURLToPath as topLevelFileURLToPath } from 'node:url';
var require = topLevelCreateRequire(import.meta.url);
var __filename = topLevelFileURLToPath(import.meta.url);
var __dirname = topLevelDirname(__filename);
`;
  }

  try {
    await build(buildOptions);
    output.push(buildOptions.output.file);
  } catch (e) {
    // biome-ignore lint/suspicious/noTsIgnore: cause is not always defined
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

  const resolvedEntryP = pluginContext.resolve(outfile.relatedEntry.id);
  const entryFilePath = existsSync(outfile.relatedEntry.id)
    ? outfile.relatedEntry.id
    : // biome-ignore lint/style/noNonNullAssertion: ok
      (await resolvedEntryP)?.id && existsSync((await resolvedEntryP)!.id)
      ? // biome-ignore lint/style/noNonNullAssertion: ok
        (await resolvedEntryP)!.id
      : null;

  if (entryFilePath === null) {
    return [];
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
          output: {
            format: "esm",
            minify: false,
          },
          // Compile only input
          external: /.*/,
          platform: "node",
          logLevel: "info",
          plugins: [],
          transform: {
            define: {
              "process.env.NODE_ENV": '"production"',
              "import.meta.env.NODE_ENV": '"production"',
            },
          },
          input: [entryFilePath],
          write: false,
        });

        return result.output[0].code;
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

      const to = path.join(path.dirname(destination), basename);
      output.push(to);
      await copyFile(absolutePath, to);
    }
  }
  return output;
}

function joinAbsolute(env_or_p0: Environment | string, p1: string, ...p: string[]) {
  if (path.isAbsolute(p1)) {
    return path.join(p1, ...p);
  }
  return path.join(typeof env_or_p0 === "string" ? env_or_p0 : env_or_p0.config.root, p1, ...p);
}

function joinAbsolutePosix(env_or_p0: Environment | string, p1: string, ...p: string[]) {
  if (path.isAbsolute(p1)) {
    return path.posix.join(p1, ...p);
  }
  return path.posix.join(typeof env_or_p0 === "string" ? env_or_p0 : env_or_p0.config.root, p1, ...p);
}

function isVercelLastBuildStep(env: string | Environment, pluginConfig: ViteVercelConfig) {
  const envNames = getBuildEnvNames(pluginConfig);
  const name = typeof env !== "string" ? env.name : env;
  return name === envNames.node;
}

async function cleanup(filesToKeep: string[], bundledChunks: string[]) {
  const toKeep = new Set(filesToKeep);
  const removedFiles: string[] = [];

  await Promise.all(
    bundledChunks.map(async (file) => {
      if (!toKeep.has(file)) {
        try {
          await unlink(file);
          removedFiles.push(file);
        } catch {
          // ignore error
        }
      }
    }),
  );

  const dirsToRemove = new Set<string>();
  for (const file of removedFiles) {
    let dir = path.dirname(file);
    while (dir && dir !== "." && dir !== "/" && !toKeep.has(dir)) {
      dirsToRemove.add(dir);
      dir = path.dirname(dir);
    }
  }

  const sortedDirs = Array.from(dirsToRemove).sort((a, b) => b.length - a.length);

  for (const dir of sortedDirs) {
    try {
      await rmdir(dir);
    } catch {
      // ignore error (e.g. if directory is not empty)
    }
  }
}
