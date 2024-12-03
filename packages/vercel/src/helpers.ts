import fs from "node:fs/promises";
import path from "node:path";
import { type ResolvedConfig, type UserConfig, normalizePath } from "vite";

export async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    entry.isDirectory() ? await copyDir(srcPath, destPath) : await fs.copyFile(srcPath, destPath);
  }
}

export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

export function getOutput(
  config: ResolvedConfig,
  suffix?: "functions" | `functions/${string}.func` | "static",
): string {
  return path.join(
    config.vercel?.outDir ? "" : getRoot(config),
    config.vercel?.outDir ?? ".vercel/output",
    suffix ?? "",
  );
}

export function getPublic(config: ResolvedConfig): string {
  return path.join(getRoot(config), config.publicDir || "public");
}
