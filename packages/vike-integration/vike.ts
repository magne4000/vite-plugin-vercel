import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prerender as prerenderCli } from "vike/prerender";
import type { PageContextServer } from "vike/types";
import { type Plugin, type ResolvedConfig, type UserConfig, normalizePath } from "vite";
import type {
  VercelOutputIsr,
  ViteVercelApiEntry,
  ViteVercelConfig,
  ViteVercelPrerenderFn,
  ViteVercelPrerenderRoute,
} from "vite-plugin-vercel";
import "vike/__internal/setup";
// @ts-ignore
import { newError } from "@brillout/libassert";
import { nanoid } from "nanoid";
import { type PageFile, type PageRoutes, getPagesAndRoutes, route } from "vike/__internal";
import { getParametrizedRoute } from "./route-regex";

declare module "vite" {
  export interface UserConfig {
    vercel?: ViteVercelConfig;
  }
}

const libName = "vite-plugin-vercel:vike";
const rendererDestination = "ssr_";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function assert(condition: unknown, errorMessage: string): asserts condition {
  if (condition) {
    return;
  }

  const err = newError(`[${libName}][Wrong Usage] ${errorMessage}`, 2);
  throw err;
}

interface MissingPageContextOverrides {
  _prerenderResult: {
    filePath: string;
    fileContent: string;
  };
  /**
   * @deprecated
   */
  _pageId: string;
  _baseUrl: string;
  is404?: boolean;
  _urlProcessor: (url: string) => string;
  _pageFilesAll: PageFile[];
  _allPageIds: string[];
  _baseServer: string;
  _urlHandler: null | ((url: string) => string);
}

type PageContextForRoute = Parameters<typeof route>[0];

type PageContext = PageContextServer & MissingPageContextOverrides & PageContextForRoute;

export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

function getOutDirRoot(config: ResolvedConfig) {
  const outDir = config.build.outDir;

  return outDir.endsWith("/server") || outDir.endsWith("/client") ? path.normalize(path.join(outDir, "..")) : outDir;
}

export function getOutput(
  config: ResolvedConfig,
  suffix?: "functions" | `functions/${string}.func` | "static",
): string {
  return path.join(
    config.vercel?.outDir ? "" : getRoot(config),
    config.vercel?.outDir ?? ".vercel/output",
    suffix ?? "",
  );
}

export function getOutDir(config: ResolvedConfig, force?: "client" | "server"): string {
  const p = path.join(config.root, normalizePath(config.build.outDir));
  if (!force) return p;
  return path.join(path.dirname(p), force);
}

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function assertHeaders(exports: unknown): Record<string, string> | null {
  if (exports === null || typeof exports !== "object") return null;
  if (!("headers" in exports)) return null;
  const headers = (exports as { headers: unknown }).headers;

  if (headers === null || headers === undefined) {
    return null;
  }

  assert(typeof headers === "object", " `{ headers }` must be an object");

  for (const value of Object.values(headers)) {
    assert(typeof value === "string", " `{ headers }` must only contains string values");
  }

  return headers as Record<string, string>;
}

function assertEdge(exports: unknown): boolean | null {
  if (exports === null || typeof exports !== "object") return null;
  if (!("edge" in exports)) return null;
  const edge = (exports as { edge: unknown }).edge;

  assert(typeof edge === "boolean", " `{ edge }` must be a boolean");

  return edge;
}

function extractIsr(exports: unknown) {
  if (exports === null || typeof exports !== "object") return null;
  if (!("isr" in exports)) return null;
  const isr = (exports as { isr: unknown }).isr;

  assert(
    typeof isr === "boolean" ||
      (typeof isr === "object" &&
        typeof (isr as Record<string, unknown>).expiration === "number" &&
        (
          isr as {
            expiration: number;
          }
        ).expiration > 0),
    " `{ expiration }` must be a positive number",
  );

  return isr;
}

function assertIsr(resolvedConfig: UserConfig | ResolvedConfig, exports: unknown): number | null {
  const isr = extractIsr(exports);
  if (isr === null || isr === undefined) return null;

  if (isr === true) {
    assert(
      typeof resolvedConfig.vercel?.expiration === "number" && resolvedConfig.vercel?.expiration > 0,
      "`export const isr = true;` requires a default positive value for `expiration` in vite config",
    );

    return resolvedConfig.vercel?.expiration;
  }

  return (
    isr as {
      expiration: number;
    }
  ).expiration;
}

