import glob from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { ZodSchema } from 'zod';
import { getTmpDir } from './utils';

export interface TestContext {
  file: unknown;
}

export function testFs(
  dirname: string,
  filesOrCallback: Iterable<string> | ((entries: string[]) => void),
) {
  it(`should generate the right files`, async function () {
    const tmpdir = getTmpDir(dirname);
    const entries = await glob(tmpdir + '/**', { dot: true });
    const mappedEntries = entries
      .map((e) => e.replace(tmpdir, ''))
      .filter((e) => !e.startsWith('/_ignore'));

    if (typeof filesOrCallback === 'function') {
      filesOrCallback(mappedEntries);
    } else {
      expect(mappedEntries.sort()).toMatchObject(
        Array.from(filesOrCallback).sort(),
      );
    }
  });
}

export function testSchema<T>(context: TestContext, schema: ZodSchema<T>) {
  it('should respect schema', function () {
    expect(schema.safeParse(context.file)).not.toHaveProperty('error');
  });
}

export function prepareTestJsonFilesContent<T extends TestContext>(
  dirname: string,
  files: string[],
  callback: (context: T) => void,
) {
  files.forEach((f) => prepareTestJsonFileContent(dirname, f, callback));
}

export function prepareTestJsonFileContent<T extends TestContext>(
  dirname: string,
  file: string,
  callback: (context: T) => void,
) {
  const filesContent: Record<string, string> = {};
  const context = {
    file: undefined,
  } as T;

  beforeAll(async () => {
    const dest = path.join(getTmpDir(dirname), file);
    const entries = await glob(dest);

    if (entries.length !== 1) {
      throw new Error(`Multiple or no file matches ${dest}`);
    }

    context.file = JSON.parse(
      await fs.readFile(entries[0], {
        encoding: 'utf-8',
      }),
    );
  });

  describe(file, function () {
    callback(context);
  });
}
