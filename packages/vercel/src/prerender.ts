import type { ResolvedConfig } from 'vite';
import path from 'path';
import { getOutput } from './utils';
import {
  VercelOutputPrerenderConfig,
  vercelOutputPrerenderConfigSchema,
} from './schemas/config/prerender-config';
import fs from 'fs/promises';

export function execPrerender(resolvedConfig: ResolvedConfig) {
  const prerender = resolvedConfig.vercel?.prerender;

  if (prerender === false) {
    return;
  }

  return prerender?.(resolvedConfig);
}

export async function writePrerenderConfig(
  resolvedConfig: ResolvedConfig,
  destination: string,
  isr: VercelOutputPrerenderConfig,
): Promise<void> {
  const parsed = path.parse(destination);

  const outfile = path.join(
    getOutput(resolvedConfig, 'functions'),
    parsed.dir,
    parsed.name + '.prerender-config.json',
  );

  await fs.mkdir(
    path.join(getOutput(resolvedConfig, 'functions'), parsed.dir),
    { recursive: true },
  );

  await fs.writeFile(
    outfile,
    JSON.stringify(vercelOutputPrerenderConfigSchema.parse(isr), undefined, 2),
    'utf-8',
  );
}

export function getPrerenderSymlinkInfo(
  resolvedConfig: ResolvedConfig,
  destination: string,
  target: string,
) {
  const parsed = path.parse(destination);
  const targetParsed = path.parse(target);

  return {
    target: path.join(
      getOutput(resolvedConfig, 'functions'),
      targetParsed.name + '.func',
    ),
    link: path.join(
      getOutput(resolvedConfig, 'functions'),
      parsed.dir,
      parsed.name + '.func',
    ),
  };
}

export async function buildPrerenderConfigs(
  resolvedConfig: ResolvedConfig,
): Promise<{ src: string; dest: string }[]> {
  const entries = Object.entries(resolvedConfig.vercel?.isr ?? {});
  const rewrites: { src: string; dest: string }[] = [];

  for (const [destination, { symlink, route, ...isr }] of entries) {
    await writePrerenderConfig(resolvedConfig, destination, isr);
    if (symlink) {
      const info = getPrerenderSymlinkInfo(
        resolvedConfig,
        destination,
        symlink,
      );
      await fs.symlink(
        path.relative(path.dirname(info.link), info.target),
        info.link,
      );
    }
    if (route) {
      rewrites.push({
        src: route,
        dest: destination,
      });
    }
  }

  return rewrites;
}
