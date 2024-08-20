import { normalizePath, type ResolvedConfig, type UserConfig } from "vite";
import path from "node:path";

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

export function pathRelativeTo(filePath: string, config: UserConfig | ResolvedConfig, rel: string): string {
  const root = getRoot(config);
  return normalizePath(path.relative(normalizePath(path.join(root, rel)), filePath));
}
