import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [
    react(),
    ssr(),
    vercel({
      dynamicRoutes: [
        {
          ssr: true,
          page: '/ssr',
          regex: '/((?!assets/)(?!api/).*)',
        },
      ],
    }),
  ],
});
