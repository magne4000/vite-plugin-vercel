import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import { prerender } from './prerender/vite-plugin-ssr';

export default defineConfig({
  plugins: [react(), ssr(), vercel()],
  vercel: {
    isr: {
      initialRevalidateSeconds: 25,
      prerender,
    },
    apiEndpoints: ['./api/post.ts'],
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
  },
});
