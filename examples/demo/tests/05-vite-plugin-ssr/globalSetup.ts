import path from 'path';
import ssr from 'vite-plugin-ssr/plugin';
import { setup as _setup } from '../common/setup';
import { teardown as _teardown } from '../common/teardown';
import react from '@vitejs/plugin-react';
import vercel from 'vite-plugin-vercel';
import vitePluginSsrVercelPlugin from 'vite-plugin-vercel-ssr';

export const setup = _setup(path.basename(__dirname), {
  configFile: false,
  mode: 'production',
  root: process.cwd(),
  plugins: [react(), ssr(), vercel(), vitePluginSsrVercelPlugin()],
  vercel: {
    expiration: 25,
  },
  build: {
    outDir: 'dist',
  },
});

export const teardown = _teardown(path.basename(__dirname));
