import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function teardown(displayName: string) {
  return async () => {
    const tmpdir = path.join(os.tmpdir(), `vpv-demo-${displayName}`);

    await fs.rm(tmpdir, {
      recursive: true,
      force: true,
    });
  };
}
