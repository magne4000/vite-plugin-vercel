/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import vercelSsr from '@magne4000/vite-plugin-vercel-ssr';

export default defineConfig(async () => {
  return {
    plugins: [
      react(),
      ssr({
        prerender: true,
      }),
      vercel(),
      vercelSsr(),
    ],
    vercel: {
      expiration: 25,
      additionalEndpoints: [
        {
          source: 'endpoints/edge.ts',
          destination: `edge`,
          edge: true,
          addRoute: true,
        },
      ],
    },
    server: {
      port: 3000,
    },
  };
});
