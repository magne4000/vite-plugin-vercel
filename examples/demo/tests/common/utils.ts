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
      ...config.build,
      outDir: tmpdir + '/_ignore',
      rollupOptions: {
        input: {
          'index.html': 'tests/common/index.html',
        },
      },
    },
    logLevel: 'info',
  });
}
