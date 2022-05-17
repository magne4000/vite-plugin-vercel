import { ResolvedConfig } from 'vite';
import path from 'path';
import { getOutput } from './utils';
import {
  VercelOutputConfig,
  vercelOutputConfigSchema,
} from './schemas/config/config';
import fs from 'fs/promises';
import { getTransformedRoutes } from '@vercel/routing-utils';

export function getConfig(
  resolvedConfig: ResolvedConfig,
  config?: Partial<VercelOutputConfig>,
): VercelOutputConfig {
  const { routes } = getTransformedRoutes({
    nowConfig: {
      cleanUrls: true,
    },
  });

  return vercelOutputConfigSchema.parse({
    version: 3,
    ...resolvedConfig.vercel?.config,
    routes: [
      ...(routes ?? []),
      ...(config?.routes ?? []).filter((r) => !r.src?.includes('named')),
      ...(resolvedConfig.vercel?.config?.routes ?? []),
    ],
    overrides: {
      ...resolvedConfig.vercel?.config?.overrides,
      ...config?.overrides,
    },
  });
}

export function getConfigDestination(resolvedConfig: ResolvedConfig) {
  return path.join(getOutput(resolvedConfig), 'config.json');
}

export async function writeConfig(
  resolvedConfig: ResolvedConfig,
  config?: Partial<VercelOutputConfig>,
): Promise<void> {
  await fs.writeFile(
    getConfigDestination(resolvedConfig),
    JSON.stringify(getConfig(resolvedConfig, config), undefined, 2),
    'utf-8',
  );

  await fs.writeFile(
    path.join(getOutput(resolvedConfig), 'static', 'config.json'),
    JSON.stringify(getConfig(resolvedConfig, config), undefined, 2),
    'utf-8',
  );
}
