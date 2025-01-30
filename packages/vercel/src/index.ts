import fs from "node:fs/promises";
import path from "node:path";
import { createMiddleware } from "@universal-middleware/express";
import { getNodeVersion } from "@vercel/build-utils";
import type { NodeVersion } from "@vercel/build-utils/dist";
import { getTransformedRoutes, type RouteWithSrc } from "@vercel/routing-utils";
import type { EmittedFile } from "rollup";
import {
  BuildEnvironment,
  createRunnableDevEnvironment,
  type EnvironmentOptions,
  isRunnableDevEnvironment,
  mergeConfig,
  normalizePath,
  type Plugin,
  type PluginOption,
  type ResolvedConfig,
} from "vite";
import { getVcConfig } from "./build";
import { getConfig } from "./config";
import { copyDir, getOutput, getPublic } from "./helpers";
import { disableChunks } from "./plugins/disable-chunks";
import { vercelOutputPrerenderConfigSchema } from "./schemas/config/prerender-config";
import type { ViteVercelConfig, ViteVercelEntry, ViteVercelPrerenderRoute } from "./types";

export * from "./types";

const outDir = path.join(".vercel", "output");

function createVercelEnvironmentOptions(
  input: Record<string, string>,
  extension: "js" | "mjs",
  overrides?: EnvironmentOptions,
): EnvironmentOptions {
  return mergeConfig(
    {
      dev: {
        async createEnvironment(name, config) {
          return createRunnableDevEnvironment(name, config);
        },
      },
      build: {
        createEnvironment(name, config) {
          return new BuildEnvironment(name, config);
        },
        outDir,
        copyPublicDir: false,
        rollupOptions: {
          input,
          output: {
            entryFileNames() {
              return `[name].${extension}`;
            },
            sanitizeFileName: false,
          },
        },
        emptyOutDir: false,
      },

      consumer: "server",

      keepProcessEnv: true,
    } satisfies EnvironmentOptions,
    overrides ?? {},
  );
}

