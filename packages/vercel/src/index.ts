import fs from "node:fs/promises";
import path from "node:path";
import { createMiddleware } from "@universal-middleware/express";
import { getNodeVersion } from "@vercel/build-utils";
import type { NodeVersion } from "@vercel/build-utils/dist";
import { getTransformedRoutes, type RouteWithSrc } from "@vercel/routing-utils";
import { match } from "path-to-regexp";
import type { EmittedFile } from "rollup";
import {
  BuildEnvironment,
  createRunnableDevEnvironment,
  type Environment,
  type EnvironmentOptions,
  isRunnableDevEnvironment,
  mergeConfig,
  type Plugin,
  type PluginOption,
} from "vite";
import { createAPI, vercelBuildApp, type ViteVercelOutFile } from "./api";
import { assert } from "./assert";
import { getVcConfig } from "./build";
import { getConfig } from "./config";
import { joinAbsolute } from "./helpers";
import { bundlePlugin } from "./plugins/bundle";
import { vercelCleanupPlugin } from "./plugins/clean-outdir";
import { wasmPlugin } from "./plugins/wasm";
import { vercelOutputPrerenderConfigSchema } from "./schemas/config/prerender-config";
import type { ViteVercelConfig, ViteVercelRouteOverrides } from "./types";
import { definePhotonLib, isPhotonMeta } from "@photonjs/core/api";
import { photonjs } from "@photonjs/core/plugin";
import { photonEntryDestination, photonEntryDestinationDefault } from "./utils/destination";

export * from "./types";

const outDir = ".vercel/output";
const DUMMY = "__DUMMY__";

function createVercelEnvironmentOptions(
  input: Record<string, string>,
  extension: "js" | "mjs",
  overrides?: EnvironmentOptions,
): EnvironmentOptions {
  return mergeConfig(
    {
      resolve: {
        noExternal: true,
      },
      dev: {
        async createEnvironment(name, config) {
          return createRunnableDevEnvironment(name, config);
        },
      },
      build: {
        createEnvironment(name, config) {
          return new BuildEnvironment(name, config);
        },
        outDir: path.posix.join(outDir, "_tmp"),
        copyPublicDir: false,
        rollupOptions: {
          input,
          output: {
            entryFileNames() {
              return `[name].${extension}`;
            },
            sanitizeFileName: false,
            sourcemap: false,
          },
        },
        target: "es2022",
        emptyOutDir: false,
      },

      consumer: "server",

      keepProcessEnv: true,
    } satisfies EnvironmentOptions,
    overrides ?? {},
  );
}

const nonEdgeServers = ["express", "fastify"];

