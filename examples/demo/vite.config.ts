/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import vercelSsr from 'vite-plugin-vercel-ssr';

export default defineConfig(async () => {
  return {
    plugins: [react(), ssr(), vercel(), vercelSsr()],
    vercel: {
      expiration: 25,
    },
  };
});
