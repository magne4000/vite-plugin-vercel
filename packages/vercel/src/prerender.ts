import type { ResolvedConfig } from 'vite';

export function execPrerender(resolvedConfig: ResolvedConfig) {
  const prerender = resolvedConfig.vercel?.prerender;

  if (prerender === false) {
    return;
  }

  return prerender?.(resolvedConfig);
}
