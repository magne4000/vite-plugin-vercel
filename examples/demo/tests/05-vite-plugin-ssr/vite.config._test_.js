import react from '@vitejs/plugin-react';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import vercelSsr from '@magne4000/vite-plugin-vercel-ssr';
import { getTmpDir } from '../common/utils';

const tmpdir = getTmpDir('05-vite-plugin-ssr');

export default {
  mode: 'production',
  root: process.cwd(),
  plugins: [
    react(),
    ssr({
      prerender: {
        noExtraDir: true,
        disableAutoRun: true,
      },
    }),
    vercel(),
    vercelSsr(),
  ],
  vercel: {
    outDir: tmpdir,
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
