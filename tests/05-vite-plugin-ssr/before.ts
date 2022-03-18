import react from '@vitejs/plugin-react';
import vercel from 'vite-plugin-vercel';
import helpers from '../helpers.js';
import ssr from 'vite-plugin-ssr/plugin';
import vitePluginSsrVercelPlugin from '../../prerender/vite-plugin-ssr.js';

await helpers.callBuild({
  configFile: false,
  mode: 'production',
  root: process.cwd(),
  plugins: [
    react(),
    ssr(),
    vitePluginSsrVercelPlugin.vitePluginSsrVercelPlugin(),
    vercel(),
  ],
  vercel: {
    initialRevalidateSeconds: 25,
    apiEndpoints: ['./api/post.ts'],
  },
});
