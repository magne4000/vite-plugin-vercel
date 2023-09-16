import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { InlineConfig } from 'vite';
import { callBuild } from './utils';

export function setup(displayName: string, inlineConfig: InlineConfig) {
  return async () => {
    const tmpdir = path.join(os.tmpdir(), 'vpv-demo-' + displayName);

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
