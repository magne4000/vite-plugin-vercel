import { ResolvedConfig, UserConfig } from 'vite';
import * as glob from 'fast-glob';
import path from 'path';
import { getRoot, pathRelativeToApi } from './utils';
import { build } from 'esbuild';
import { FunctionsManifest } from './types';

export function getApiEntries(config: UserConfig | ResolvedConfig) {
  const apiEntries = glob
    .sync(`${getRoot(config)}/api/**/*.*([a-zA-Z0-9])`)
    // from Vercel doc: Files with the underscore prefix are not turned into Serverless Functions.
    .filter((filepath) => !path.basename(filepath).startsWith('_'));

  const entryPoints: Record<string, string> = {};
  for (const filePath of apiEntries) {
    const outFilePath = pathRelativeToApi(filePath, config);
    const parsed = path.parse(outFilePath);
    entryPoints[`${path.join(parsed.dir, parsed.name)}`] = filePath;
  }
  return entryPoints;
}

export async function buildFn(
  resolvedConfig: ResolvedConfig,
  source: string,
  filepath: string,
) {
  await build({
    bundle: true,
    target: 'es2020',
    format: 'cjs',
    platform: 'node',
    outfile: path.join(
      getRoot(resolvedConfig),
      '.output/server/pages',
      source + '.js',
    ),
    entryPoints: [filepath],
    logLevel: 'info',
    minify: true,
  });
}

// TODO how to know if file should be generated to ".output/server/pages" or .output/server/pages/api"?
export async function buildApiEndpoints(
  resolvedConfig: ResolvedConfig,
): Promise<FunctionsManifest['pages']> {
  const entries = getApiEntries(resolvedConfig);
  const fnManifests: FunctionsManifest['pages'] = {};

  for (const [key, val] of Object.entries(entries)) {
    await buildFn(resolvedConfig, key, val);

    fnManifests[key + '.js'] = {
      maxDuration: 10,
    };
  }

  return fnManifests;
}
