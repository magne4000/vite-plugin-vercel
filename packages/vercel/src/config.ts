import { ResolvedConfig } from 'vite';
import path from 'path';
import { getOutput } from './utils';
import {
  VercelOutputConfig,
  vercelOutputConfigSchema,
} from './schemas/config/config';
import fs from 'fs/promises';
import { getTransformedRoutes, VercelConfig } from '@vercel/routing-utils';

export function getConfig(
  resolvedConfig: ResolvedConfig,
  rewrites?: VercelConfig['rewrites'],
  overrides?: VercelOutputConfig['overrides'],
): VercelOutputConfig {
  const { routes, error } = getTransformedRoutes({
    nowConfig: {
      cleanUrls: resolvedConfig.vercel?.cleanUrls ?? true,
      trailingSlash: resolvedConfig.vercel?.trailingSlash,
      rewrites: [
        // User provided config always comes first
        ...(resolvedConfig.vercel?.rewrites ?? []),
        ...(rewrites ?? []),
      ],
      redirects: resolvedConfig.vercel?.redirects,
    },
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
  rewrites?: VercelConfig['rewrites'],
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
