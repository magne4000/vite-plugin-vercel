import react from '@vitejs/plugin-react-swc';
import ssr from 'vike/plugin';
import vercel from 'vite-plugin-vercel';
import { UserConfig } from 'vite';

export default {
  plugins: [
    react(),
    ssr({
      prerender: true,
    }),
    vercel(),
  ],
  vercel: {
    expiration: 25,
    additionalEndpoints: [
      {
        source: 'endpoints/edge.ts',
        destination: `edge`,
        addRoute: true,
      },
      {
        source: 'endpoints/og-node.tsx',
        destination: `og-node`,
        addRoute: true,
      },
      {
        source: 'endpoints/og-edge.tsx',
        destination: `og-edge`,
        addRoute: true,
      },
    ],
  },
  // We manually add a list of dependencies to be pre-bundled, in order to avoid a page reload at dev start which breaks vike's CI
  // (The 'react/jsx-runtime' entry is not needed in Vite 3 anymore.)
  optimizeDeps: { include: ['cross-fetch', 'react/jsx-runtime'] },
} as UserConfig;
