import { normalizePath, ResolvedConfig, UserConfig } from 'vite';
import path from 'path';
import { createRequire } from 'module';

export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
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

export function getPublic(config: ResolvedConfig): string {
  return path.join(getRoot(config), config.publicDir || 'public');
}

export function pathRelativeTo(
  filePath: string,
  config: UserConfig | ResolvedConfig,
  rel: string,
): string {
  const root = getRoot(config);
  return normalizePath(
    path.relative(normalizePath(path.join(root, rel)), filePath),
  );
}

function getOwnPackagePath() {
  const require_ = createRequire(import.meta.url);
  // vercel/dist/index.cjs
  const resolved = require_.resolve('vite-plugin-vercel');
  return path.resolve(
    resolved,
    // vercel/dist
    '..',
    // vercel
    '..',
  );
}

export const packagePath = getOwnPackagePath();
