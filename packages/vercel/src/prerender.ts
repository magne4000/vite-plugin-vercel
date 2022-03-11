import { prerender } from 'vite-plugin-ssr/cli';
import { getOutDir, getRoot } from './utils';
import path from 'path';
import fs from 'fs/promises';
import PageContext from './index';
import { ResolvedConfig } from 'vite';
import { PageContextBuiltIn } from 'vite-plugin-ssr';

interface PageContext extends PageContextBuiltIn {
  _prerenderResult: {
    filePath: string;
    fileContent: string;
  };
}

export async function execPrerender(resolvedConfig: ResolvedConfig) {
  const isrPages: string[] = [];

  await prerender({
    root: getRoot(resolvedConfig),
    noExtraDir: true,
    async onPagePrerender(pageContext: PageContext) {
      const { filePath } = pageContext._prerenderResult;
      const newFilePath = path.join(
        getRoot(resolvedConfig),
        '.output/server/pages',
        path.relative(getOutDir(resolvedConfig, 'client'), filePath),
      );

      if (pageContext.url !== '/fake-404-url') {
        isrPages.push(pageContext.url);
      }

      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      await fs.writeFile(newFilePath, pageContext._prerenderResult.fileContent);
    },
  });

  return isrPages;
}
