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

export const prerender: ViteVercelPrerenderFn = async (
  resolvedConfig: ResolvedConfig,
) => {
  const isrPagesWhitelist: string[] = Object.keys(
    resolvedConfig.vercel?.prerenderManifest?.routes ?? [],
  );

  const routes: NonNullable<ViteVercelPrerenderRoute> = {
    ssr: {
      dynamicRoutes: [
        {
          page: '/' + ssrEndpointDestination,
          regex: '^/((?!assets/)(?!api/).*)$',
        },
      ],
    },
  };

  await prerenderCli({
    root: getRoot(resolvedConfig),
    noExtraDir: true,
    async onPagePrerender(pageContext: PageContext) {
      assert(
        typeof pageContext.pageExports.initialRevalidateSeconds === 'number' ||
          typeof pageContext.pageExports.initialRevalidateSeconds ===
            'undefined',
        ` \`{ initialRevalidateSeconds }\` must be a number`,
      );

      const { filePath, fileContent } = pageContext._prerenderResult;
      const newFilePath = path.join(
        getOutput(resolvedConfig),
        'server/pages',
        path.relative(getOutDir(resolvedConfig, 'client'), filePath),
      );

      if (
        isrPagesWhitelist.includes(pageContext.urlPathname) ||
        pageContext.pageExports.initialRevalidateSeconds
      ) {
        if (!routes.isr) {
          routes.isr = { routes: {} };
        }
        if (!routes.isr.routes) {
          routes.isr.routes = {};
        }

        routes.isr.routes[pageContext.urlPathname] = {
          srcRoute: '/' + isrEndpointDestination,
          initialRevalidateSeconds:
            pageContext.pageExports.initialRevalidateSeconds === 0
              ? resolvedConfig.vercel?.initialRevalidateSeconds
              : pageContext.pageExports.initialRevalidateSeconds,
        };
      }

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.writeFile(newFilePath, fileContent);
    },
  });

  return routes;
};

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
