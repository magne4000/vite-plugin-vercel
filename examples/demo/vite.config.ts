/// <reference types="vitest" />
// FIXME esbuild bug https://github.com/evanw/esbuild/pull/2067
// probably not necessary when `./prerender/vite-plugin-ssr` will be included in `vite-plugin-ssr`
import module from 'module';
globalThis.require = module.createRequire(import.meta.url);

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';

export default defineConfig(async () => {
  const vitePluginSsrVercelPlugin = await import(
    '../../prerender/vite-plugin-ssr'
  );
  return {
    plugins: [react(), ssr(), vercel(), vitePluginSsrVercelPlugin.default()],
    vercel: {
      expiration: 25,
      outDir: '../../.vercel',
    },
  };
});
