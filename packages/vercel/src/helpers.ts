import path from "node:path";
import type { Environment } from "vite";

export function joinAbsolute(env_or_p0: Environment | string, p1: string, ...p: string[]) {
  if (path.isAbsolute(p1)) {
    return path.join(p1, ...p);
  }
  return path.join(typeof env_or_p0 === "string" ? env_or_p0 : env_or_p0.config.root, p1, ...p);
}

export function joinAbsolutePosix(env_or_p0: Environment | string, p1: string, ...p: string[]) {
  if (path.isAbsolute(p1)) {
    return path.posix.join(p1, ...p);
  }
  return path.posix.join(typeof env_or_p0 === "string" ? env_or_p0 : env_or_p0.config.root, p1, ...p);
}
