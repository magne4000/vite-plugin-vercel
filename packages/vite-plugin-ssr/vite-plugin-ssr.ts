import './hack';
import { prerender as prerenderCli } from 'vite-plugin-ssr/cli';
import fs from 'fs/promises';
import path from 'path';
import { normalizePath, Plugin, ResolvedConfig, UserConfig } from 'vite';
import type { PageContextBuiltIn } from 'vite-plugin-ssr';
import type {
  ViteVercelApiEntry,
  ViteVercelPrerenderFn,
  ViteVercelPrerenderRoute,
  VercelOutputIsr,
} from 'vite-plugin-vercel';
import type { GlobalContext } from 'vite-plugin-ssr/dist/cjs/node/renderPage';
import type { PageRoutes } from 'vite-plugin-ssr/dist/cjs/shared/route/loadPageRoutes';
import './node_modules/vite-plugin-ssr/dist/cjs/node/page-files/setup';
import { getGlobalContext } from './node_modules/vite-plugin-ssr/dist/cjs/node/renderPage';
import { setSsrEnv } from './node_modules/vite-plugin-ssr/dist/cjs/node/ssrEnv';
import { findPageFile } from './node_modules/vite-plugin-ssr/dist/cjs/shared/getPageFiles';
import { nanoid } from 'nanoid';
import { getParametrizedRoute } from './route-regex';
import { newError } from '@brillout/libassert';

const libName = 'vite-plugin-ssr:vercel';
const rendererDestination = 'ssr_';

export function assert(
  condition: unknown,
  errorMessage: string,
): asserts condition {
  if (condition) {
    return;
  }

  const err = newError(`[${libName}][Wrong Usage] ${errorMessage}`, 2);
  throw err;
}

interface PageContext extends PageContextBuiltIn, GlobalContext {
  _prerenderResult: {
    filePath: string;
    fileContent: string;
  };
  _pageId: string;
  is404?: boolean;
}

export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

export function getOutput(
  config: ResolvedConfig,
  suffix?: 'functions' | `functions/${string}.func` | 'static',
): string {
  return path.join(
    config.vercel?.outDir ? '' : getRoot(config),
    config.vercel?.outDir ?? '.vercel/output',
    suffix ?? '',
  );
}

export function getOutDir(
  config: ResolvedConfig,
  force?: 'client' | 'server',
): string {
  const p = normalizePath(config.build.outDir);
  if (!force) return p;
  return path.join(path.dirname(p), force);
}

function assertIsr(
  resolvedConfig: UserConfig | ResolvedConfig,
  pageExports: unknown,
): number | null {
  if (pageExports === null || typeof pageExports !== 'object') return null;
  if (!('isr' in pageExports)) return null;
  const isr = (pageExports as { isr: unknown }).isr;

  assert(
    typeof isr === 'boolean' ||
      (typeof isr === 'object' &&
        typeof (isr as Record<string, unknown>).expiration === 'number' &&
        (
          isr as {
            expiration: number;
          }
        ).expiration > 0),
    ` \`{ expiration }\` must be a positive number`,
  );

  if (isr === true) {
    assert(
      typeof resolvedConfig.vercel?.expiration === 'number' &&
        resolvedConfig.vercel?.expiration > 0,
      '`export const isr = true;` requires a default positive value for `expiration` in vite config',
    );

    return resolvedConfig.vercel?.expiration;
  }

  return (
    isr as {
      expiration: number;
    }
  ).expiration;
}

