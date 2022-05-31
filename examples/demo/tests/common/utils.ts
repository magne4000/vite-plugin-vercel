import os from 'os';
import path from 'path';
import { build, InlineConfig } from 'vite';

export function getTmpDir(displayName: string) {
  return path.join(os.tmpdir(), displayName);
}

export async function callBuild(dirname: string, config: InlineConfig) {
  const tmpdir = getTmpDir(dirname);

  await build({
    ...config,
    vercel: {
      ...config.vercel,
      outDir: tmpdir,
    },
    build: {
      outDir: tmpdir + '/_ignore/client',
      rollupOptions: {
        input: {
          'index.html': 'tests/common/index.html',
        },
      },
      ...config.build,
    },
    logLevel: 'info',
  });
  await build({
    ...config,
    vercel: {
      ...config.vercel,
      outDir: getTmpDir(dirname),
    },
    build: {
      outDir: tmpdir + '/_ignore/server',
      rollupOptions: {
        input: 'tests/common/index.ts',
      },
      ssr: true,
      ...config.build,
    },
    logLevel: 'info',
  });
}
