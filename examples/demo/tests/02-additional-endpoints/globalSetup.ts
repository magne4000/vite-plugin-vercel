import path from 'path';
import { setup as _setup } from '../common/setup';
import { teardown as _teardown } from '../common/teardown';
import react from '@vitejs/plugin-react-swc';
import vercel from 'vite-plugin-vercel';

export const setup = _setup(path.basename(__dirname), {
  configFile: false,
  mode: 'production',
  root: process.cwd(),
  plugins: [
    react(),
    vercel({
      smart: false,
    }),
  ],
  vercel: {
    additionalEndpoints: [
      {
        source: './tests/common/index2.ts',
        destination: 'index2',
      },
      {
        source: {
          contents: 'console.log("hi");',
          sourcefile: 'hi.ts',
          loader: 'ts',
        },
        destination: 'index3',
      },
    ],
  },
});

export const teardown = _teardown(path.basename(__dirname));
