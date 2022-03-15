import { ResolvedConfig } from 'vite';
import * as glob from 'fast-glob';
import path from 'path';
import { getRoot, pathRelativeToApi } from './utils';
import { build, BuildOptions } from 'esbuild';
import { FunctionsManifest } from './types';
import { detectBuilders } from '@vercel/build-utils/dist';
import ssrTemplate from './templates/ssr_.template';
import fs from 'fs/promises';

// handled by tsup
const ssr_: string = ssrTemplate as unknown as string;

function getApiEndpoints(resolvedConfig: ResolvedConfig) {
  const apiEndpoints = (resolvedConfig.vercel?.apiEndpoints ?? []).map((p) =>
    path.isAbsolute(p) ? p : path.resolve(getRoot(resolvedConfig), p),
  );

  return new Set(apiEndpoints);
}

export function getApiEntries(resolvedConfig: ResolvedConfig) {
  const apiEndpoints = getApiEndpoints(resolvedConfig);

  const apiEntries = glob
    .sync(`${getRoot(resolvedConfig)}/api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  detectBuilders(
    apiEntries.map((p) => 'api/' + pathRelativeToApi(p, resolvedConfig)),
  ).then(console.log);

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
  const contents = userEndpoint
    ? await fs.readFile(userEndpoint, 'utf-8')
    : ssr_;
  const sourcefile = userEndpoint ?? 'ssr_.ts';

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

  await build({
    ...commonBuildOptions,
    outfile,
    stdin: {
      contents: "import '../dist/server/importBuild';\n" + contents,
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
      resolveDir: userEndpoint
        ? path.dirname(userEndpoint)
        : path.join(getRoot(resolvedConfig), 'api'),
    },
  });

  await fs.copyFile(outfile, outfile2);
}

export async function buildApiEndpoints(
  resolvedConfig: ResolvedConfig,
): Promise<FunctionsManifest['pages']> {
  const entries = getApiEntries(resolvedConfig);
  const pages = resolvedConfig.vercel?.functionsManifest?.pages ?? {};
  const fnManifests: FunctionsManifest['pages'] = {};

  for (const [key, val] of Object.entries(entries)) {
    await buildFn(resolvedConfig, key, val);
    const keyJs = key + '.js';

    fnManifests[keyJs] = {
      maxDuration: 10,
      ...pages[keyJs],
    };
  }

  await buildFnStdin(resolvedConfig);

  fnManifests.ssr_ = {
    maxDuration: 10,
    ...(pages.ssr_ ?? pages['api/ssr_']),
  };

  fnManifests['api/ssr_'] = {
    maxDuration: 10,
    ...(pages.ssr_ ?? pages['api/ssr_']),
  };

  return fnManifests;
}