function getRouteMatch(myroute: Awaited<ReturnType<typeof route>>): unknown {
  let routeMatch: unknown = null;

  if ("_routeMatch" in myroute.pageContextAddendum) {
    // Since 0.4.157
    routeMatch = myroute.pageContextAddendum._routeMatch;
  } else if ("_routeMatches" in myroute.pageContextAddendum) {
    // Before 0.4.145
    routeMatch = (myroute.pageContextAddendum._routeMatches as unknown[])?.[0];
  } else if ("_debugRouteMatches" in myroute.pageContextAddendum) {
    // Between 0.4.145 and 0.4.157 (still in place but prefer using _routeMatch)
    routeMatch = myroute.pageContextAddendum._debugRouteMatches?.[0];
  }

  return routeMatch;
}

export const prerender: ViteVercelPrerenderFn = async (
  resolvedConfig: ResolvedConfig,
): Promise<ViteVercelPrerenderRoute> => {
  const routes: ViteVercelPrerenderRoute = {};

  await prerenderCli({
    viteConfig: {
      root: getRoot(resolvedConfig),
      build: {
        outDir: getOutDirRoot(resolvedConfig),
      },
    },

    async onPagePrerender(pageContext: PageContext) {
      const { filePath, fileContent } = pageContext._prerenderResult;

      const isr = assertIsr(resolvedConfig, pageContext.exports);

      const foundRoute = await route(pageContext);

      if (!pageContext.is404) {
        assert(foundRoute, `Page with id ${pageContext.pageId ?? pageContext._pageId} not found`);
        const routeMatch = getRouteMatch(foundRoute);

        // if ISR + Filesystem routing -> ISR prevails
        if (
          typeof isr === "number" &&
          routeMatch &&
          typeof routeMatch !== "string" &&
          (routeMatch as { routeType: string }).routeType === "FILESYSTEM"
        ) {
          return;
        }
      }

      const relPath = path.relative(getOutDir(resolvedConfig, "client"), filePath);
      const newFilePath = path.join(getOutput(resolvedConfig, "static"), relPath);

      const parsed = path.parse(relPath);
      const pathJoined = parsed.name === "index" ? parsed.dir : path.join(parsed.dir, parsed.name);

      if (relPath.endsWith(".html")) {
        routes[relPath] = {
          path: pathJoined === "index" ? "" : pathJoined,
        };
      }

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.writeFile(newFilePath, fileContent);
    },
  });

  return routes;
};

function getRouteDynamicRoute(pageRoutes: PageRoutes, pageId: string) {
  for (const route of pageRoutes) {
    if (route.pageId === pageId) {
      if (route.routeType === "STRING") {
        return getParametrizedRoute(route.routeString);
      }
      if (route.routeType === "FUNCTION") {
        // route.routeType === 'FUNCTION'
        return () => {};
      }
    }
  }

  return null;
}

function getRouteFsRoute(pageRoutes: PageRoutes, pageId: string) {
  for (const route of pageRoutes) {
    if (route.pageId === pageId && route.routeType === "FILESYSTEM") {
      return route.routeString;
    }
  }

  return null;
}

export async function getSsrEdgeEndpoint(): Promise<ViteVercelApiEntry["source"]> {
  const sourcefile = path.join(__dirname, "..", "templates", "ssr_edge_.template.ts");
  const contents = await fs.readFile(sourcefile, "utf-8");
  const resolveDir = path.dirname(sourcefile);

  return {
    contents: contents,
    sourcefile,
    loader: sourcefile.endsWith(".ts")
      ? "ts"
      : sourcefile.endsWith(".tsx")
        ? "tsx"
        : sourcefile.endsWith(".js")
          ? "js"
          : sourcefile.endsWith(".jsx")
            ? "jsx"
            : "default",
    resolveDir,
  };
}

export async function getSsrEndpoint(source?: string) {
  const sourcefile = source ?? path.join(__dirname, "..", "templates", "ssr_.template.ts");
  const contents = await fs.readFile(sourcefile, "utf-8");
  const resolveDir = path.dirname(sourcefile);

  return {
    source: {
      contents: contents,
      sourcefile,
      loader: sourcefile.endsWith(".ts")
        ? "ts"
        : sourcefile.endsWith(".tsx")
          ? "tsx"
          : sourcefile.endsWith(".js")
            ? "js"
            : sourcefile.endsWith(".jsx")
              ? "jsx"
              : "default",
      resolveDir,
    },
    destination: rendererDestination,
    route: false,
  } satisfies ViteVercelApiEntry;
}

