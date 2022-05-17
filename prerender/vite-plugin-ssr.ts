// TODO move in vite-plugin-ssr
import '@vercel/node';
import { prerender as prerenderCli } from 'vite-plugin-ssr/cli';
import path from 'path';
import fs from 'fs/promises';
import { normalizePath, Plugin, ResolvedConfig, UserConfig } from 'vite';
import { PageContextBuiltIn } from 'vite-plugin-ssr';
import {
  ViteVercelApiEntry,
  ViteVercelPrerenderFn,
  ViteVercelPrerenderRoute,
} from 'vite-plugin-vercel';
import { newError } from '@brillout/libassert';
import type { GlobalContext } from 'vite-plugin-ssr/dist/cjs/node/renderPage';
import type { PageRoutes } from 'vite-plugin-ssr/dist/cjs/shared/route/loadPageRoutes';
import '../node_modules/vite-plugin-ssr/dist/cjs/node/page-files/setup';
import { getGlobalContext } from '../node_modules/vite-plugin-ssr/dist/cjs/node/renderPage';
import { setSsrEnv } from '../node_modules/vite-plugin-ssr/dist/cjs/node/ssrEnv';
import { findPageFile } from '../node_modules/vite-plugin-ssr/dist/cjs/shared/getPageFiles';
import { nanoid } from 'nanoid';
import { getParametrizedRoute } from './route-regex';
import { VercelOutputIsr } from 'vite-plugin-vercel/src/index';

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
      const { filePath, fileContent } = pageContext._prerenderResult;
      const relPath = path.relative(
        getOutDir(resolvedConfig, 'client'),
        filePath,
      );
      const newFilePath = path.join(
        getOutput(resolvedConfig, 'static'),
        relPath,
      );

      const parsed = path.parse(relPath);
      const pathJoined = path.join(parsed.dir, parsed.name);

      routes[relPath] = {
        path: pathJoined === 'index' ? '' : pathJoined,
      };

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.writeFile(newFilePath, fileContent);
    },
  });

  return routes;
};

function getRouteDynamicRoute(pageRoutes: PageRoutes, pageId: string) {
  for (const route of pageRoutes) {
    if (
      route.pageId === pageId &&
      route.pageRouteFile &&
      typeof route.pageRouteFile.routeValue === 'string'
    ) {
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
    source ?? path.join(__dirname, 'templates', 'ssr_.template.ts');
  const contents = await fs.readFile(sourcefile, 'utf-8');

  const importBuildPath = path.join(
    getRoot(userConfig),
    userConfig.build?.outDir ?? 'dist/server',
    'importBuild',
  );
  const resolveDir = path.dirname(sourcefile);
  const relativeImportBuildPath = path.relative(resolveDir, importBuildPath);

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
  };
}

export function vitePluginSsrVercelPlugin(): Plugin {
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

      return {
        vercel: {
          prerender: userConfig.vercel?.prerender ?? prerender,
          additionalEndpoints,
          config: {
            routes: [{ src: '(/.*)', dest: `/${rendererDestination}` }],
          },
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
              return {
                _pageId: pageId,
                filePath: page.filePath,
                isr: assertIsr(userConfig, page.pageExports),
                route: route ? getParametrizedRoute(route) : null,
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
                  route: cur.route ?? undefined,
                };
                return acc;
              }, {} as Record<string, VercelOutputIsr>);
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

export default function allPlugins(): Plugin[] {
  return [vitePluginSsrVercelIsrPlugin(), vitePluginSsrVercelPlugin()];
}
