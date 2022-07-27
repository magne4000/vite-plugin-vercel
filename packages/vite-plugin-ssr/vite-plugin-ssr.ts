import './hack';
import { prerender as prerenderCli } from 'vite-plugin-ssr/prerender';
import fs from 'fs/promises';
import path from 'path';
import { normalizePath, Plugin, ResolvedConfig, UserConfig } from 'vite';
import type { PageContextBuiltIn } from 'vite-plugin-ssr';
import type {
  VercelOutputIsr,
  ViteVercelApiEntry,
  ViteVercelPrerenderFn,
  ViteVercelPrerenderRoute,
} from 'vite-plugin-vercel';
import 'vite-plugin-ssr/__internal/setup';
import {
  route,
  getPagesAndRoutes,
  PageFile,
  PageRoutes,
} from 'vite-plugin-ssr/__internal';
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
}

type PageContext = PageContextBuiltIn & MissingPageContextOverrides;

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

    entry.isDirectory()
      ? await copyDir(srcPath, destPath)
      : await fs.copyFile(srcPath, destPath);
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
      vitePluginSsr: {
        prerender: {
          noExtraDir: true,
        },
      },
      build: {
        outDir: getOutDirRoot(resolvedConfig),
      },
    } as any,

    async onPagePrerender(pageContext: PageContext) {
      const isr = assertIsr(resolvedConfig, pageContext.exports);

      // bypass this check https://github.com/brillout/vite-plugin-ssr/blob/dcc91ac31824ca3240c107380789209d52d0dff9/vite-plugin-ssr/shared/addComputedUrlProps.ts#L25
      delete (pageContext as any).urlPathname;
      delete (pageContext as any).urlParsed;

      const foundRoute = await route(pageContext);

      if ('hookError' in foundRoute) {
        throw foundRoute.hookError;
      }

      if (!pageContext.is404) {
        assert(foundRoute, `Page with id ${pageContext._pageId} not found`);
        const routeMatch = foundRoute.pageContextAddendum._routeMatches?.[0];

        // if ISR + Filesystem routing -> ISR prevails
        if (
          !pageContext.is404 &&
          typeof isr === 'number' &&
          routeMatch &&
          typeof routeMatch !== 'string' &&
          routeMatch.routeType === 'FILESYSTEM'
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
        : [
            ...(userConfig.vercel?.additionalEndpoints ?? []),
            await getSsrEndpoint(userConfig),
          ];

      return {
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
      };
    },
  } as Plugin;
}

function findPageFile(pageId: string, pageFilesAll: PageFile[]) {
  return pageFilesAll.find(
    (p) => p.pageId === pageId && p.fileType !== '.page.route',
  );
}

export function vitePluginSsrVercelIsrPlugin(): Plugin {
  return {
    name: 'vite-plugin-ssr:vercel-isr',
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

            const { pageFilesAll, allPageIds, pageRoutes } =
              await getPagesAndRoutes();

            await Promise.all(pageFilesAll.map((p) => p.loadFile?.()));

            const pagesWithIsr = await Promise.all(
              allPageIds.map(async (pageId) => {
                const page = await findPageFile(pageId, pageFilesAll);

                assert(
                  page,
                  `Cannot find page ${pageId}. Contact the vite-plugin-vercel maintainer on GitHub / Discord`,
                );

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

export function vitePluginSsrVercelCopyStaticAssetsPlugins(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    apply: 'build',
    name: 'vite-plugin-ssr:vercel-copy-static-assets',
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
    vitePluginSsrVercelIsrPlugin(),
    vitePluginSsrVercelPlugin(options),
    vitePluginSsrVercelCopyStaticAssetsPlugins(),
  ];
}
