import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import vitePluginSsrVercelPlugin from './prerender/vite-plugin-ssr';

export default defineConfig({
  plugins: [react(), ssr(), vercel(), vitePluginSsrVercelPlugin()],
  vercel: {
    expiration: 25,
  },
});
