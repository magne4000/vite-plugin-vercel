import type { ResolvedConfig } from 'vite';

export async function execPrerender(resolvedConfig: ResolvedConfig) {
  const prerender = resolvedConfig.vercel?.ssr?.prerender;

  if (prerender === false) {
    return;
  }

  const result = await prerender?.(resolvedConfig);

  // TODO assert
  return result;
}
