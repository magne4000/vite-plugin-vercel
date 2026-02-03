import fs from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe } from "vitest";
import type { TestContext } from "../common/helpers";

export function prepareTestJsonFileContent<T extends TestContext>(file: string, callback: (context: T) => void) {
  const context = {
    file: undefined,
  } as T;

  beforeAll(async () => {
    const dest = path.join(__dirname, "../../.vercel/output", file);
    await fs.stat(dest);

    const fileContent = await fs.readFile(dest, {
      encoding: "utf-8",
    });

    context.file = JSON.parse(fileContent);
  });

  describe(file, () => {
    callback(context);
  });
}

export function prepareTestJsonFilesContent<T extends TestContext>(files: string[], callback: (context: T) => void) {
  for (const f of files) {
    prepareTestJsonFileContent(f, callback);
  }
}
