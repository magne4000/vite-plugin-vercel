import { prerender as prerenderCli } from 'vite-plugin-ssr/prerender';
import fs from 'fs/promises';
import path from 'path';
import { normalizePath, Plugin, ResolvedConfig, UserConfig } from 'vite';
import type { PageContextBuiltInServer } from 'vite-plugin-ssr/types';
import type {
  VercelOutputIsr,
  ViteVercelApiEntry,
  ViteVercelPrerenderFn,
  ViteVercelPrerenderRoute,
} from 'vite-plugin-vercel';
import 'vite-plugin-ssr/__internal/setup';
import {
  getPagesAndRoutes,
  PageFile,
  PageRoutes,
  route,
} from 'vite-plugin-ssr/__internal';
import { nanoid } from 'nanoid';
import { getParametrizedRoute, getRoutesRegex } from './route-regex';
import { newError } from '@brillout/libassert';

const libName = 'vite-plugin-vercel:vike';
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

interface MissingPageContextOverrides {
  _prerenderResult: {
    filePath: string;
    fileContent: string;
  };
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

type PageContext = PageContextBuiltInServer &
  MissingPageContextOverrides &
  PageContextForRoute;

export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

function getOutDirRoot(config: ResolvedConfig) {
  const outDir = config.build.outDir;

  return outDir.endsWith('/server') || outDir.endsWith('/client')
    ? path.normalize(path.join(outDir, '..'))
    : outDir;
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

function assertIsr(
  resolvedConfig: UserConfig | ResolvedConfig,
  exports: unknown,
): number | null {
  if (exports === null || typeof exports !== 'object') return null;
  if (!('isr' in exports)) return null;
  const isr = (exports as { isr: unknown }).isr;

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
    viteConfig: {
      root: getRoot(resolvedConfig),
      build: {
        outDir: getOutDirRoot(resolvedConfig),
      },
    } as any,

    async onPagePrerender(pageContext: PageContext) {
      const { filePath, fileContent } = pageContext._prerenderResult;

      const isr = assertIsr(resolvedConfig, pageContext.exports);

      // bypass this check https://github.com/brillout/vite-plugin-ssr/blob/dcc91ac31824ca3240c107380789209d52d0dff9/vite-plugin-ssr/shared/addComputedUrlProps.ts#L25
      delete (pageContext as any).urlPathname;
      delete (pageContext as any).urlParsed;

      const foundRoute = await route(pageContext);

      if (!pageContext.is404) {
        assert(foundRoute, `Page with id ${pageContext._pageId} not found`);
        const routeMatch = foundRoute.pageContextAddendum._routeMatches?.[0];

        // if ISR + Filesystem routing -> ISR prevails
        if (
          typeof isr === 'number' &&
          routeMatch &&
          typeof routeMatch !== 'string' &&
          routeMatch.routeType === 'FILESYSTEM'
        ) {
          return;
        }
      }

      const relPath = path.relative(
        getOutDir(resolvedConfig, 'client'),
        filePath,
      );
      const newFilePath = path.join(
        getOutput(resolvedConfig, 'static'),
        relPath,
      );

      const parsed = path.parse(relPath);
      const pathJoined =
        parsed.name === 'index'
          ? parsed.dir
          : path.join(parsed.dir, parsed.name);

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
    if (route.pageId === pageId) {
      if (route.routeType === 'STRING') {
        return getParametrizedRoute(route.routeString);
      } else if (route.routeType === 'FUNCTION') {
        // route.routeType === 'FUNCTION'
        return () => {};
      }
    }
  }

  return null;
}

function getRouteFsRoute(pageRoutes: PageRoutes, pageId: string) {
  for (const route of pageRoutes) {
    if (route.pageId === pageId && route.routeType === 'FILESYSTEM') {
      return route.routeString;
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
  const resolveDir = path.dirname(sourcefile);

  return {
    source: {
      contents: contents,
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
      // wait for vite-plugin-ssr second build step with `ssr` flag
      if (!userConfig.build?.ssr) return {};

      const additionalEndpoints = userConfig.vercel?.additionalEndpoints
        ?.flatMap((e) => e.destination)
        .some((d) => d === rendererDestination)
        ? userConfig.vercel?.additionalEndpoints
        : [await getSsrEndpoint(userConfig)];

      return {
        vitePluginSsr: {
          prerender: {
            disableAutoRun: true,
          },
        },
        vercel: {
          prerender: userConfig.vercel?.prerender ?? prerender,
          additionalEndpoints,
          rewrites: [
            {
              source: options.source ? `(${options.source})` : '((?!/api).*)',
              destination: `/${rendererDestination}/?__original_path=$1`,
              enforce: 'post',
            },
          ],
        },
      } as any;
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
  return pageFilesAll.find(
    (p) => p.pageId === pageId && p.fileType === '.page',
  );
}

export function vitePluginVercelVpsIsrPlugin(): Plugin {
  return {
    name: 'vite-plugin-vercel:vps-isr',
    apply: 'build',
    async config(userConfig): Promise<UserConfig> {
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

            const { pageFilesAll, allPageIds, pageRoutes, pageConfigs } =
              await getPagesAndRoutes();

            const isLegacy = pageFilesAll.length > 0;

            if (isLegacy) {
              await Promise.all(pageFilesAll.map((p) => p.loadFile?.()));
            }

            const pagesWithIsr = await Promise.all(
              allPageIds.map(async (pageId) => {
                let page: {
                  fileExports: unknown;
                  filePath: string;
                };

                if (isLegacy) {
                  const _page = await findPageFile(pageId, pageFilesAll);

                  assert(
                    _page,
                    `Cannot find page ${pageId}. Contact the vite-plugin-vercel maintainer on GitHub / Discord`,
                  );

                  page = {
                    fileExports: _page.fileExports,
                    filePath: _page.filePath,
                  };
                } else {
                  const pageConfig = pageConfigs.find(
                    (p) => p.pageId === pageId,
                  );

                  assert(
                    pageConfig,
                    `Cannot find page config ${pageId}. Contact the vite-plugin-vercel maintainer on GitHub / Discord`,
                  );

                  const files = await pageConfig.loadCodeFiles();

                  const _page = files.find(
                    (f) => f.configName === 'Page' && f.isPlusFile,
                  );

                  assert(
                    _page && _page.isPlusFile,
                    `Cannot find page ${pageId}. Contact the vite-plugin-vercel maintainer on GitHub / Discord`,
                  );

                  page = {
                    fileExports: _page.codeFileExports,
                    filePath: _page.codeFilePath,
                  };
                }

                const route =
                  getRouteDynamicRoute(pageRoutes, pageId) ??
                  getRouteFsRoute(pageRoutes, pageId);
                let isr = assertIsr(userConfig, page.fileExports);

                // if ISR + Function routing -> warn because ISR is not unsupported in this case
                if (typeof route === 'function' && isr) {
                  console.warn(
                    `Page ${pageId}: ISR is not supported when using route function. Remove \`{ isr }\` export or use a route string if possible.`,
                  );
                  isr = null;
                }

                return {
                  _pageId: pageId,
                  // used for debug purpose
                  filePath: page.filePath,
                  isr,
                  route:
                    typeof route === 'string'
                      ? getParametrizedRoute(route)
                      : null,
                };
              }),
            );

            return pagesWithIsr
              .filter((p) => typeof p.isr === 'number')
              .reduce((acc, cur) => {
                const path =
                  cur._pageId.replace(/\/index$/g, '') + '-' + nanoid();
                acc[path] = {
                  expiration: cur.isr!,
                  symlink: rendererDestination,
                  route: cur.route
                    ? cur.route + '(?:\\/index\\.pageContext\\.json)?'
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

export function vitePluginVercelVpsCopyStaticAssetsPlugins(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    apply: 'build',
    name: 'vite-plugin-vercel:vps-copy-static-assets',
    enforce: 'post',
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
  await copyDir(
    getOutDir(resolvedConfig, 'client'),
    getOutput(resolvedConfig, 'static'),
  );
}

function setProductionEnvVar() {
  // The statement `process.env['NODE_ENV'] = 'production'` chokes webpack v4 (which Cloudflare Workers uses)
  const proc = process;
  const { env } = proc;
  env['NODE_ENV'] = 'production';
}

export default function allPlugins(options: Options = {}): Plugin[] {
  return [
    vitePluginVercelVpsIsrPlugin(),
    vitePluginSsrVercelPlugin(options),
    vitePluginVercelVpsCopyStaticAssetsPlugins(),
  ];
}
