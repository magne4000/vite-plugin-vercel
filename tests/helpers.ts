import fs from 'fs/promises';
import myzod from 'myzod';
import { Type } from 'myzod/libs/types';
import { build, InlineConfig } from 'vite';
import glob from 'fast-glob';
import os from 'os';
import path from 'path';

export interface TestContext {
  file: unknown;
}

function getTmpDir(displayName: string) {
  return path.join(os.tmpdir(), displayName);
}

export function testFs(dirname: string, files: Iterable<string>) {
  it(`should generate the right files`, async function () {
    const tmpdir = getTmpDir(dirname);
    const entries = await glob(tmpdir + '/**');

    expect(
      new Set(
        entries
          .map((e) => e.replace(tmpdir, ''))
          .filter((e) => !e.startsWith('/_ignore')),
      ),
    ).toStrictEqual(new Set(files));
  });
}

export function testSchema<T>(context: TestContext, schema: Type<T>) {
  it('should respect schema', function () {
    expect(schema.try(context.file)).not.toBeInstanceOf(myzod.ValidationError);
  });
}

export function prepareTestJsonFileContent<T extends TestContext>(
  dirname: string,
  file: string,
  callback: (context: T) => void,
) {
  const context = {
    file: undefined,
  } as T;

  beforeAll(async () => {
    context.file = JSON.parse(
      await fs.readFile(path.join(getTmpDir(dirname), file), {
        encoding: 'utf-8',
      }),
    );
  });

  callback(context);
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

  console.log('TMP', getTmpDir(dirname));
}
