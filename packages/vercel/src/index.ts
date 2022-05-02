import fs from 'fs/promises';
import type { Plugin, ResolvedConfig } from 'vite';
import { copyDir, getOutDir, getOutput } from './utils';
import { writeConfig } from './config';
import { buildEndpoints } from './build';
import { buildPrerenderConfigs, execPrerender } from './prerender';

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
        !process.env.ENABLE_FILE_SYSTEM_API
      ) {
        throw new Error(
          'Missing ENABLE_FILE_SYSTEM_API=1 to your environment variables in your project settings',
        );
      }

      if (!resolvedConfig.build.ssr) {
        // step 1:	Clean .vercel/ouput dir
        await cleanOutputDirectory(resolvedConfig);
      } else {
        // step 2:		Client side built by vite-plugin-ssr
        // step 2.1:	Copy dist/client to .vercel/output/static
        await copyDistClientToOutputStatic(resolvedConfig);
      }
    },
    async writeBundle() {
      if (!resolvedConfig.build?.ssr) return;

      // step 3:		Server side built by vite-plugin-ssr
      // step 3.1:	Execute vite-plugin-ssr prerender
      const overrides = await execPrerender(resolvedConfig);

      // step 3.2:	Compile serverless functions to ".vercel/output/functions"
      await buildEndpoints(resolvedConfig);

      // step 3.3:	Generate prerender config files
      const rewrites = await buildPrerenderConfigs(resolvedConfig);

      // step 3.4:	Generate config file
      await writeConfig(resolvedConfig, {
        routes: [{ handle: 'filesystem' }, ...rewrites],
        overrides,
      });
    },
  };
}

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

function allPlugins(): Plugin[] {
  return [vercelPlugin()];
}

export { allPlugins as default };
