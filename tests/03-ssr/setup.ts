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
    prerender() {
      return {
        ssr: {
          // TODO implement dynamicRoutes override
          rewrites: [
            {
              source: 'ssr',
              destination: 'ssr',
              regex: '^/ssr$',
            },
          ],
        },
      };
    },
  },
});
export default globalSetup;
