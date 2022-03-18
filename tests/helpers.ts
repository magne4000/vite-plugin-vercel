import fs from 'fs/promises';
import myzod from 'myzod';
import { Type } from 'myzod/libs/types';
import { build, InlineConfig } from 'vite';
import glob from 'fast-glob';

export interface TestContext {
  file: unknown;
}

export function testFs(files: Iterable<string>) {
  it(`should generate the right files`, async function () {
    const entries = await glob('.output/**');

    expect(new Set(entries)).toStrictEqual(new Set(files));
  });
}

export function testSchema<T>(context: TestContext, schema: Type<T>) {
  it('should respect schema', function () {
    expect(schema.try(context.file)).not.toBeInstanceOf(myzod.ValidationError);
  });
}

export function prepareTestJsonFileContent<T extends TestContext>(
  file: string,
  callback: (context: T) => void,
) {
  const context = {
    file: undefined,
  } as T;

  beforeAll(async () => {
    context.file = JSON.parse(
      await fs.readFile(file, {
        encoding: 'utf-8',
      }),
    );
  });

  callback(context);
}

export async function callBuild(config: InlineConfig) {
  await build({
    ...config,
    build: {
      rollupOptions: {
        input: {
          'index.html': 'tests/common/index.html',
        },
      },
    },
  });
  await build({
    ...config,
    build: {
      rollupOptions: {
        input: 'tests/common/index.ts',
      },
      ssr: true,
    },
  });
}

export default {
  callBuild,
};
