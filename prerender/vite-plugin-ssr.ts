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
import { GlobalContext } from 'vite-plugin-ssr/dist/cjs/node/renderPage';
import { PageRoutes } from 'vite-plugin-ssr/dist/cjs/shared/route/loadPageRoutes';
import { getComplementaryRoutesRegex, getRoutesRegex } from './route-regex';

const libName = 'vite-plugin-ssr:vercel';
const ssrEndpointDestination = 'api/ssr_';
const isrEndpointDestination = 'ssr_';

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
  suffix?: 'server/pages' | 'server/pages/api' | 'static',
): string {
  return path.join(
    config.vercel?.outDir ? '' : getRoot(config),
    config.vercel?.outDir ?? '.output',
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
  resolvedConfig: ResolvedConfig,
  pageContext: PageContext,
): number | null {
  if (!('isr' in pageContext.pageExports)) return null;
  const isr = pageContext.pageExports.isr;

  assert(
    typeof isr === 'boolean' ||
      (typeof isr === 'object' &&
        typeof (isr as Record<string, unknown>).initialRevalidateSeconds ===
          'number' &&
        (
          isr as {
            initialRevalidateSeconds: number;
          }
        ).initialRevalidateSeconds > 0),
    ` \`{ initialRevalidateSeconds }\` must be a positive number`,
  );

  if (isr === true) {
    assert(
      typeof resolvedConfig.vercel?.initialRevalidateSeconds === 'number' &&
        resolvedConfig.vercel?.initialRevalidateSeconds > 0,
      '`export const isr = true;` requires a default positive value for `initialRevalidateSeconds` in vite config',
    );

    return resolvedConfig.vercel?.initialRevalidateSeconds;
  }

  return (
    isr as {
      initialRevalidateSeconds: number;
    }
  ).initialRevalidateSeconds;
}

export const prerender: ViteVercelPrerenderFn = async (
  resolvedConfig: ResolvedConfig,
) => {
  let globalContext: GlobalContext | undefined = undefined;
  const isrPagesWhitelist: string[] = Object.keys(
    resolvedConfig.vercel?.prerenderManifest?.routes ?? [],
  );

  const routes: NonNullable<ViteVercelPrerenderRoute> = {
    ssr: {
      dynamicRoutes: [],
    },
  };

  await prerenderCli({
    root: getRoot(resolvedConfig),
    noExtraDir: true,
    async onPagePrerender(pageContext: PageContext) {
      if (!globalContext) {
        // TODO use getGlobalContext when moving into vite-plugin-ssr
        globalContext = pageContext as unknown as GlobalContext;
      }
      const isr = assertIsr(resolvedConfig, pageContext);

      const { filePath, fileContent } = pageContext._prerenderResult;
      const newFilePath = path.join(
        getOutput(resolvedConfig),
        'server/pages',
        path.relative(getOutDir(resolvedConfig, 'client'), filePath),
      );

      if (isrPagesWhitelist.includes(pageContext.urlPathname) || isr) {
        const override =
          resolvedConfig.vercel?.prerenderManifest?.routes?.[
            pageContext.urlPathname
          ];

        if (!routes.isr) {
          routes.isr = { routes: {} };
        }
        if (!routes.isr.routes) {
          routes.isr.routes = {};
        }

        assert(
          isr ??
            (typeof override?.initialRevalidateSeconds === 'number' &&
              override.initialRevalidateSeconds > 0),
          `prerenderManifest route ${pageContext.urlPathname} has no \`initialRevalidateSeconds\``,
        );

        routes.isr.routes[pageContext.urlPathname] = {
          srcRoute: '/' + isrEndpointDestination,
          dataRoute: '', // TODO .pageContext.json support
          initialRevalidateSeconds: isr ?? override?.initialRevalidateSeconds,
          ...resolvedConfig.vercel?.prerenderManifest?.routes?.[
            pageContext.urlPathname
          ],
        };
      }

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.writeFile(newFilePath, fileContent);
    },
  });

  const dynamicIsrRoutes = getRouteDynamicIsrRoutes(globalContext!._pageRoutes);

  console.log('dynamicIsrRoutes', dynamicIsrRoutes);

  if (dynamicIsrRoutes.length > 0) {
    if (!routes.isr) {
      routes.isr = { dynamicRoutes: {} };
    }
    if (!routes.isr.dynamicRoutes) {
      routes.isr.dynamicRoutes = {};
    }

    const regex = getRoutesRegex(dynamicIsrRoutes);
    console.log('regex', regex);

    // routes.isr.dynamicRoutes['/' + ssrEndpointDestination] = {
    // routes.isr.dynamicRoutes['/' + isrEndpointDestination] = {
    routes.isr.dynamicRoutes['/named/id-1'] = {
      routeRegex: regex,
      fallback: null,
      dataRoute: '',
      dataRouteRegex: '',
    };

    // FIXME not verified
    // routes-manifest.json dynamicRoutes have priority against prerender-manifest.json dynamicRoutes.
    // We want prerender-manifest.json dynamicRoutes to be taken inbto account, so we must exclude its regex
    // from routes-manifest.json dynamicRoutes.
    const appendToIsrRouteManifest =
      getComplementaryRoutesRegex(dynamicIsrRoutes);

    // routes.ssr!.dynamicRoutes!.push({
    //   page: '/' + isrEndpointDestination,
    //   regex: regex,
    // });
    //
    routes.ssr!.dynamicRoutes!.push({
      // page: '/' + isrEndpointDestination,
      page: '/' + ssrEndpointDestination,
      regex: `^/((?!assets/)(?!api/).*)$`,
      // regex: `^((?!/assets/.*)(?!/api/.*)${appendToIsrRouteManifest})$`,
    });
  }

  return routes;
};

function getRouteDynamicIsrRoutes(pageRoutes: PageRoutes) {
  const routes: string[] = [];

  for (const route of pageRoutes) {
    if (route.pageRouteFile) {
      if (typeof route.pageRouteFile.routeValue === 'string') {
        routes.push(route.pageRouteFile.routeValue);
      }
    }
  }

  return routes;
}

export async function getSsrEndpoint(
  userConfig: UserConfig,
  source?: string,
): Promise<ViteVercelApiEntry> {
  const sourcefile =
    source ?? path.join(__dirname, 'templates', 'ssr_.template.ts');
  const contents = await fs.readFile(sourcefile, 'utf-8');
  const destination = [ssrEndpointDestination, isrEndpointDestination];

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
    destination,
  };
}

export function vitePluginSsrVercelPlugin(): Plugin {
  return {
    name: libName,
    apply: 'build',
    async config(userConfig): Promise<UserConfig> {
      const additionalEndpoints = userConfig.vercel?.additionalEndpoints
        ?.flatMap((e) => e.destination)
        .some(
          (d) => d === ssrEndpointDestination || d === isrEndpointDestination,
        )
        ? userConfig.vercel?.additionalEndpoints
        : [
            ...(userConfig.vercel?.additionalEndpoints ?? []),
            await getSsrEndpoint(userConfig),
          ];

      return {
        vercel: {
          prerender: userConfig.vercel?.prerender ?? prerender,
          additionalEndpoints,
        },
      };
    },
  } as Plugin;
}

export default {
  vitePluginSsrVercelPlugin,
};