// TODO move to plugins folder
function vercelPlugin(pluginConfig: ViteVercelConfig): Plugin {
  const virtualEntry = "virtual:vite-plugin-vercel:entry";
  const resolvedVirtualEntry = "\0virtual:vite-plugin-vercel:entry";
  let nodeVersion: NodeVersion;
  const filesToEmit: Record<string, EmittedFile[]> = { vercel_client: [] };
  const outfiles: ViteVercelOutFile[] = [];

  return {
    name: "vite-plugin-vercel",

    async buildStart() {
      nodeVersion = await getNodeVersion(process.cwd());
    },

    api() {
      return createAPI(outfiles, pluginConfig);
    },

    applyToEnvironment(env) {
      return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
    },

    config(config, env) {
      assert(config.photonjs, "Cannot find Photon config");
      const entries = config.photonjs.entry as Photon.ConfigResolved["entry"];
      const outDirOverride: EnvironmentOptions = pluginConfig.outDir
        ? {
            build: {
              outDir: path.posix.join(pluginConfig.outDir, "_tmp"),
            },
          }
        : {};
      const inputs = Object.values(entries).reduce(
        (acc, curr) => {
          const destination = photonEntryDestination(curr, ".func/index");
          if (curr.vercel?.edge) {
            // .vercel/output/**/*.func/index.js
            acc.edge[destination] = `${virtualEntry}:${curr.id}`;
          } else {
            // .vercel/output/**/*.func/index.mjs
            acc.node[destination] = `${virtualEntry}:${curr.id}`;
          }

          return acc;
        },
        { node: {} as Record<string, string>, edge: {} as Record<string, string> },
      );

      const environments: Record<string, EnvironmentOptions> = {};

      // vercel_edge
      if (Object.keys(inputs.edge).length > 0) {
        // See https://vercel.com/docs/functions/runtimes/edge#compatible-node.js-modules
        const external = ["async_hooks", "events", "buffer", "assert", "util"];
        // In dev, we're running on node env, so we do not apply edge conditions
        const conditions =
          env.command === "build"
            ? {
                conditions: ["edge-light", "worker", "browser", "module", "import", "require"],
              }
            : {};
        filesToEmit.vercel_edge = [];
        environments.vercel_edge = createVercelEnvironmentOptions(
          inputs.edge,
          "js",
          mergeConfig<EnvironmentOptions, EnvironmentOptions>(
            {
              resolve: {
                external: [...external, ...external.map((e) => `node:${e}`)],
                ...conditions,
              },
              optimizeDeps: {
                ...config.optimizeDeps,
                esbuildOptions: {
                  target: "es2022",
                  format: "esm",
                },
              },
            },
            outDirOverride,
          ),
        );
      }

      // vercel_node
      filesToEmit.vercel_node = [];
      environments.vercel_node = createVercelEnvironmentOptions(
        {
          // Workaround to be able to have a complete build process even without entries.
          // __DUMMY__ is deleted from the bundle before being written.
          [DUMMY]: `${virtualEntry}:${DUMMY}`,
          ...inputs.node,
        },
        "mjs",
        mergeConfig<EnvironmentOptions, EnvironmentOptions>(
          {
            optimizeDeps: {
              ...config.optimizeDeps,
            },
          },
          outDirOverride,
        ),
      );

      // vercel_client
      environments.vercel_client = {
        build: {
          outDir: path.join(pluginConfig.outDir ?? outDir, "static"),
          copyPublicDir: true,
        },
        consumer: "client",
      };

      return {
        appType: "custom",
        // equivalent to --app CLI option
        builder: {
          buildApp: async (builder) => {
            await vercelBuildApp(builder);
          },
        },
        environments,
      };
    },

    configureServer: {
      order: "post",
      async handler(server) {
        const entries = server.config.photonjs.entry;
        const transformedRoutes = getTransformedRoutes({
          rewrites: Object.values(entries).map((entry) => ({
            source: typeof entry.vercel?.route === "string" ? `(${entry.vercel.route})` : entryToPathtoregex(entry),
            destination: photonEntryDestinationDefault(entry),
          })),
        });

        const routes = (transformedRoutes.routes ?? [])
          .filter((r): r is RouteWithSrc => Boolean(r.src))
          .map((r) => {
            const entry = Object.values(entries).find(
              (e) => photonEntryDestinationDefault(e) === r.dest?.split("?")[0],
            );
            return {
              src: new RegExp(r.src),
              dest: r.dest,
              entry: Object.values(entries).find((e) => photonEntryDestinationDefault(e) === r.dest?.split("?")[0]),
              re: entry
                ? typeof entry.vercel?.route === "string"
                  ? (str: string) => str.match(entry.vercel?.route as string)
                  : match(entryToPathtoregex(entry))
                : null,
            };
          });

        let alreadyRunning: string | undefined = undefined;
        // Only one server process can run, we run it in vercel_node env
        if (entries.index) {
          // TODO we should have a reusable util defined in Photon for that
          const devEnv = server.environments.vercel_node;

          if (isRunnableDevEnvironment(devEnv)) {
            const fileEntry = await devEnv.runner.import(entries.index.id);

            if (typeof fileEntry.default === "function") {
              // Universal Handler
              // Do nothing, handled by middleware
            } else if (fileEntry.default) {
              // App
              alreadyRunning = entries.index.id;
            } else {
              // TODO better error message
              throw new Error(`Unable to determine entry type of ${entries.index.id}`);
            }
          } else {
            throw new Error(`${devEnv.name} environment is not Runnable`);
          }
        }

        // Inject Post Middleware that executes AFTER Vite's internal middlewares
        return () => {
          const routesWithAddedHeaders = routes.filter((r) => r.entry?.vercel?.headers);
          if (routesWithAddedHeaders.length > 0) {
            // This middleware is in charge of adding user-provided headers onto the Response
            server.middlewares.use(
              createMiddleware(() => async (request) => {
                return (response) => {
                  const url = new URL(request.url);
                  for (const r of routesWithAddedHeaders) {
                    if (r.entry?.vercel?.headers && r.src.test(url.pathname)) {
                      for (const [key, value] of Object.entries(r.entry.vercel.headers))
                        response.headers.set(key, value);
                    }
                  }
                  return response;
                };
              })(),
            );
          }

          // This middleware is in charge of resolving Vercel entries
          server.middlewares.use(
            createMiddleware(() => async (request, ctx, runtime) => {
              const url = new URL(request.url);

              for (const r of routes) {
                const found = r.re?.(url.pathname);
                if (r.entry && found && r.entry.id !== alreadyRunning) {
                  const devEnv = r.entry.vercel?.edge
                    ? server.environments.vercel_edge
                    : server.environments.vercel_node;

                  if (isRunnableDevEnvironment(devEnv)) {
                    const newRequest = request.clone();
                    if (r.entry.vercel?.headers) {
                      for (const [key, value] of Object.entries(r.entry.vercel?.headers))
                        newRequest.headers.set(key, value);
                    }

                    // FIXME: extract params for entries with `entry.route` regex
                    const params = "params" in found ? found.params : {};

                    // Add 'x-now-route-matches' header
                    request.headers.set(
                      "x-now-route-matches",
                      new URLSearchParams(params as Record<string, string>).toString(),
                    );
                    // patch `runtime.params` because its computing is based on 'x-now-route-matches' header
                    // which we just added.
                    runtime.params = params as Record<string, string>;

                    // Other internal headers are listed here if we need future support
                    // https://github.com/vercel/next.js/blob/c994df87a55c1912a99b4ca25cd5d5d5790c1dac/packages/next/src/server/lib/server-ipc/utils.ts#L42

                    const fileEntry = await devEnv.runner.import(r.entry.id);

                    if (typeof fileEntry.default === "function") {
                      // Universal Handler
                      return fileEntry.default(newRequest, ctx, runtime);
                    }
                    if (fileEntry.default) {
                      if (alreadyRunning) {
                        throw new Error(
                          `Running multiple server is not supported (${alreadyRunning} and ${r.entry.id})`,
                        );
                      }
                      throw new Error("Server entry must be defined under `index` entry");
                    }
                    // TODO better error message
                    throw new Error(`Unable to determine entry type of ${r.entry.id}`);
                  }

                  throw new Error(`${devEnv.name} environment is not Runnable`);
                }
              }
            })(),
          );
        };
      },
    },

    resolveId(id) {
      if (id.startsWith(virtualEntry)) {
        return `\0${id}`;
      }
    },

    async load(id) {
      if (id.startsWith(resolvedVirtualEntry)) {
        if (id.includes(DUMMY)) {
          return "export default {};";
        }

        const entries = this.environment.config.photonjs.entry;

        const isEdge = this.environment.name === "vercel_edge";
        const fn = isEdge ? "createEdgeHandler" : "createNodeHandler";
        const [, , , ..._input] = id.split(":");
        const input = _input.join(":");

        const entry = Object.values(entries).find((e) => e.id === input);

        if (!entry) {
          throw new Error(`Unable to find entry for "${input}"`);
        }

        // Generate .vc-config.json
        const filename = entry.vercel?.edge ? "index.js" : "index.mjs";
        filesToEmit[this.environment.name].push({
          type: "asset",
          fileName: photonEntryDestination(entry, ".func/.vc-config.json"),
          source: JSON.stringify(
            getVcConfig(pluginConfig, filename, {
              nodeVersion,
              edge: Boolean(entry.vercel?.edge),
              streaming: entry.vercel?.streaming,
            }),
            undefined,
            2,
          ),
        });

        // Generate *.prerender-config.json when necessary
        if (entry.vercel?.isr) {
          filesToEmit[this.environment.name].push({
            type: "asset",
            fileName: photonEntryDestination(entry, ".prerender-config.json"),
            source: JSON.stringify(vercelOutputPrerenderConfigSchema.parse(entry.vercel.isr), undefined, 2),
          });
        }

        // Generate rewrites
        if (entry.vercel?.route) {
          pluginConfig.rewrites ??= [];
          const source = typeof entry.vercel.route === "string" ? `(${entry.vercel.route})` : entryToPathtoregex(entry);
          pluginConfig.rewrites.push({
            enforce: entry.vercel?.enforce,
            source,
            destination:
              typeof entry.vercel.route === "string"
                ? `/${photonEntryDestinationDefault(entry)}?__original_path=$1`
                : `/${photonEntryDestinationDefault(entry)}`,
          });

          // Generate headers
          if (entry.vercel?.headers) {
            pluginConfig.headers ??= [];
            pluginConfig.headers.push({
              source,
              headers: Object.entries(entry.vercel.headers).map(([key, value]) => ({
                key,
                value,
              })),
            });
          }
        }

        const resolved = await this.resolve(input, undefined, {
          isEntry: true,
        });
        assert(resolved, `Failed to resolve input ${input}`);

        let appToHandler = (app: string) => app;

        if (isPhotonMeta(resolved.meta)) {
          // Ensures photon meta is up to date!
          await this.load({ ...resolved, resolveDependencies: true });

          if (resolved.meta.photonjs.type === "server") {
            if (isEdge) {
              assert(
                nonEdgeServers.includes(resolved.meta.photonjs.server),
                `${resolved.meta.photonjs.server} is not compatible with Vercel Edge target. Either use another server like Hono or change target to Node`,
              );
            }
            // Convert server to Universal Handler

            switch (resolved.meta.photonjs.server) {
              case "hono": {
                appToHandler = (app) => `${app}.handler`;
                break;
              }
              // TODO implement other compatible servers, and probably move that into UM or Photon
              default:
                assert(
                  false,
                  `${resolved.meta.photonjs.server} is not compatible with Vercel. Use a compatible server like Hono`,
                );
            }
          }
          // Otherwise, fallback to Universal Handler
        }

        //language=javascript
        return `
          import { ${fn} } from "vite-plugin-vercel/universal-middleware";
          import handler from "${resolved.id}";

          export default ${fn}(() => ${appToHandler("handler")})();
        `;
      }
    },

    generateBundle: {
      order: "post",
      async handler(_opts, bundle) {
        if (this.environment.name in filesToEmit) {
          for (const f of filesToEmit[this.environment.name]) {
            this.emitFile(f);
          }
        }

        const dummy = Object.keys(bundle).find((key) => key.includes(DUMMY));
        if (dummy) {
          delete bundle[dummy];
        }

        // Compute overrides for static HTML files
        const userOverrides = await computeStaticHtmlOverrides(this.environment);
        // Update overrides with static files paths
        pluginConfig.config ??= {};
        pluginConfig.config.overrides ??= {};
        Object.assign(pluginConfig.config.overrides, userOverrides);

        if (this.environment.name === "vercel_node") {
          // Generate config.json
          this.emitFile({
            type: "asset",
            fileName: "config.json",
            source: JSON.stringify(getConfig(pluginConfig), undefined, 2),
          });
        }
      },
    },

    // Compute outfiles for the API
    writeBundle(_opts, bundle) {
      if (this.environment.name !== "vercel_edge" && this.environment.name !== "vercel_node") return;

      const entries = this.environment.config.photonjs.entry;
      const entryMapByDestination = new Map(
        Object.values(entries).map((e) => [photonEntryDestination(e, ".func/index"), e]),
      );

      for (const [key, value] of Object.entries(bundle)) {
        if (value.type === "chunk" && value.isEntry && entryMapByDestination.has(removeExtension(key))) {
          outfiles.push({
            type: "chunk",
            root: this.environment.config.root,
            outdir: this.environment.config.build.outDir,
            filepath: key,
            // biome-ignore lint/style/noNonNullAssertion: guarded by entryMap.has(...)
            relatedEntry: entryMapByDestination.get(removeExtension(key))!,
          });
        } else if ((value.type === "asset" && key.startsWith("functions/")) || key === "config.json") {
          outfiles.push({
            type: "asset",
            root: this.environment.config.root,
            outdir: this.environment.config.build.outDir,
            filepath: key,
          });
        }
      }
    },

    sharedDuringBuild: true,
  };
}

