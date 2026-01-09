import fs from "node:fs";
import { cpus } from "node:os";
import path from "node:path";
import { resolve } from "@vercel/nft";
import { type ExternalsPluginOptions, externals } from "nf3/plugin";
import pLimit from "p-limit";
import { type BuildOptions, build, type OutputBundle, type RolldownOutput } from "rolldown";
import { normalizePath, type Plugin } from "vite";
import type { ViteVercelConfig } from "../../types";
import { assert } from "../../utils/assert";
import { getBuildEnvNames } from "../../utils/buildEnvs";
import { edgeExternal } from "../../utils/external";

export function nf3BundlePlugin(pluginConfig: ViteVercelConfig): Plugin[] {
  const envNames = getBuildEnvNames(pluginConfig);
  // TODO fix nf3 -> if (rOpts?.isEntry) return;
  // TODO fix nf3 -> monorepo linked packages are excluded from trace because resolved path does not contain node_modules
  //  Easy fix would be to pass unresolved files to tracedPaths
  //  https://chatgpt.com/c/695e6b45-bbb4-8331-bb4d-7734f11625f8
  const externalsPlugin = externals({});
  // Keeps the logic that properly marks modules as externals, without copying the files.
  // The actual copy is executed at a later stage.
  delete externalsPlugin.buildEnd;

  let buildOutput: RolldownOutput["output"] | undefined;

  return [
    {
      ...externalsPlugin,
      applyToEnvironment(env) {
        return env.config.consumer !== "client";
      },
    },
    {
      name: "vite-plugin-vercel:isolate-functions",
      apply: "build",
      applyToEnvironment(env) {
        return env.config.consumer !== "client";
      },
      async writeBundle(_, output) {
        const isEdge = this.environment.name === envNames.edge;
        const config = this.environment.config;
        const outDir = normalizePath(
          path.isAbsolute(config.build.outDir) ? config.build.outDir : path.join(config.root, config.build.outDir),
        );
        // Get all entry files from the output
        const entries = Object.entries(output)
          .filter((e) => "isEntry" in e[1] && e[1].isEntry)
          .map((e) => ({
            name: e[1].name,
            fileName: e[1].fileName,
            outPath: path.join(outDir, e[1].fileName),
          }));

        if (entries.length === 0) return;

        const outPaths = entries.map((entry) => entry.outPath);

        // Input to object, so that entries are written at the same place
        const input = Object.fromEntries(outPaths.map((e) => [removeExtension(pathRelativeTo(e, outDir)), e]));

        // Build entries concurrently with limited concurrency to avoid resource contention
        // Use half the CPU cores to prevent overwhelming file system and memory
        // Using p-limit allows builds to start as soon as a slot is available,
        // rather than waiting for all builds in a batch to complete
        const concurrency = Math.max(1, Math.ceil(cpus().length / 2));
        const limit = pLimit(concurrency);

        // FIXME finish testing this
        //  tanstack-start tracing doesn't seem to work
        //  #tanstack-start-entry and #tanstack-router-entry are in there, so an almost noExternal build seems necessary
        const nonVitePlugins = this.environment.config.plugins
          .filter((p) => {
            return (
              !p.name.startsWith("vite:") && p.name !== "alias" && p.name !== "commonjs" && p.name !== "nitro:externals"
            );
          })
          .map((x) => {
            const { buildStart, buildEnd, writeBundle, generateBundle, ...rest } = x;
            return rest;
          });
        const results = await Promise.all(
          Object.values(input).map((entryPath) =>
            limit(async () => {
              const outDir = path.dirname(entryPath);
              const res = await bundle({
                plugins: nonVitePlugins,
                isEdge,
                input: { index: entryPath },
                outDir,
                externals: {
                  conditions: this.environment.config.resolve.conditions,
                  rootDir: this.environment.config.root,
                  trace: {
                    outDir: path.dirname(entryPath),
                    nft: {
                      async resolve(id, parent, job, cjsResolve) {
                        return resolve(id.replace(/\.wasm\?module$/, ".wasm"), parent, job, cjsResolve);
                      },
                    },
                  },
                },
              });
              return {
                output: res.output.map((o) => ({
                  ...o,
                  fileName: path.join(outDir, o.fileName),
                })),
              };
            }),
          ),
        );

        // Aggregate outputs from all builds
        const localOutput = results.flatMap((r) => r.output) as RolldownOutput["output"];
        buildOutput = buildOutput ? [...buildOutput, ...localOutput] : localOutput;

        // biome-ignore lint/suspicious/noExplicitAny: small diff between Rollup and Rolldown types
        cleanup(output as any, buildOutput, this.environment.config.build.outDir);
      },
    },
  ];
}

export function bundle(
  options: Required<Pick<BuildOptions, "input">> & {
    isEdge: boolean;
    outDir: string;
    externals: ExternalsPluginOptions;
    plugins: Plugin[];
  },
): Promise<RolldownOutput> {
  assert(options.input, "No input specified");

  return build({
    platform: options.isEdge ? "browser" : "node",
    external: options.isEdge ? edgeExternal : [],
    write: true,
    plugins: [...options.plugins, externals(options.externals)],
    input: options.input,
    resolve: {
      conditionNames: options.externals.conditions,
    },
    output: {
      entryFileNames: options.isEdge ? "[name].js" : "[name].mjs",
      sanitizeFileName: false, // already done by Vite
      dir: options.outDir,
      hoistTransitiveImports: false, // avoids empty imports at the top of entry chunks
    },
    checks: {
      pluginTimings: false,
    },
  });
}

export function cleanup(viteOutput: OutputBundle, rolldownOutput: RolldownOutput["output"], outputDir: string) {
  const viteFilenames = Object.values(viteOutput).map((o) => path.join(outputDir, o.fileName));
  const rolldownFilenames = new Set(rolldownOutput.map((o) => o.fileName));
  const rolldownModuleIds = new Set(rolldownOutput.flatMap((o) => (o.type === "chunk" ? o.moduleIds : [])));
  const filesToDelete = viteFilenames.filter(
    (id) => id.startsWith(outputDir) && rolldownModuleIds.has(id) && !rolldownFilenames.has(id),
  );

  // Delete files and collect directories
  const parentDirs = new Set<string>();
  for (const file of filesToDelete) {
    try {
      fs.unlinkSync(file);
      const mapFile = `${file}.map`;
      if (fs.existsSync(mapFile)) {
        fs.unlinkSync(mapFile);
      }
      parentDirs.add(path.dirname(file));
    } catch {
      // Ignore errors
    }
  }

  // Delete empty directories
  for (const dir of parentDirs) {
    try {
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    } catch {
      // Ignore errors
    }
  }
}

export function pathRelativeTo(filePath: string, rel: string): string {
  return normalizePath(path.relative(normalizePath(path.resolve(rel)), path.resolve(filePath)));
}

export function removeExtension(subject: string) {
  return subject.replace(/\.[^/.]+$/, "");
}
