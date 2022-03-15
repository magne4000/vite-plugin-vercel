import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [react(), ssr(), vercel()],
  vercel: {
    isr: {
      initialRevalidateSeconds: 25,
    },
    apiEndpoints: ['./api/post.ts'],
    prerenderManifest: {
      routes: {
        '/': {
          srcRoute: '/ssr',
        },
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
