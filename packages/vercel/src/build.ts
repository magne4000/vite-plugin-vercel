import { ResolvedConfig } from 'vite';
import * as glob from 'fast-glob';
import path from 'path';
import { getOutput, getRoot, pathRelativeToApi } from './utils';
import { build, BuildOptions } from 'esbuild';
import { FunctionsManifest, ViteVercelApiEntry } from './types';
import { assert } from './assert';
import fs from 'fs/promises';

function getApiEndpoints(resolvedConfig: ResolvedConfig) {
  const apiEndpoints = (resolvedConfig.vercel?.apiEndpoints ?? []).map((p) =>
    path.isAbsolute(p) ? p : path.resolve(getRoot(resolvedConfig), p),
  );

  return new Set(apiEndpoints);
}

export function getApiEntries(
  resolvedConfig: ResolvedConfig,
): ViteVercelApiEntry[] {
  const apiEndpoints = getApiEndpoints(resolvedConfig);

  const apiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  return apiEntries.reduce((entryPoints, filePath) => {
    const outFilePath = pathRelativeToApi(filePath, resolvedConfig);
    const parsed = path.parse(outFilePath);

    const apiOnly = apiEndpoints.has(filePath);
    // `rewrites` in routes-manifest also rewrites the url for non `/api` pages.
    // So to ensure urls are kept for ssr pages, `/api` endpoint must be built
    const entry = {
      source: filePath,
      destination: [`api/${path.join(parsed.dir, parsed.name)}`],
    };

    if (!apiOnly) {
      entry.destination.push(`${path.join(parsed.dir, parsed.name)}`);
    }

    entryPoints.push(entry);

    return entryPoints;
  }, resolvedConfig.vercel?.additionalEndpoints ?? []);
}

const standardBuildOptions: BuildOptions = {
  bundle: true,
  target: 'es2020',
  format: 'cjs',
  platform: 'node',
  logLevel: 'info',
  minify: true,
};

// TODO build all targets at once, with shared code in [function].nft.json files
export async function buildFn(
  resolvedConfig: ResolvedConfig,
  entry: ViteVercelApiEntry,
  buildOptions?: BuildOptions,
): Promise<FunctionsManifest['pages']> {
  if (!Array.isArray(entry.destination)) {
    entry.destination = [entry.destination];
  }
  assert(
    entry.destination.length > 0,
    `Endpoint ${
      typeof entry.source === 'string' ? entry.source : '-'
    } does not have build destination`,
  );
  const [firstDestination, ...remainingDestinations] = entry.destination;
  const pages = resolvedConfig.vercel?.functionsManifest?.pages ?? {};
  const fnManifests: FunctionsManifest['pages'] = {};

  const outfile = path.join(
    getOutput(resolvedConfig, 'server/pages'),
    firstDestination + '.js',
  );

  const options = Object.assign(standardBuildOptions, { outfile });

  if (buildOptions) {
    Object.assign(options, buildOptions);
  }

  if (!options.stdin) {
    if (typeof entry.source === 'string') {
      options.entryPoints = [entry.source];
    } else {
      // TODO assert
      options.stdin = entry.source;
    }
  }

  await build(options);

  fnManifests[firstDestination + '.js'] = {
    maxDuration: 10,
    ...pages[firstDestination + '.js'],
  };

  for (const dest of remainingDestinations) {
    await fs.copyFile(
      outfile,
      path.join(getOutput(resolvedConfig, 'server/pages'), dest + '.js'),
    );

    fnManifests[dest + '.js'] = {
      maxDuration: 10,
      ...(pages[dest + '.js'] ?? pages[firstDestination + '.js']),
    };
  }

  return fnManifests;
}

export async function buildApiEndpoints(
  resolvedConfig: ResolvedConfig,
): Promise<FunctionsManifest['pages']> {
  const entries = getApiEntries(resolvedConfig);
  const fnManifests: FunctionsManifest['pages'] = {};

  for (const entry of entries) {
    Object.assign(fnManifests, await buildFn(resolvedConfig, entry));
  }

  return fnManifests;
}
