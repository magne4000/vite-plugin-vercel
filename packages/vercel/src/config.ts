import { ResolvedConfig } from 'vite';
import path from 'path';
import { getOutput } from './utils';
import {
  VercelOutputConfig,
  vercelOutputConfigSchema,
} from './schemas/config/config';
import fs from 'fs/promises';
import { getTransformedRoutes, Rewrite } from '@vercel/routing-utils';
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
        'Prefer using `vercel.rewrites` and `vercel.redirects`.',
    );
  }

  return vercelOutputConfigSchema.parse({
    version: 3,
    ...resolvedConfig.vercel?.config,
    routes: [
      ...(routes ?? []),
      ...(resolvedConfig.vercel?.config?.routes ?? []),
    ],
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
): Promise<void> {
  await fs.writeFile(
    getConfigDestination(resolvedConfig),
    JSON.stringify(
      getConfig(resolvedConfig, rewrites, overrides),
      undefined,
      2,
    ),
    'utf-8',
  );
}
