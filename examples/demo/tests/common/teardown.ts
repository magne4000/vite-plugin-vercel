import path from 'path';
import os from 'os';
import fs from 'fs/promises';

export function teardown(displayName: string) {
  return async () => {
    const tmpdir = path.join(os.tmpdir(), 'vpv-demo-' + displayName);

    await fs.rm(tmpdir, {
      recursive: true,
      force: true,
    });
  };
}