export const prerender: ViteVercelPrerenderFn = async (
  resolvedConfig: ResolvedConfig,
): Promise<ViteVercelPrerenderRoute> => {
  const routes: ViteVercelPrerenderRoute = {};

  await prerenderCli({
    root: getRoot(resolvedConfig),
    noExtraDir: true,
    async onPagePrerender(pageContext: PageContext) {
      const isr = assertIsr(resolvedConfig, pageContext.pageExports);

      const route = pageContext._pageRoutes.find(
        (r) => r.pageId === pageContext._pageId,
      );

      if (!pageContext.is404) {
        assert(route, `Page with id ${pageContext._pageId} not found`);

        // if ISR + Filesystem routing -> ISR prevails
        if (
          !pageContext.is404 &&
          typeof isr === 'number' &&
          !route.pageRouteFile
        )
          return;
      }

      const { filePath, fileContent } = pageContext._prerenderResult;
      const relPath = path.posix.relative(
        getOutDir(resolvedConfig, 'client'),
        filePath,
      );
      const newFilePath = path.join(
        getOutput(resolvedConfig, 'static'),
        relPath,
      );

      const parsed = path.parse(relPath);
      const pathJoined = path.join(parsed.dir, parsed.name);

      if (relPath.endsWith('.html')) {
        routes[relPath] = {
          path: pathJoined === 'index' ? '' : pathJoined,
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
    if (route.pageId === pageId && route.pageRouteFile) {
      return route.pageRouteFile.routeValue;
    }
  }

  return null;
}

function getRouteFsRoute(pageRoutes: PageRoutes, pageId: string) {
  for (const route of pageRoutes) {
    if (
      route.pageId === pageId &&
      !route.pageRouteFile &&
      route.filesystemRoute
    ) {
      return route.filesystemRoute;
    }
  }

  return null;
}

export async function getSsrEndpoint(
  userConfig: UserConfig,
  source?: string,
): Promise<ViteVercelApiEntry> {
  const sourcefile =
    source ?? path.join(__dirname, '..', 'templates', 'ssr_.template.ts');
  const contents = await fs.readFile(sourcefile, 'utf-8');

  const importBuildPath = path.join(
    getRoot(userConfig),
    userConfig.build?.outDir ?? 'dist/server',
    'importBuild',
  );
  const resolveDir = path.dirname(sourcefile);
  const relativeImportBuildPath = path.posix.relative(
    resolveDir,
    importBuildPath,
  );

  return {
    source: {
      contents: `import '${relativeImportBuildPath}';\n` + contents,
      sourcefile,
      loader: sourcefile.endsWith('.ts')
        ? 'ts'
        : sourcefile.endsWith('.tsx')
        ? 'tsx'
        : sourcefile.endsWith('.js')
        ? 'js'
        : sourcefile.endsWith('.jsx')
        ? 'jsx'
        : 'default',
      resolveDir,
    },
    destination: rendererDestination,
    addRoute: false,
  };
}

export interface Options {
  /**
   * A pattern that matches each incoming pathname that should be caught by vite-plugin-ssr.
   * As this rule is inserted last, a simple catch-all rule excluding /api/* should be enough.
   * Defaults to `(?!/api).*`
   * @see {@link https://vercel.com/docs/project-configuration#project-configuration/rewrites}
   */
  source?: string;
}

export function vitePluginSsrVercelPlugin(options: Options = {}): Plugin {
  return {
    name: libName,
    apply: 'build',
    async config(userConfig): Promise<UserConfig> {
      const additionalEndpoints = userConfig.vercel?.additionalEndpoints
        ?.flatMap((e) => e.destination)
        .some((d) => d === rendererDestination)
        ? userConfig.vercel?.additionalEndpoints
        : [
            ...(userConfig.vercel?.additionalEndpoints ?? []),
            await getSsrEndpoint(userConfig),
          ];

      const rewrites = userConfig.vercel?.rewrites ?? [];
      rewrites.push({
        source: options.source ? `(${options.source})` : '((?!/api).*)',
        destination: `/${rendererDestination}/?__original_path=$1`,
        enforce: 'post',
      });

      return {
        vercel: {
          prerender: userConfig.vercel?.prerender ?? prerender,
          additionalEndpoints,
          rewrites,
        },
      };
    },
  } as Plugin;
}

export function vitePluginSsrVercelIsrPlugin(): Plugin {
  return {
    name: 'vite-plugin-ssr:vercel-isr',
    apply: 'build',
    async config(userConfig): Promise<UserConfig> {
      if (!userConfig.build?.ssr) return {};

      return {
        vercel: {
          isr: async () => {
            let userIsr: Record<string, VercelOutputIsr> = {};
            if (userConfig.vercel?.isr) {
              if (typeof userConfig.vercel.isr === 'function') {
                userIsr = await userConfig.vercel.isr();
              } else {
                userIsr = userConfig.vercel.isr;
              }
            }

            setProductionEnvVar();
            setSsrEnv({
              isProduction: true,
              root: process.cwd(),
              outDir: 'dist',
              viteDevServer: undefined,
              baseUrl: '/',
              baseAssets: null,
            });
            const globalContext: GlobalContext = await getGlobalContext();

            const allPages = await Promise.all(
              globalContext._allPageFiles['.page'].map(async (p) => {
                return {
                  filePath: p.filePath,
                  pageExports: await p.loadFile(),
                };
              }),
            );

            const pagesWithIsr = globalContext._allPageIds.map((pageId) => {
              const page = findPageFile(allPages, pageId)!;
              const route =
                getRouteDynamicRoute(globalContext._pageRoutes, pageId) ??
                getRouteFsRoute(globalContext._pageRoutes, pageId);
              let isr = assertIsr(userConfig, page.pageExports);

              // if ISR + Function routing -> warn because ISR is not unsupported in this case
              if (typeof route === 'function' && isr) {
                console.warn(
                  `Page ${pageId}: ISR is not supported when using route function. Remove \`{ isr }\` export or use a route string if possible.`,
                );
                isr = null;
              }

              return {
                _pageId: pageId,
                filePath: page.filePath,
                isr,
                route:
                  typeof route === 'string'
                    ? getParametrizedRoute(route)
                    : null,
              };
            });

            return pagesWithIsr
              .filter((p) => typeof p.isr === 'number')
              .reduce((acc, cur) => {
                const path =
                  cur._pageId.replace(/\/index$/g, '') + '-' + nanoid();
                acc[path] = {
                  expiration: cur.isr!,
                  symlink: rendererDestination,
                  route: cur.route
                    ? cur.route + '(?:\\.pageContext\\.json)?'
                    : undefined,
                };
                return acc;
              }, userIsr);
          },
        },
      };
    },
  } as Plugin;
}

function setProductionEnvVar() {
  // The statement `process.env['NODE_ENV'] = 'production'` chokes webpack v4 (which Cloudflare Workers uses)
  const proc = process;
  const { env } = proc;
  env['NODE_ENV'] = 'production';
}

export default function allPlugins(options: Options = {}): Plugin[] {
  return [vitePluginSsrVercelIsrPlugin(), vitePluginSsrVercelPlugin(options)];
}
