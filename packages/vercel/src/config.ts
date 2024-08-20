import type { ResolvedConfig } from "vite";
import path from "node:path";
import { getOutput } from "./utils";
import { type VercelOutputConfig, vercelOutputConfigSchema } from "./schemas/config/config";
import fs from "node:fs/promises";
import {
  getTransformedRoutes,
  type Header,
  mergeRoutes,
  normalizeRoutes,
  type Rewrite,
  type Route,
} from "@vercel/routing-utils";
import type { ViteVercelRewrite } from "./types";

function reorderEnforce<T extends { enforce?: "pre" | "post" }>(arr: T[]) {
  return [
    ...arr.filter((r) => r.enforce === "pre"),
    ...arr.filter((r) => !r.enforce),
    ...arr.filter((r) => r.enforce === "post"),
  ];
}

export function getConfig(
  resolvedConfig: ResolvedConfig,
  rewrites?: ViteVercelRewrite[],
  overrides?: VercelOutputConfig["overrides"],
  headers?: Header[],
): VercelOutputConfig {
  const _rewrites: ViteVercelRewrite[] = [
    // User provided config always comes first
    ...(resolvedConfig.vercel?.rewrites ?? []),
    ...(rewrites ?? []),
  ];

  const { routes, error } = getTransformedRoutes({
    cleanUrls: resolvedConfig.vercel?.cleanUrls ?? true,
    trailingSlash: resolvedConfig.vercel?.trailingSlash,
    rewrites: reorderEnforce(_rewrites),
    redirects: resolvedConfig.vercel?.redirects ? reorderEnforce(resolvedConfig.vercel?.redirects) : undefined,
    headers,
  });

  if (error) {
    throw error;
  }

  if (
    resolvedConfig.vercel?.config?.routes &&
    resolvedConfig.vercel.config.routes.length > 0 &&
    !resolvedConfig.vercel.config.routes.every((r) => "continue" in r && r.continue)
  ) {
    console.warn(
      'Did you forget to add `"continue": true` to your routes? See https://vercel.com/docs/build-output-api/v3/configuration#source-route\n' +
        "If not, it is discouraged to use `vercel.config.routes` to override routes. " +
        "Prefer using `vercel.rewrites` and `vercel.redirects`.",
    );
  }

  let userRoutes: Route[] = [];
  let buildRoutes: Route[] = [];

  if (resolvedConfig.vercel?.config?.routes) {
    const norm = normalizeRoutes(resolvedConfig.vercel.config.routes);

    if (norm.error) {
      throw norm.error;
    }

    userRoutes = norm.routes ?? [];
  }

  if (routes) {
    const norm = normalizeRoutes(routes);

    if (norm.error) {
      throw norm.error;
    }

    buildRoutes = norm.routes ?? [];
  }

  const cleanRoutes = mergeRoutes({
    userRoutes,
    builds: [
      {
        use: "@vercel/node",
        entrypoint: "index.js",
        routes: buildRoutes,
      },
    ],
  });

  return vercelOutputConfigSchema.parse({
    version: 3,
    ...resolvedConfig.vercel?.config,
    routes: cleanRoutes,
    overrides: {
      ...resolvedConfig.vercel?.config?.overrides,
      ...overrides,
    },
  });
}

export function getConfigDestination(resolvedConfig: ResolvedConfig) {
  return path.join(getOutput(resolvedConfig), "config.json");
}

export async function writeConfig(
  resolvedConfig: ResolvedConfig,
  rewrites?: Rewrite[],
  overrides?: VercelOutputConfig["overrides"],
  headers?: Header[],
): Promise<void> {
  await fs.writeFile(
    getConfigDestination(resolvedConfig),
    JSON.stringify(getConfig(resolvedConfig, rewrites, overrides, headers), undefined, 2),
    "utf-8",
  );
}
