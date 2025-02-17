import path from "node:path";
import { type Environment, normalizePath, type ResolvedConfig, type UserConfig } from "vite";

/**
 * TODO TO REMOVE
 * @deprecated
 */
export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

/**
 * TODO TO REMOVE
 * @deprecated
 */
export function getOutput(
  config: ResolvedConfig,
  suffix?: "functions" | `functions/${string}.func` | "static",
): string {
  return path.join(getRoot(config), config.build.outDir ?? ".vercel/output", suffix ?? "");
}

/**
 * TODO TO REMOVE
 * @deprecated
 */
export function getPublic(config: ResolvedConfig): string {
  return path.join(getRoot(config), config.publicDir || "public");
}

export function joinAbsolute(env: Environment, p1: string, ...p: string[]) {
  if (path.isAbsolute(p1)) {
    return path.join(p1, ...p);
  } else {
    return path.join(env.config.root, p1, ...p);
  }
}

export function joinAbsolutePosix(env: Environment, p1: string, ...p: string[]) {
  if (path.isAbsolute(p1)) {
    return path.posix.join(p1, ...p);
  } else {
    return path.posix.join(env.config.root, p1, ...p);
  }
}
