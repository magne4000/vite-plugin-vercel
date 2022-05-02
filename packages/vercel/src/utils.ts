import { normalizePath, ResolvedConfig, UserConfig } from 'vite';
import path from 'path';
import fs from 'fs/promises';

export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

export function getOutDir(
  config: ResolvedConfig,
  force?: 'client' | 'server',
): string {
  const p = normalizePath(config.build.outDir);
  if (!force) return p;
  return path.join(path.dirname(p), force);
}

export function getOutput(
  config: ResolvedConfig,
  suffix?: 'functions' | `functions/${string}.func` | 'static',
): string {
  return path.join(
    config.vercel?.outDir ? '' : getRoot(config),
    config.vercel?.outDir ?? '.vercel/output',
    suffix ?? '',
  );
}

export function pathRelativeToApi(
  filePath: string,
  config: UserConfig | ResolvedConfig,
): string {
  const root = getRoot(config);
  return normalizePath(path.relative(path.join(root, 'api'), filePath));
}

export async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? await copyDir(srcPath, destPath)
      : await fs.copyFile(srcPath, destPath);
  }
}
