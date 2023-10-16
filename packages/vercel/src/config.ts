import { ResolvedConfig } from 'vite';
import path from 'path';
import { getOutput } from './utils';
import {
  VercelOutputConfig,
  vercelOutputConfigSchema,
} from './schemas/config/config';
import fs from 'fs/promises';
import {
  getTransformedRoutes,
  Header,
  mergeRoutes,
  normalizeRoutes,
  Rewrite,
  Route,
} from '@vercel/routing-utils';
import { ViteVercelRewrite } from './types';

function reorderEnforce<T extends { enforce?: 'pre' | 'post' }>(arr: T[]) {
  return [
    ...arr.filter((r) => r.enforce === 'pre'),
    ...arr.filter((r) => !r.enforce),
    ...arr.filter((r) => r.enforce === 'post'),
  ];
}

export function getConfig(
  resolvedConfig: ResolvedConfig,
  rewrites?: ViteVercelRewrite[],
  overrides?: VercelOutputConfig['overrides'],
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
    redirects: resolvedConfig.vercel?.redirects
      ? reorderEnforce(resolvedConfig.vercel?.redirects)
      : undefined,
    headers,
  });

  if (error) {
    throw error;
  }

  if (
    resolvedConfig.vercel?.config?.routes &&
    resolvedConfig.vercel.config.routes.length > 0
  ) {
    console.warn(
      'It is discouraged to use `vercel.config.routes` to override routes. ' +
        'Prefer using `vercel.rewrites`, `vercel.redirects` and `vercel.appendRoutesToPhase`.',
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

  if (resolvedConfig.vercel?.config?.routes) {
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
        use: '@vercel/node',
        entrypoint: 'index.js',
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
  return path.join(getOutput(resolvedConfig), 'config.json');
}

export async function writeConfig(
  resolvedConfig: ResolvedConfig,
  rewrites?: Rewrite[],
  overrides?: VercelOutputConfig['overrides'],
  headers?: Header[],
): Promise<void> {
  await fs.writeFile(
    getConfigDestination(resolvedConfig),
    JSON.stringify(
      getConfig(resolvedConfig, rewrites, overrides, headers),
      undefined,
      2,
    ),
    'utf-8',
  );
}