export interface Options {
  /**
   * A pattern that matches each incoming pathname that should be caught by vike.
   * As this rule is inserted last, a simple catch-all rule excluding /api/* should be enough.
   * Defaults to `(?!/api).*`
   * @see {@link https://vercel.com/docs/project-configuration#project-configuration/rewrites}
   */
  source?: string;
}

export function vikeVercelPlugin(options: Options = {}): Plugin {
  return {
    name: libName,
    apply: "build",
    async config(userConfig): Promise<UserConfig> {
      // wait for vike second build step with `ssr` flag
      if (!userConfig.build?.ssr) return {};

      const getSsrEndpointIfNotPresent = async (endpoints: ViteVercelApiEntry[]): Promise<ViteVercelApiEntry[]> => {
        return endpoints.flatMap((e) => e.destination).some((d) => d === rendererDestination)
          ? // vite deep merges config
            []
          : [await getSsrEndpoint()];
      };

      const additionalEndpoints: Required<UserConfig>["vercel"]["additionalEndpoints"] = [
        async () => {
          const userEndpoints: ViteVercelApiEntry[] = [];
          if (Array.isArray(userConfig.vercel?.additionalEndpoints)) {
            for (const endpoint of userConfig.vercel.additionalEndpoints) {
              if (typeof endpoint === "function") {
                const res = await endpoint();
                if (Array.isArray(res)) {
                  userEndpoints.push(...res);
                } else {
                  userEndpoints.push(res);
                }
              } else {
                userEndpoints.push(endpoint);
              }
            }
          }

          return getSsrEndpointIfNotPresent(userEndpoints);
        },
      ];

      return {
        vitePluginSsr: {
          prerender: {
            disableAutoRun: true,
          },
        },
        vercel: {
          prerender: userConfig.vercel?.prerender ?? prerender,
          additionalEndpoints,
          defaultSupportsResponseStreaming: true,
          rewrites: [
            {
              source: options.source ? `(${options.source})` : "((?!/api).*)",
              destination: `/${rendererDestination}/?__original_path=$1`,
              enforce: "post",
            },
          ],
        },
      } as UserConfig;
    },
  } as Plugin;
}

/**
 * vps 0.4 compat
 * @deprecated
 * @param pageId
 * @param pageFilesAll
 */
function findPageFile(pageId: string, pageFilesAll: PageFile[]) {
  return pageFilesAll.find((p) => p.pageId === pageId && p.fileType === ".page");
}

