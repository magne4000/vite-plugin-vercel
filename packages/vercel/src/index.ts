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
  let vpsFound = false;

  return {
    apply: 'build',
    name: 'vite-plugin-vercel',
    enforce: 'post',

    configResolved(config) {
      resolvedConfig = config;
      vpsFound = resolvedConfig.plugins.some((p) =>
        p.name.startsWith('vite-plugin-ssr:'),
      );
    },
    async writeBundle() {
      if (!resolvedConfig.build?.ssr) {
        // step 1:	Clean .vercel/ouput dir
        await cleanOutputDirectory(resolvedConfig);

        // vite-plugin-ssr triggers a second build with --ssr
        if (vpsFound) {
          return;
        }
      }

      // step 2:		Server side built by vite-plugin-ssr
      // step 2.1:	Execute vite-plugin-ssr prerender
      const overrides = await execPrerender(resolvedConfig);

      // step 3:    Wait for vite-plugin-ssr second build step with `ssr` flag
      // step 3.1:	Compute overrides for static HTML files
      const userOverrides = await computeStaticHtmlOverrides(resolvedConfig);

      // step 4:	Compile serverless functions to ".vercel/output/functions"
      const rewrites = await buildEndpoints(resolvedConfig);

      // step 5:	Generate prerender config files
      rewrites.push(...(await buildPrerenderConfigs(resolvedConfig)));

      // step 6:	Generate config file
      await writeConfig(resolvedConfig, rewrites, {
        ...userOverrides,
        ...overrides,
      });
    },
  };
}

async function cleanOutputDirectory(resolvedConfig: ResolvedConfig) {
  await fs.rm(getOutput(resolvedConfig), {
    recursive: true,
    force: true,
  });
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
 * Auto import @vite-plugin-vercel/vike if it is part of dependencies
 */
async function tryImportVpvv() {
  try {
    const vpvv = await import('@vite-plugin-vercel/vike');
    return vpvv.default();
  } catch (e) {
    return null;
  }
}

export default function allPlugins(): PluginOption[] {
  return [vercelPlugin(), tryImportVpvv()];
}
