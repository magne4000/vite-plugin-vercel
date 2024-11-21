import type { NodeVersion } from "@vercel/build-utils";
import type { BuildOptions, Plugin } from "esbuild";
import { vercelOutputVcConfigSchema } from "./schemas/config/vc-config";
import type { ViteVercelConfig } from "./types";

const edgeWasmPlugin: Plugin = {
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

const vercelOgPlugin = (ctx: { found: boolean; index: string }): Plugin => {
  return {
    name: "vercel-og",
    setup(build) {
      build.onResolve({ filter: /@vercel\/og/ }, () => {
        ctx.found = true;
        return undefined;
      });

      build.onLoad({ filter: /@vercel\/og/ }, (args) => {
        ctx.index = args.path;
        return undefined;
      });
    },
  };
};

const standardBuildOptions: BuildOptions = {
  bundle: true,
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
};

// export async function buildFn(resolvedConfig: ResolvedConfig, entry: ViteVercelApiEntry, buildOptions?: BuildOptions) {
//   assert(
//     entry.destination.length > 0,
//     `Endpoint ${typeof entry.source === "string" ? entry.source : "-"} does not have build destination`,
//   );
//
//   const options = Object.assign({}, standardBuildOptions);
//
//   if (buildOptions) {
//     Object.assign(options, buildOptions);
//   }
//
//   const filename = entry.edge || options.format === "cjs" ? "index.js" : "index.mjs";
//   const outfile = path.join(getOutput(resolvedConfig, "functions"), entry.destination, filename);
//
//   Object.assign(options, { outfile });
//
//   if (!options.stdin) {
//     if (typeof entry.source === "string") {
//       options.entryPoints = [entry.source];
//     } else {
//       assert(typeof entry.source === "object", "`{ source }` must be a string or an object");
//       assert(typeof entry.source.contents === "string", "`{ contents }` must be a string");
//       options.stdin = entry.source;
//     }
//   }
//
//   if (entry.edge) {
//     options.platform = undefined;
//     options.external = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];
//     options.conditions = ["edge-light", "worker", "browser", "module", "import", "require"];
//     options.plugins?.push(edgeWasmPlugin);
//     options.format = "esm";
//   } else if (options.format === "esm") {
//     options.banner = {
//       js: `import { createRequire as VPV_createRequire } from "node:module";
// import { fileURLToPath as VPV_fileURLToPath } from "node:url";
// import { dirname as VPV_dirname } from "node:path";
// const require = VPV_createRequire(import.meta.url);
// const __filename = VPV_fileURLToPath(import.meta.url);
// const __dirname = VPV_dirname(__filename);
// `,
//     };
//   }
//
//   const ctx = { found: false, index: "" };
//   options.plugins?.push(vercelOgPlugin(ctx));
//
//   const output = await build(options);
//
//   // guess some assets dependencies
//   if (typeof entry.source === "string") {
//     let base = resolvedConfig.root;
//     try {
//       const dir = await findRoot(resolvedConfig.root);
//       base = dir.rootDir;
//     } catch (e) {
//       // ignore error
//     }
//     const { fileList, reasons } = await nodeFileTrace([entry.source], {
//       base,
//       processCwd: resolvedConfig.root,
//       mixedModules: true,
//       ignore: [
//         "**/node_modules/react{,-dom,-dom-server-turbopack}/**/*.development.js",
//         "**/*.d.ts",
//         "**/*.map",
//         "**/node_modules/webpack5/**/*",
//       ],
//       async readFile(filepath) {
//         if (filepath.endsWith(".ts") || filepath.endsWith(".tsx")) {
//           const result = await build({
//             ...standardBuildOptions,
//             entryPoints: [entry.source as string],
//             bundle: false,
//             write: false,
//           });
//
//           return result.outputFiles[0].text;
//         }
//
//         return fs.readFile(filepath, "utf-8");
//       },
//     });
//
//     for (const file of fileList) {
//       if (
//         reasons.has(file) &&
//         reasons.get(file)?.type.includes("asset") &&
//         !file.endsWith(".js") &&
//         !file.endsWith(".cjs") &&
//         !file.endsWith(".mjs") &&
//         !file.endsWith("package.json")
//       ) {
//         await copyFile(
//           path.join(base, file),
//           path.join(getOutput(resolvedConfig, "functions"), entry.destination, basename(file)),
//         );
//       }
//     }
//   }
//
//   await writeVcConfig(resolvedConfig, entry.destination, filename, {
//     edge: Boolean(entry.edge),
//     streaming: entry.streaming,
//   });
//
//   return output;
// }

export function getVcConfig(
  pluginConfig: ViteVercelConfig,
  filename: string,
  options: {
    edge: boolean;
    nodeVersion: NodeVersion;
    streaming?: boolean;
  },
) {
  return vercelOutputVcConfigSchema.parse(
    options.edge
      ? {
          runtime: "edge",
          entrypoint: filename,
        }
      : {
          runtime: options.nodeVersion.runtime,
          handler: filename,
          maxDuration: pluginConfig.defaultMaxDuration,
          launcherType: "Nodejs",
          shouldAddHelpers: true,
          supportsResponseStreaming: options.streaming ?? pluginConfig.defaultSupportsResponseStreaming,
        },
  );
}

// export async function writeVcConfig(
//   resolvedConfig: ResolvedConfig,
//   destination: string,
//   filename: string,
//   options: {
//     edge: boolean;
//     streaming?: boolean;
//   },
// ): Promise<void> {
//   const vcConfig = path.join(getOutput(resolvedConfig, "functions"), destination, ".vc-config.json");
//
//   await fs.writeFile(
//     vcConfig,
//     // biome-ignore lint/style/noNonNullAssertion: <explanation>
//     JSON.stringify(getVcConfig(resolvedConfig.vercel!, filename, options), undefined, 2),
//     "utf-8",
//   );
// }

//
// async function extractHeaders(resolvedConfig: ResolvedConfig) {
//   let headers: Header[] = [];
//   if (typeof resolvedConfig.vercel?.headers === "function") {
//     headers = await resolvedConfig.vercel.headers();
//   } else if (Array.isArray(resolvedConfig.vercel?.headers)) {
//     headers = resolvedConfig.vercel.headers;
//   }
//
//   return headers;
// }

// export async function buildEndpoints(resolvedConfig: ResolvedConfig): Promise<{
//   rewrites: Rewrite[];
//   isr: Record<string, VercelOutputIsr>;
//   headers: Header[];
// }> {
//   const entries = await getEntries(resolvedConfig);
//   const headers = await extractHeaders(resolvedConfig);
//
//   for (const entry of entries) {
//     if (typeof entry.source === "string") {
//       const exports = await extractExports(entry.source);
//
//       if (exports) {
//         if (entry.headers || exports.headers) {
//           entry.headers = {
//             ...exports.headers,
//             ...entry.headers,
//           };
//         }
//
//         if (entry.edge !== undefined && exports.edge !== undefined) {
//           throw new Error(
//             `edge configuration should be defined either in the endpoint itself or through Vite config, not both ('${entry.source}')`,
//           );
//         }
//
//         if (exports.edge !== undefined) {
//           entry.edge = exports.edge;
//         }
//
//         if (entry.isr !== undefined && exports.isr !== undefined) {
//           throw new Error(
//             `isr configuration should be defined either in the endpoint itself or through Vite config, not both ('${entry.source}')`,
//           );
//         }
//
//         if (
//           (entry.isr !== undefined || exports.isr !== undefined) &&
//           (entry.edge !== undefined || exports.edge !== undefined)
//         ) {
//           throw new Error(`isr cannot be enabled for edge functions ('${entry.source}')`);
//         }
//
//         if (exports.isr) {
//           entry.isr = exports.isr;
//         }
//
//         if (typeof exports.streaming === "boolean") {
//           entry.streaming = exports.streaming;
//         }
//       }
//     }
//
//     await buildFn(resolvedConfig, entry, entry.buildOptions);
//   }
//
//   const isrEntries = entries
//     .filter((e) => e.isr)
//     .map((e) => [e.destination.replace(/\.func$/, ""), { expiration: e.isr?.expiration }] as const);
//
//   return {
//     rewrites: entries
//       .filter((e) => {
//         if (e.addRoute === undefined && e.route !== undefined) {
//           return e.route !== false;
//         }
//         if (e.addRoute !== undefined && e.route === undefined) {
//           return e.addRoute !== false;
//         }
//         if (e.addRoute !== undefined && e.route !== undefined) {
//           throw new Error("Cannot use both `route` and `addRoute` in `additionalEndpoints`");
//         }
//         return true;
//       })
//       .map((e) => {
//         const destination = e.destination.replace(/\.func$/, "");
//         if (typeof e.route === "string") {
//           return {
//             source: `(${e.route})`,
//             destination: `${destination}/?__original_path=$1`,
//           };
//         }
//         return {
//           source: replaceBrackets(getSourceAndDestination(destination)),
//           destination: getSourceAndDestination(destination),
//         };
//       }),
//     isr: Object.fromEntries(isrEntries) as Record<string, VercelOutputIsr>,
//     headers: [
//       ...entries
//         .filter((e) => e.headers)
//         .map((e) => ({
//           source: `/${e.destination.replace(/\.func$/, "")}`,
//           headers: Object.entries(e.headers ?? {}).map(([key, value]) => ({
//             key,
//             value,
//           })),
//         })),
//       ...headers,
//     ],
//   };
// }
