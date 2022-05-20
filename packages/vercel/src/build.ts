import { ResolvedConfig } from 'vite';
import glob from 'fast-glob';
import path from 'path';
import { getOutput, getRoot, pathRelativeToApi } from './utils';
import { build, BuildOptions } from 'esbuild';
import { ViteVercelApiEntry } from './types';
import { assert } from './assert';
import { vercelOutputVcConfigSchema } from './schemas/config/vc-config';
import fs from 'fs/promises';

export function getAdditionalEndpoints(resolvedConfig: ResolvedConfig) {
  return (resolvedConfig.vercel?.additionalEndpoints ?? []).map((e) => ({
    ...e,
    destination: e.destination + '.func',
  }));
}

export function getEntries(
  resolvedConfig: ResolvedConfig,
): ViteVercelApiEntry[] {
  const apiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  return apiEntries.reduce((entryPoints, filePath) => {
    const outFilePath = pathRelativeToApi(filePath, resolvedConfig);
    const parsed = path.parse(outFilePath);

    // `rewrites` in routes-manifest also rewrites the url for non `/api` pages.
    // So to ensure urls are kept for ssr pages, `/api` endpoint must be built
    const entry = {
      source: filePath,
      destination: `api/${path.join(parsed.dir, parsed.name)}.func`,
    };

    entryPoints.push(entry);

    return entryPoints;
  }, getAdditionalEndpoints(resolvedConfig));
}

const standardBuildOptions: BuildOptions = {
  bundle: true,
  target: 'es2020',
  format: 'cjs',
  platform: 'node',
  logLevel: 'info',
  minify: true,
};

export async function buildFn(
  resolvedConfig: ResolvedConfig,
  entry: ViteVercelApiEntry,
  buildOptions?: BuildOptions,
): Promise<void> {
  assert(
    entry.destination.length > 0,
    `Endpoint ${
      typeof entry.source === 'string' ? entry.source : '-'
    } does not have build destination`,
  );

  const outfile = path.join(
    getOutput(resolvedConfig, 'functions'),
    entry.destination,
    'index.js',
  );

  const options = Object.assign({}, standardBuildOptions, { outfile });

  if (buildOptions) {
    Object.assign(options, buildOptions);
  }

  if (!options.stdin) {
    if (typeof entry.source === 'string') {
      options.entryPoints = [entry.source];
    } else {
      assert(
        typeof entry.source === 'object',
        `\`{ source }\` must be a string or an object`,
      );
      assert(
        typeof entry.source.contents === 'string',
        `\`{ contents }\` must be a string`,
      );
      options.stdin = entry.source;
    }
  }

  await build(options);
  await writeVcConfig(resolvedConfig, entry.destination);
}

export async function writeVcConfig(
  resolvedConfig: ResolvedConfig,
  destination: string,
): Promise<void> {
  const vcConfig = path.join(
    getOutput(resolvedConfig, 'functions'),
    destination,
    '.vc-config.json',
  );

  await fs.writeFile(
    vcConfig,
    JSON.stringify(
      vercelOutputVcConfigSchema.parse({
        runtime: 'nodejs16.x',
        handler: 'index.js',
        maxDuration: resolvedConfig.vercel?.defaultMaxDuration,
        launcherType: 'Nodejs',
        shouldAddHelpers: true,
      }),
      undefined,
      2,
    ),
    'utf-8',
  );
}

export async function buildEndpoints(
  resolvedConfig: ResolvedConfig,
): Promise<void> {
  const entries = getEntries(resolvedConfig);

  for (const entry of entries) {
    await buildFn(resolvedConfig, entry);
  }
}
