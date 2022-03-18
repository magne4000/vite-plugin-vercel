import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { Config } from '@jest/types';

export async function teardown(displayName: string) {
  return async (config: Config.GlobalConfig) => {
    if (
      config.testPathPattern.length > 0 &&
      !config.testPathPattern.includes(displayName)
    ) {
      return;
    }

    const tmpdir = path.join(os.tmpdir(), displayName);

    await fs.rm(tmpdir, {
      recursive: true,
      force: true,
    });
  };
}
