import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import { vitePluginSsrVercelPlugin } from './prerender/vite-plugin-ssr';

export default defineConfig({
  plugins: [react(), ssr(), vercel(), vitePluginSsrVercelPlugin()],
  vercel: {
    isr: {
      initialRevalidateSeconds: 25,
      // prerender: populated by vitePluginSsrVercelPlugin
    },
    apiEndpoints: ['./api/post.ts'],
    /** override examples
    prerenderManifest: {
      routes: {
        '/about': {
          srcRoute: '/ssr',
          initialRevalidateSeconds: 20,
        },
      },
    },
    functionsManifest: {
      pages: {
        'ssr.js': {
          maxDuration: 9,
        },
      },
    },
   */
  },
});