export function vitePluginVercelVikeConfigPlugin(): Plugin {
  return {
    name: "vite-plugin-vercel:vike-config",
    apply: "build",
    async config(userConfig): Promise<UserConfig> {
      let memoizedP: ReturnType<typeof _getPagesWithConfigs> | undefined = undefined;

      async function getPagesWithConfigs() {
        if (memoizedP) return memoizedP;
        memoizedP = _getPagesWithConfigs();
        return memoizedP;
      }

      async function _getPagesWithConfigs() {
        const { pageFilesAll, allPageIds, pageRoutes, pageConfigs } = await getPagesAndRoutes();

        const isLegacy = pageFilesAll.length > 0;

        if (isLegacy) {
          await Promise.all(pageFilesAll.map((p) => p.loadFile?.()));
        }

        return Promise.all(
          allPageIds.map(async (pageId) => {
            let page: {
              config: unknown;
              filePath: string;
            };

            if (isLegacy) {
              const _page = await findPageFile(pageId, pageFilesAll);

              assert(
                _page,
                `Cannot find page ${pageId}. Contact the vite-plugin-vercel maintainer on GitHub / Discord`,
              );

              page = {
                config: _page.fileExports,
                filePath: _page.filePath,
              };
            } else {
              const pageConfig = pageConfigs.find((p) => p.pageId === pageId);

              assert(
                pageConfig,
                `Cannot find page config ${pageId}. Contact the vite-plugin-vercel maintainer on GitHub / Discord`,
              );

              const simplePageConfig: Record<string, unknown> = {};

              for (const [k, v] of Object.entries(pageConfig.configValues)) {
                simplePageConfig[k] = v.value;
              }

              page = {
                config: simplePageConfig,
                filePath: pageConfig.pageId,
              };
            }

            const route = getRouteDynamicRoute(pageRoutes, pageId) ?? getRouteFsRoute(pageRoutes, pageId);
            const rawIsr = extractIsr(page.config);
            let isr = assertIsr(userConfig, page.config);
            const edge = assertEdge(page.config);
            const headers = assertHeaders(page.config);

            // if ISR + Function routing -> warn because ISR is not unsupported in this case
            if (typeof route === "function" && isr) {
              console.warn(
                `Page ${pageId}: ISR is not supported when using route function. Remove \`{ isr }\` config or use a route string if possible.`,
              );
              isr = null;
            }

            if (edge && rawIsr !== null && typeof rawIsr === "object") {
              throw new Error(
                `Page ${pageId}: ISR cannot be enabled for edge functions. Remove \`{ isr }\` config or set \`{ edge: false }\`.`,
              );
            }

            return {
              pageId,
              // used for debug purpose
              filePath: page.filePath,
              isr,
              edge,
              headers,
              route: typeof route === "string" ? getParametrizedRoute(route) : null,
            };
          }),
        );
      }

      const edgeSource = await getSsrEdgeEndpoint();

      return {
        vercel: {
          async headers() {
            const pagesWithConfigs = await getPagesWithConfigs();

            return pagesWithConfigs
              .filter((page) => {
                if (!page.route) {
                  console.warn(
                    `Page ${page.pageId}: headers is not supported when using route function. Remove \`{ headers }\` config or use a route string if possible.`,
                  );
                }
                return page.headers !== null && page.headers !== undefined && page.route;
              })
              .flatMap((page) => {
                const headers = Object.entries(page.headers ?? {}).map(([key, value]) => ({
                  key,
                  value,
                }));
                return [
                  {
                    source: `${page.route}`,
                    headers,
                  },
                  {
                    source: `${page.route}/index\\.pageContext\\.json`,
                    headers,
                  },
                ];
              });
          },
          additionalEndpoints: [
            async () => {
              const pagesWithConfigs = await getPagesWithConfigs();

              return pagesWithConfigs
                .filter((page) => {
                  return page.edge === true;
                })
                .map((page) => {
                  if (!page.route) {
                    console.warn(
                      `Page ${page.pageId}: edge is not supported when using route function. Remove \`{ edge }\` config or use a route string if possible.`,
                    );
                  }
                  const destination = `${page.pageId.replace(/\/index$/g, "")}-edge-${nanoid()}`;
                  return {
                    source: edgeSource,
                    destination,
                    route: page.route ? `${page.route}(?:\\/index\\.pageContext\\.json)?` : undefined,
                    edge: true,
                  };
                });
            },
          ],
          isr: async () => {
            let userIsr: Record<string, VercelOutputIsr> = {};
            if (userConfig.vercel?.isr) {
              if (typeof userConfig.vercel.isr === "function") {
                userIsr = await userConfig.vercel.isr();
              } else {
                userIsr = userConfig.vercel.isr;
              }
            }

            const pagesWithConfigs = await getPagesWithConfigs();

            return pagesWithConfigs
              .filter((p) => typeof p.isr === "number")
              .reduce((acc, cur) => {
                const path = `${cur.pageId.replace(/\/index$/g, "")}-${nanoid()}`;
                acc[path] = {
                  // biome-ignore lint/style/noNonNullAssertion: filtered
                  expiration: cur.isr!,
                  symlink: rendererDestination,
                  route: cur.route ? `${cur.route}(?:\\/index\\.pageContext\\.json)?` : undefined,
                };
                return acc;
              }, userIsr);
          },
        },
      };
    },
  } as Plugin;
}

export function vitePluginVercelVikeCopyStaticAssetsPlugins(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    apply: "build",
    name: "vite-plugin-vercel:vike-copy-static-assets",
    enforce: "post",
    configResolved(config) {
      resolvedConfig = config;
    },
    async closeBundle() {
      if (!resolvedConfig.build?.ssr) return;
      await copyDistClientToOutputStatic(resolvedConfig);
    },
  };
}

async function copyDistClientToOutputStatic(resolvedConfig: ResolvedConfig) {
  await copyDir(getOutDir(resolvedConfig, "client"), getOutput(resolvedConfig, "static"));
}

export default function allPlugins(options: Options = {}): Plugin[] {
  return [vitePluginVercelVikeConfigPlugin(), vikeVercelPlugin(options), vitePluginVercelVikeCopyStaticAssetsPlugins()];
}
