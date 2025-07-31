import type { Environment } from "vite";

export function isVercelLastBuildStep(env: string | Environment) {
  const name = typeof env !== "string" ? env.name : env;
  return name === "vercel_node";
}
