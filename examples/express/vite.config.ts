import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

import vike from 'vike/plugin';
import vercel from 'vite-plugin-vercel';
import vercelVike from '@vite-plugin-vercel/vike';

export default defineConfig({
  plugins: [
    react(),
    vike(),
    vercel({
      // `smart` param only exist to circumvent a pnpm issue in this repo
      // You should not use this parameter outside this repository
      smart: false,
    }),
    vercelVike({ source: '/.*' }),
  ],
  vercel: {
    additionalEndpoints: [
      {
        source: 'express-entry.ts',
        destination: 'ssr_',
        addRoute: false,
      },
    ],
  },
});
