// TODO move in vite-plugin-ssr?

import { prerender as prerenderCli } from 'vite-plugin-ssr/cli';
import path from 'path';
import fs from 'fs/promises';
import { normalizePath, ResolvedConfig, UserConfig } from 'vite';
import { PageContextBuiltIn } from 'vite-plugin-ssr';
import {
  ViteVercelPrerenderFn,
  ViteVercelPrerenderRoute,
} from 'vite-plugin-vercel';

interface PageContext extends PageContextBuiltIn {
  _prerenderResult: {
    filePath: string;
    fileContent: string;
  };
}

export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

export function getOutDir(
  config: ResolvedConfig,
  force?: 'client' | 'server',
): string {
  const p = normalizePath(config.build.outDir);
  if (!force) return p;
  return path.join(path.dirname(p), force);
}

export const prerender: ViteVercelPrerenderFn = async (
  resolvedConfig: ResolvedConfig,
) => {
  const isrPages: Exclude<ViteVercelPrerenderRoute, undefined> = {};
  const isrPagesWhitelist: string[] = Object.keys(
    resolvedConfig.vercel?.prerenderManifest?.routes ?? [],
  );

  await prerenderCli({
    root: getRoot(resolvedConfig),
    noExtraDir: true,
    async onPagePrerender(pageContext: PageContext) {
      const { filePath } = pageContext._prerenderResult;
      const newFilePath = path.join(
        getRoot(resolvedConfig),
        '.output/server/pages',
        path.relative(getOutDir(resolvedConfig, 'client'), filePath),
      );

      if (isrPagesWhitelist.includes(pageContext.url)) {
        isrPages[pageContext.url] = {
          // TODO
          // initialRevalidateSeconds
        };
      }

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.writeFile(newFilePath, pageContext._prerenderResult.fileContent);
    },
  });

  return isrPages;
};
