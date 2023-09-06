import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';

export default {
  mode: 'production',
  root: process.cwd(),
  plugins: [
    react(),
    ssr({
      prerender: {
        disableAutoRun: true,
      },
    }),
    vercel(),
  ],
  vercel: {
    rewrites: [],
    additionalEndpoints: [
      {
        source: 'endpoints/edge.ts',
        destination: `edge`,
        edge: true,
        addRoute: true,
      },
    ],
    expiration: 25,
  },
};
