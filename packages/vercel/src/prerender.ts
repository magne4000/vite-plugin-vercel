import type { ResolvedConfig } from 'vite';

export async function execPrerender(resolvedConfig: ResolvedConfig) {
  const result = await resolvedConfig.vercel?.isr?.prerender?.(resolvedConfig);

  // TODO assert
  return result;
}
