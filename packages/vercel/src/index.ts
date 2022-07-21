import fs from 'fs/promises';
import type { Plugin, ResolvedConfig } from 'vite';
import { copyDir, getOutDir, getOutput } from './utils';
import { writeConfig } from './config';
import { buildEndpoints } from './build';
import { buildPrerenderConfigs, execPrerender } from './prerender';
import path from 'path';
import type { ViteVercelPrerenderRoute } from './types';

export * from './types';

function vercelPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    apply: 'build',
    name: 'vite-plugin-vercel',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config;
    },
    async buildStart() {
      if (
        process.env.VERCEL_ENV === 'production' &&
        !process.env.ENABLE_VC_BUILD
      ) {
        throw new Error(
          'Missing ENABLE_VC_BUILD=1 to your environment variables in your project settings',
        );
      }
    },
    async writeBundle() {
      // wait for vite-plugin-ssr second build step with `ssr` flag
      if (!resolvedConfig.build?.ssr) return;

      // step 1:	Clean .vercel/ouput dir
      await cleanOutputDirectory(resolvedConfig);

      // step 2:		Client side built by vite-plugin-ssr
      // step 2.1:	Copy dist/client to .vercel/output/static
      // FIXME mode to packages/vite-plugin-ssr
      // await copyDistClientToOutputStatic(resolvedConfig);

      // if (!resolvedConfig.build?.ssr) return;

      // step 2.2:	Compute overrides for static HTML files
      const userOverrides = await computeStaticHtmlOverrides(resolvedConfig);

      // step 3:		Server side built by vite-plugin-ssr
      // step 3.1:	Execute vite-plugin-ssr prerender
      const overrides = await execPrerender(resolvedConfig);

      // step 3.2:	Compile serverless functions to ".vercel/output/functions"
      const rewrites = await buildEndpoints(resolvedConfig);

      // step 3.3:	Generate prerender config files
      rewrites.push(...(await buildPrerenderConfigs(resolvedConfig)));

      // step 3.4:	Generate config file
      await writeConfig(resolvedConfig, rewrites, {
        ...userOverrides,
        ...overrides,
      });
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function copyDistClientToOutputStatic(resolvedConfig: ResolvedConfig) {
  await copyDir(
    getOutDir(resolvedConfig, 'client'),
    getOutput(resolvedConfig, 'static'),
  );
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
  const files = await getStaticHtmlFiles(resolvedConfig, staticAbsolutePath);

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

async function getStaticHtmlFiles(resolvedConfig: ResolvedConfig, src: string) {
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
      ? htmlFiles.push(...(await getStaticHtmlFiles(resolvedConfig, srcPath)))
      : srcPath.endsWith('.html')
      ? htmlFiles.push(srcPath)
      : undefined;
  }

  return htmlFiles;
}

function allPlugins(): Plugin[] {
  return [vercelPlugin()];
}

export { allPlugins as default };
