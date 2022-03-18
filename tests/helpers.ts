import fs from 'fs/promises';
import myzod from 'myzod';
import { Type } from 'myzod/libs/types';

export interface TestContext {
  file: unknown;
}

export function testFileExists(file: string) {
  it(`${file} should exist`, async function () {
    const stats = await fs.stat(file);

    expect(stats.isFile()).toBe(true);
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
