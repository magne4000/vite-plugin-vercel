import { ResolvedConfig } from 'vite';
import * as glob from 'glob';
import path from 'path';
import { getRoot, pathRelativeToApi } from './utils';
import { build, BuildOptions } from 'esbuild';
import { FunctionsManifest } from './types';
import fs from 'fs/promises';
import { Vercel } from "../vercel";

function getApiEndpoints(resolvedConfig: ResolvedConfig) {
  const apiEndpoints = (resolvedConfig.vercel?.apiEndpoints ?? []).map((p) =>
    path.isAbsolute(p) ? p : path.resolve(getRoot(resolvedConfig), p),
  );

  return new Set(apiEndpoints);
}

export function getApiEntries(resolvedConfig: ResolvedConfig) {
  const apiEndpoints = getApiEndpoints(resolvedConfig);

  const apiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/api/**/*.*`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  return apiEntries.reduce((entryPoints, filePath) => {
    const outFilePath = pathRelativeToApi(filePath, resolvedConfig);
    const parsed = path.parse(outFilePath);

    const apiOnly = apiEndpoints.has(filePath) ? 'api/' : '';
    // `rewrites` in routes-manifest also rewrites the url for non `/api` pages.
    // So to ensure urls are kept for ssr pages, `/api` endpoint must be built
    entryPoints[`api/${path.join(parsed.dir, parsed.name)}`] = filePath;
    if (!apiOnly) {
      entryPoints[`${path.join(parsed.dir, parsed.name)}`] = filePath;
    }

    return entryPoints;
  }, {} as Record<string, string>);
}

const commonBuildOptions: BuildOptions = {
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
  source: string,
  filepath: string,
) {
  await build({
    ...commonBuildOptions,
    outfile: path.join(
      getRoot(resolvedConfig),
      '.output/server/pages',
      source + '.js',
    ),
    entryPoints: [filepath],
  });
}

export async function buildFnStdin(resolvedConfig: ResolvedConfig) {
  const userEndpoint = resolvedConfig.vercel?.ssrEndpoint;

  if (!userEndpoint) return;

  const contents = await fs.readFile(userEndpoint, 'utf-8');
  const sourcefile = userEndpoint;

  const outfile = path.join(
    getRoot(resolvedConfig),
    '.output/server/pages',
    'api/ssr_.js',
  );

  const outfile2 = path.join(
    getRoot(resolvedConfig),
    '.output/server/pages',
    'ssr_.js',
  );

  const importBuildPath = path.join(
    getRoot(resolvedConfig),
    'dist/server/importBuild',
  );
  const resolveDir = path.dirname(userEndpoint);
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
}

export async function buildApiEndpoints(
  resolvedConfig: ResolvedConfig,
): Promise<FunctionsManifest['pages']> {
  const entries = getApiEntries(resolvedConfig);
  const pages = resolvedConfig.vercel?.functions ?? {};
  const fnManifests: FunctionsManifest['pages'] = {};
  const regions = resolvedConfig.vercel?.regions;

  for (const [key, val] of Object.entries(entries)) {
    await buildFn(resolvedConfig, key, val);
    const keyJs = key + '.js';

    fnManifests[keyJs] = {
      maxDuration: 10,
      ...transformPage(pages[keyJs]),
      regions,
    };
  }

  await buildFnStdin(resolvedConfig);

  fnManifests.ssr_ = {
    maxDuration: 10,
    ...transformPage(pages.ssr_ ?? pages['api/ssr_']),
    regions,
  };

  fnManifests['api/ssr_'] = {
    maxDuration: 10,
    ...transformPage(pages.ssr_ ?? pages['api/ssr_']),
    regions,
  };

  return fnManifests;
}

function transformPage(page?: NonNullable<Vercel['functions']>[string]): FunctionsManifest['pages'][string] | undefined {
  if (!page) return;
  // Should we use that?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { excludeFiles, includeFiles, ...rest } = page;
  return rest;
}
