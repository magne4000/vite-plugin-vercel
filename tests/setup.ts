import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { Config } from '@jest/types';
import { callBuild } from './helpers';
import { InlineConfig } from 'vite';

export async function setup(displayName: string, inlineConfig: InlineConfig) {
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
    await fs.mkdir(tmpdir, {
      recursive: true,
    });

    await callBuild(displayName, inlineConfig);
  };
}
