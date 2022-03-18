import path from 'path';
import { setup } from '../setup';
import react from '@vitejs/plugin-react';
import vercel from 'vite-plugin-vercel';

const globalSetup = setup(path.basename(__dirname), {
  configFile: false,
  mode: 'production',
  root: process.cwd(),
  plugins: [react(), vercel()],
  vercel: {
    additionalEndpoints: [
      {
        source: './tests/common/index2.ts',
        destination: 'index2',
      },
      {
        source: './tests/common/index2.ts',
        destination: ['index3', 'api/index3'],
      },
      {
        source: {
          contents: 'console.log("hi");',
          sourcefile: 'hi.ts',
          loader: 'ts',
        },
        destination: 'index4',
      },
    ],
  },
});
export default globalSetup;
