import { ResolvedConfig } from 'vite';
import glob from 'fast-glob';
import path from 'path';
import { getOutput, getRoot, pathRelativeTo } from './utils';
import { build, BuildOptions } from 'esbuild';
import { ViteVercelApiEntry } from './types';
import { assert } from './assert';
import { vercelOutputVcConfigSchema } from './schemas/config/vc-config';
import fs from 'fs/promises';
import { VercelConfig } from '@vercel/routing-utils';

export function getAdditionalEndpoints(resolvedConfig: ResolvedConfig) {
  return (resolvedConfig.vercel?.additionalEndpoints ?? []).map((e) => ({
    ...e,
    addRoute: e.addRoute ?? true,
    // path.resolve removes the trailing slash if any
    destination: path.resolve('/', e.destination) + '.func',
  }));
}

export function getEntries(
  resolvedConfig: ResolvedConfig,
): ViteVercelApiEntry[] {
  const apiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  if (apiEntries.length > 0) {
    console.warn(
      '@vercel/build is currently force building /api files itself, with no way to disable it. ' +
        'In order to avoid double compilation, you should temporarily rename /api to /_api while using this plugin. ' +
        '/_api functions are compiled under .vercel/output/functions/api/*.func as if they were in /api.',
    );
  }

  const otherApiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/_api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  return [...apiEntries, ...otherApiEntries].reduce((entryPoints, filePath) => {
    const outFilePath = pathRelativeTo(
      filePath,
      resolvedConfig,
      filePath.includes('/_api/') ? '_api' : 'api',
    );
    const parsed = path.parse(outFilePath);

    entryPoints.push({
      source: filePath,
      destination: `api/${path.posix.join(parsed.dir, parsed.name)}.func`,
      addRoute: true,
    });

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
  await writeVcConfig(resolvedConfig, entry.destination, Boolean(entry.edge));
}

export async function writeVcConfig(
  resolvedConfig: ResolvedConfig,
  destination: string,
  edge: boolean,
): Promise<void> {
  const vcConfig = path.join(
    getOutput(resolvedConfig, 'functions'),
    destination,
    '.vc-config.json',
  );

  await fs.writeFile(
    vcConfig,
    JSON.stringify(
      vercelOutputVcConfigSchema.parse(
        edge
          ? {
              runtime: 'edge',
              entrypoint: 'index.js',
            }
          : {
              runtime: 'nodejs16.x',
              handler: 'index.js',
              maxDuration: resolvedConfig.vercel?.defaultMaxDuration,
              launcherType: 'Nodejs',
              shouldAddHelpers: true,
            },
      ),
      undefined,
      2,
    ),
    'utf-8',
  );
}

function getSourceAndDestination(destination: string) {
  if (destination.startsWith('api/')) {
    return path.posix.resolve('/', destination);
  }
  return path.posix.resolve('/', destination, ':match*');
}

export async function buildEndpoints(
  resolvedConfig: ResolvedConfig,
): Promise<NonNullable<VercelConfig['rewrites']>> {
  const entries = getEntries(resolvedConfig);

  for (const entry of entries) {
    await buildFn(resolvedConfig, entry);
  }

  return entries
    .filter((e) => e.addRoute !== false)
    .map((e) => e.destination.replace(/\.func$/, ''))
    .map((destination) => ({
      source: getSourceAndDestination(destination),
      destination: getSourceAndDestination(destination),
    }));
}