function vercelPlugin(pluginConfig: ViteVercelConfig): Plugin {
  const virtualEntry = "virtual:vite-plugin-vercel:entry";
  const resolvedVirtualEntry = "\0virtual:vite-plugin-vercel:entry";
  let nodeVersion: NodeVersion;
  const filesToEmit: Record<string, EmittedFile[]> = { vercel_client: [] };

  return {
    name: "vite-plugin-vercel",

    async buildStart() {
      nodeVersion = await getNodeVersion(process.cwd());
    },

    applyToEnvironment(env) {
      return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
    },

    config(config, env) {
      const entries = pluginConfig.entries ?? [];
      const outDirOverride: EnvironmentOptions = pluginConfig.outDir
        ? {
            build: {
              outDir: pluginConfig.outDir,
            },
          }
        : {};
      const inputs = entries.reduce(
        (acc, curr) => {
          const destination = `${path.posix.join("functions/", curr.destination)}.func/index`;
          if (curr.edge) {
            // .vercel/output/**/*.func/index.js
            acc.edge[destination] = `${virtualEntry}:${curr.input}`;
          } else {
            // .vercel/output/**/*.func/index.mjs
            acc.node[destination] = `${virtualEntry}:${curr.input}`;
          }

          return acc;
        },
        { node: {} as Record<string, string>, edge: {} as Record<string, string> },
      );

      const environments: Record<string, EnvironmentOptions> = {};

      // TODO API ideas for frameworks: Custom hooks?
      //  or public API: https://github.com/vitejs/vite/discussions/6257#discussioncomment-1870069

      // vercel_edge
      if (Object.keys(inputs.edge).length > 0) {
        filesToEmit.vercel_edge = [];
        environments.vercel_edge = createVercelEnvironmentOptions(
          inputs.edge,
          "js",
          mergeConfig<EnvironmentOptions, EnvironmentOptions>(
            {
              resolve: {
                conditions: ["edge-light", "worker", "browser", "module", "import", "require"],
              },
              optimizeDeps: {
                esbuildOptions: {
                  target: "es2022",
                  format: "esm",
                },
              },
              build: {
                emptyOutDir: true,
              },
            },
            outDirOverride,
          ),
        );
      }

      // vercel_node
      filesToEmit.vercel_node = [];
      environments.vercel_node = createVercelEnvironmentOptions(
        inputs.node,
        "mjs",
        mergeConfig<EnvironmentOptions, EnvironmentOptions>(
          {
            build: {
              // Ensure that outDir is emptied only once
              emptyOutDir: !("vercel_edge" in environments),
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
            const priority: Record<string, number> = {
              vercel_edge: 1,
              vercel_node: 2,
              vercel_client: 3,
            }; // Higher priority values should be at the end

            const envs = Object.values(builder.environments);
            envs.sort((a, b) => {
              const aPriority = priority[a.name] ?? 0;
              const bPriority = priority[b.name] ?? 0;

              return aPriority - bPriority;
            });

            // console.log(
            //   "buildApp",
            //   envs.map((e) => e.name),
            // );

            for (const environment of envs) {
              // console.log("buildApp", environment.name);
              await builder.build(environment);
              // FIXME: Vike seems to process.exit(0) when { prerender: true }
              // console.log("buildApp", environment.name, "END");
            }

            // console.log("buildApp", "END");
          },
        },
        environments,
      };
    },

    // TODO watch/hmr
    configureServer(server) {
      const transformedRoutes = getTransformedRoutes({
        rewrites: pluginConfig.entries?.map((entry) => ({
          source: typeof entry.route === "string" ? `(${entry.route})` : entryToPathtoregex(entry),
          destination: entry.destination,
        })),
      });

      const routes = (transformedRoutes.routes ?? [])
        .filter((r): r is RouteWithSrc => Boolean(r.src))
        .map((r) => ({
          src: new RegExp(r.src),
          dest: r.dest,
          entry: pluginConfig.entries?.find((e) => e.destination === r.dest),
        }));

      // This middleware is in charge of adding user-provided headers onto the Response
      const routesWithAddedHeaders = routes.filter((r) => r.entry?.headers);
      if (routesWithAddedHeaders.length > 0) {
        server.middlewares.use(
          createMiddleware(() => async (request) => {
            return (response) => {
              const url = new URL(request.url);
              for (const r of routesWithAddedHeaders) {
                if (r.entry?.headers && r.src.test(url.pathname)) {
                  for (const [key, value] of Object.entries(r.entry.headers)) response.headers.set(key, value);
                }
              }
              return response;
            };
          })(),
        );
      }

      // This middleware is in charge of mapping a request to a UniversalHandler
      server.middlewares.use(
        createMiddleware(() => async (request) => {
          const url = new URL(request.url);
          for (const r of routes) {
            if (r.entry && r.src.test(url.pathname)) {
              const devEnv = r.entry.edge ? server.environments.vercel_edge : server.environments.vercel_node;

              if (isRunnableDevEnvironment(devEnv)) {
                const newRequest = request.clone();
                if (r.entry.headers) {
                  for (const [key, value] of Object.entries(r.entry.headers)) newRequest.headers.set(key, value);
                }

                const fileEntry = await devEnv.runner.import(r.entry.input);
                return fileEntry.default(newRequest);
              }

              throw new Error(`${devEnv.name} environment is not Runnable`);
            }
          }
        })(),
      );
    },

    resolveId(id) {
      if (id.startsWith(virtualEntry)) {
        return `\0${id}`;
      }
    },

    load(id) {
      if (id.startsWith(resolvedVirtualEntry)) {
        const isEdge = this.environment.name === "vercel_edge";
        const fn = isEdge ? "createEdgeHandler" : "createNodeHandler";
        const [, , , input] = id.split(":");

        const entries = pluginConfig.entries ?? [];
        const entry = entries.find((e) => e.input === input);

        if (!entry) {
          throw new Error(`Unable to find entry for "${input}"`);
        }

        // Generate .vc-config.json
        const filename = entry.edge ? "index.js" : "index.mjs";
        filesToEmit[this.environment.name].push({
          type: "asset",
          fileName: `${path.posix.join("functions/", entry.destination)}.func/.vc-config.json`,
          source: JSON.stringify(
            getVcConfig(pluginConfig, filename, {
              nodeVersion,
              edge: Boolean(entry.edge),
              streaming: entry.streaming,
            }),
            undefined,
            2,
          ),
        });

        // Generate *.prerender-config.json when necessary
        if (entry.isr) {
          filesToEmit[this.environment.name].push({
            type: "asset",
            fileName: `${path.posix.join("functions/", entry.destination)}.prerender-config.json`,
            source: JSON.stringify(vercelOutputPrerenderConfigSchema.parse(entry.isr), undefined, 2),
          });
        }

        // Generate rewrites
        if (entry.route) {
          pluginConfig.rewrites ??= [];
          const source = typeof entry.route === "string" ? `(${entry.route})` : entryToPathtoregex(entry);
          pluginConfig.rewrites.push({
            source,
            destination: `/${entry.destination}`,
          });

          // Generate headers
          if (entry.headers) {
            pluginConfig.headers ??= [];
            pluginConfig.headers.push({
              source,
              headers: Object.entries(entry.headers).map(([key, value]) => ({
                key,
                value,
              })),
            });
          }
        }

        const absoluteInput = normalizePath(
          path.isAbsolute(input) ? input : path.posix.join(this.environment.config.root, input),
        );

        //language=javascript
        return `
          import { ${fn} } from "vite-plugin-vercel/universal-middleware";
          import handler from "${absoluteInput}";

          export default ${fn}(() => handler)();
        `;
      }
    },

    generateBundle: {
      order: "post",
      async handler() {
        if (this.environment.name in filesToEmit) {
          for (const f of filesToEmit[this.environment.name]) {
            this.emitFile(f);
          }
        }

        // Compute overrides for static HTML files
        const userOverrides = await computeStaticHtmlOverrides(this.environment.config);
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

        if (this.environment.name === "vercel_client") {
          await copyDistToStatic(this.environment.config);
        }
      },
    },

    sharedDuringBuild: true,
  };
}

async function copyDistToStatic(resolvedConfig: ResolvedConfig) {
  if (resolvedConfig.vercel?.distContainsOnlyStatic) {
    await copyDir(resolvedConfig.build.outDir, getOutput(resolvedConfig, "static"));
  }
}

async function computeStaticHtmlOverrides(
  resolvedConfig: ResolvedConfig,
): Promise<NonNullable<ViteVercelPrerenderRoute>> {
  const staticAbsolutePath = getOutput(resolvedConfig, "static");
  const files = await getStaticHtmlFiles(staticAbsolutePath);

  // public files copied by vite by default https://vitejs.dev/guide/assets.html#the-public-directory
  const publicDir = getPublic(resolvedConfig);
  const publicFiles = await getStaticHtmlFiles(publicDir);
  files.push(...publicFiles.map((f) => f.replace(publicDir, staticAbsolutePath)));

  return files.reduce(
    (acc, curr) => {
      const relPath = path.relative(staticAbsolutePath, curr);
      const parsed = path.parse(relPath);
      const pathJoined = path.join(parsed.dir, parsed.name);
      acc[relPath] = {
        path: pathJoined,
      };
      return acc;
    },
    {} as NonNullable<ViteVercelPrerenderRoute>,
  );
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

export default function allPlugins(pluginConfig: ViteVercelConfig): PluginOption[] {
  return [disableChunks(), vercelPlugin(pluginConfig)];
}

// @vercel/routing-utils respects path-to-regexp syntax
function entryToPathtoregex(entry: ViteVercelEntry) {
  return path.posix
    .resolve("/", entry.destination)
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
