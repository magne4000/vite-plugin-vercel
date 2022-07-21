import { normalizePath, ResolvedConfig, UserConfig } from 'vite';
import path from 'path';

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

export function pathRelativeTo(
  filePath: string,
  config: UserConfig | ResolvedConfig,
  rel: string,
): string {
  const root = getRoot(config);
  return normalizePath(path.relative(path.join(root, rel), filePath));
}
