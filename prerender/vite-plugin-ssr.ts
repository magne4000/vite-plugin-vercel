// TODO move in vite-plugin-ssr
import '@vercel/node';
import { prerender as prerenderCli } from 'vite-plugin-ssr/cli';
import path from 'path';
import fs from 'fs/promises';
import { normalizePath, Plugin, ResolvedConfig, UserConfig } from 'vite';
import { PageContextBuiltIn } from 'vite-plugin-ssr';
import {
  ViteVercelPrerenderFn,
  ViteVercelPrerenderRoute,
} from 'vite-plugin-vercel';
import { newError } from '@brillout/libassert';
import { GlobalContext } from 'vite-plugin-ssr/dist/cjs/node/renderPage';
import { build, BuildOptions } from 'esbuild';

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
  const routes: NonNullable<ViteVercelPrerenderRoute> = {};
  const prerenderedPages: string[] = [];
  let globalContext: GlobalContext | undefined = undefined;
  const isrPagesWhitelist: string[] = Object.keys(
    resolvedConfig.vercel?.prerenderManifest?.routes ?? [],
  );

  await prerenderCli({
    root: getRoot(resolvedConfig),
    noExtraDir: true,
    async onPagePrerender(pageContext: PageContext) {
      if (!globalContext) {
        // TODO use getGlobalContext when moving into vite-plugin-ssr
        globalContext = pageContext as unknown as GlobalContext;
      }

      assert(
        typeof pageContext.pageExports.initialRevalidateSeconds === 'number' ||
          typeof pageContext.pageExports.initialRevalidateSeconds ===
            'undefined',
        ` \`{ initialRevalidateSeconds }\` must be a number`,
      );

      const { filePath } = pageContext._prerenderResult;
      const newFilePath = path.join(
        getRoot(resolvedConfig),
        '.output/server/pages',
        path.relative(getOutDir(resolvedConfig, 'client'), filePath),
      );

      if (
        isrPagesWhitelist.includes(pageContext.url) ||
        pageContext.pageExports.initialRevalidateSeconds
      ) {
        if (!routes.isr) {
          routes.isr = { routes: {} };
        }
        if (!routes.isr.routes) {
          routes.isr.routes = {};
        }

        routes.isr.routes[pageContext.url] = {
          srcRoute: '/' + isrEndpointDestination,
          initialRevalidateSeconds:
            pageContext.pageExports.initialRevalidateSeconds === 0
              ? resolvedConfig.vercel?.ssr?.initialRevalidateSeconds
              : pageContext.pageExports.initialRevalidateSeconds,
        };
      }

      prerenderedPages.push(pageContext.url);

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.writeFile(newFilePath, pageContext._prerenderResult.fileContent);
    },
  });

  // Compute data for dynamic ssr pages (routes-manifest)
  const ssrPages = globalContext!._pageRoutes
    .map((p) => p.filesystemRoute)
    .filter((p) => !prerenderedPages.includes(p));
  if (ssrPages.length > 0) {
    if (!routes.ssr) {
      routes.ssr = { rewrites: [] };
    }
    if (!routes.ssr.rewrites) {
      routes.ssr.rewrites = [];
    }

    const rewrites = resolvedConfig.vercel?.routesManifest?.rewrites ?? [];

    for (const route of ssrPages) {
      // can be overriden by user config or another plugin
      const overrideRewrite = rewrites.find((r) => r.source === route);

      routes.ssr.rewrites.push({
        source: route,
        destination: '/' + ssrEndpointDestination,
        // TODO not sure that .* should be there
        regex: '^' + route + '.*$',
        ...overrideRewrite,
      });
    }
  }

  return routes;
};

const commonBuildOptions: BuildOptions = {
  bundle: true,
  target: 'es2020',
  format: 'cjs',
  platform: 'node',
  logLevel: 'info',
  minify: true,
};

/**
 * Build `vite-plugin-ssr` specific endpoint
 *
 * @param resolvedConfig
 * @param source path to a file exporting a Vercel handler using `vite-plugin-ssr`. If not specified, default template is used
 */
export async function buildApiEndpoints(
  resolvedConfig: ResolvedConfig,
  source?: string,
) {
  const sourcefile =
    source ?? path.join(__dirname, 'templates', 'ssr_.template.ts');
  const contents = await fs.readFile(sourcefile, 'utf-8');

  const outfile = path.join(
    getRoot(resolvedConfig),
    '.output/server/pages',
    `${ssrEndpointDestination}.js`,
  );

  const outfile2 = path.join(
    getRoot(resolvedConfig),
    '.output/server/pages',
    `${isrEndpointDestination}.js`,
  );

  const importBuildPath = path.join(
    getRoot(resolvedConfig),
    'dist/server/importBuild',
  );
  const resolveDir = path.dirname(sourcefile);
  const relativeImportBuildPath = path.relative(resolveDir, importBuildPath);

  await build({
    ...commonBuildOptions,
    outfile,
    stdin: {
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
  });

  // `.output/server/pages` for static and ISR pages, `.output/server/pages/api` for SSR pages
  await fs.copyFile(outfile, outfile2);

  const pages = resolvedConfig.vercel?.functionsManifest?.pages ?? {};
  return {
    [isrEndpointDestination]: {
      maxDuration: 10,
      ...(pages[isrEndpointDestination] ?? pages[ssrEndpointDestination]),
    },
    [ssrEndpointDestination]: {
      maxDuration: 10,
      ...(pages[isrEndpointDestination] ?? pages[ssrEndpointDestination]),
    },
  };
}

export function vitePluginSsrVercelPlugin(): Plugin {
  return {
    name: libName,
    apply: 'build',
    config(userConfig) {
      return {
        vercel: {
          isr: {
            prerender: userConfig.vercel?.ssr?.prerender ?? prerender,
          },
          buildApiEndpoints,
        },
      };
    },
  } as Plugin;
}
