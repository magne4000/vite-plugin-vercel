import fs from 'fs/promises';
import type { Plugin, PluginOption, ResolvedConfig } from 'vite';
import { getOutput, getPublic } from './utils';
import { writeConfig } from './config';
import { buildEndpoints } from './build';
import { buildPrerenderConfigs, execPrerender } from './prerender';
import path from 'path';
import type { ViteVercelPrerenderRoute } from './types';

export * from './types';

function vercelPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig;
  let vikeFound = false;

  return {
    apply: 'build',
    name: 'vite-plugin-vercel',
    enforce: 'post',

    configResolved(config) {
      resolvedConfig = config;
      vikeFound = resolvedConfig.plugins.some((p) =>
        p.name.match('^vite-plugin-ssr:|^vike:'),
      );
    },
    async writeBundle() {
      if (!resolvedConfig.build?.ssr) {
        // step 1:	Clean .vercel/ouput dir
        await cleanOutputDirectory(resolvedConfig);

        // special case: Vike triggers a second build with --ssr
        // TODO: find a way to fix that in a more generic way
        if (vikeFound) {
          return;
        }
      }

      // step 2:	Execute prerender
      const overrides = await execPrerender(resolvedConfig);

      // step 3:	Compute overrides for static HTML files
      const userOverrides = await computeStaticHtmlOverrides(resolvedConfig);

      // step 4:	Compile serverless functions to ".vercel/output/functions"
      const { rewrites, isr, headers } = await buildEndpoints(resolvedConfig);

      // step 5:	Generate prerender config files
      rewrites.push(...(await buildPrerenderConfigs(resolvedConfig, isr)));

      // step 6:	Generate config file
      await writeConfig(
        resolvedConfig,
        rewrites,
        {
          ...userOverrides,
          ...overrides,
        },
        headers,
      );
    },
  };
}

async function cleanOutputDirectory(resolvedConfig: ResolvedConfig) {
  await fs.rm(getOutput(resolvedConfig), {
    recursive: true,
    force: true,
  });

  await fs.mkdir(getOutput(resolvedConfig), { recursive: true });
}

async function computeStaticHtmlOverrides(
  resolvedConfig: ResolvedConfig,
): Promise<NonNullable<ViteVercelPrerenderRoute>> {
  const staticAbsolutePath = getOutput(resolvedConfig, 'static');
  const files = await getStaticHtmlFiles(staticAbsolutePath);

  // public files copied by vite by default https://vitejs.dev/guide/assets.html#the-public-directory
  const publicDir = getPublic(resolvedConfig);
  const publicFiles = await getStaticHtmlFiles(publicDir);
  files.push(
    ...publicFiles.map((f) => f.replace(publicDir, staticAbsolutePath)),
  );

  return files.reduce((acc, curr) => {
    const relPath = path.relative(staticAbsolutePath, curr);
    const parsed = path.parse(relPath);
    const pathJoined = path.join(parsed.dir, parsed.name);
    acc[relPath] = {
      path: pathJoined,
    };
    return acc;
  }, {} as NonNullable<ViteVercelPrerenderRoute>);
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
      : srcPath.endsWith('.html')
      ? htmlFiles.push(srcPath)
      : undefined;
  }

  return htmlFiles;
}

/**
 * Auto import `@vite-plugin-vercel/vike` if it is part of dependencies.
 * Ensures that `vike/plugin` is also present to ensure predictable behavior
 */
async function tryImportVpvv() {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await import('vike/plugin');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const vpvv = await import('@vite-plugin-vercel/vike');
    return vpvv.default();
  } catch (e) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await import('vite-plugin-ssr/plugin');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const vpvv = await import('@vite-plugin-vercel/vike');
      return vpvv.default();
    } catch (e) {
      return null;
    }
  }
}

// `smart` param only exist to circumvent a pnpm issue in dev
// See https://github.com/pnpm/pnpm/issues/3697#issuecomment-1708687974
// FIXME: Could be fixed by:
//  - shared-workspace-lockfile=false in .npmrc. See https://pnpm.io/npmrc#shared-workspace-lockfile
//  - Moving demo test in dedicated repo, with each a correct package.json
export default function allPlugins(
  options: { smart?: boolean } = {},
): PluginOption[] {
  return [vercelPlugin(), options.smart !== false ? tryImportVpvv() : null];
}