function removeExtension(subject: string) {
  return subject.replace(/\.[^/.]+$/, "");
}

async function computeStaticHtmlOverrides(env: Environment): Promise<NonNullable<ViteVercelRouteOverrides>> {
  if (env.name === "vercel_client") {
    const outDir = joinAbsolute(env, env.config.build.outDir);
    // public files copied by vite by default https://vitejs.dev/guide/assets.html#the-public-directory
    const copyPublicDir = env.getTopLevelConfig().build.copyPublicDir;
    if (copyPublicDir) {
      const publicDir = env.getTopLevelConfig().publicDir;
      const publicFiles = await getStaticHtmlFiles(publicDir);
      const files = publicFiles.map((f) => f.replace(publicDir, outDir));

      return files.reduce(
        (acc, curr) => {
          const relPath = path.relative(outDir, curr);
          const parsed = path.parse(relPath);
          const pathJoined = path.join(parsed.dir, parsed.name);
          acc[relPath] = {
            path: pathJoined,
          };
          return acc;
        },
        {} as NonNullable<ViteVercelRouteOverrides>,
      );
    }
  }

  return {};
}

async function getStaticHtmlFiles(src: string) {
  try {
    await fs.stat(src);
  } catch (e) {
    return [];
  }

  const entries = await fs.readdir(src, { withFileTypes: true });
  const htmlFiles: string[] = [];

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);

    entry.isDirectory()
      ? htmlFiles.push(...(await getStaticHtmlFiles(srcPath)))
      : srcPath.endsWith(".html")
        ? htmlFiles.push(srcPath)
        : undefined;
  }

  return htmlFiles;
}

// @vercel/routing-utils respects path-to-regexp syntax
function entryToPathtoregex(entry: Photon.Entry) {
  assert(typeof entry.vercel?.route !== "string", "Do not pass entry with route string to entryToPathtoregex");
  return path.posix
    .resolve("/", photonEntryDestinationDefault(entry))
    .split("/")
    .map((segment) =>
      segment
        .replace(/^\[\[\.\.\.([^/]+)\]\]$/g, ":$1*")
        .replace(/^\[\[([^/]+)\]\]$/g, ":$1?")
        .replace(/^\[\.\.\.([^/]+)\]$/g, ":$1+")
        .replace(/^\[([^/]+)\]$/g, ":$1"),
    )
    .join("/");
}

export default function allPlugins(pluginConfig: ViteVercelConfig): PluginOption[] {
  return [
    vercelCleanupPlugin(),
    wasmPlugin(),
    vercelPlugin(pluginConfig),
    ...bundlePlugin(pluginConfig),
    // FIXME requires index, but it shouldn't
    // @ts-ignore
    photonjs({ entry: pluginConfig.entries, autoServeIndex: false }),
    ...definePhotonLib("vite-plugin-vercel"),
  ];
}
