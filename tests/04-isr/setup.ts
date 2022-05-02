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
        isr: {
          // TODO implement dynamicRoutes override
          routes: {
            '/isr': {
              expiration: 42,
              dataRoute: 'something',
              srcRoute: 'isr',
            },
          },
        },
      };
    },
  },
});
export default globalSetup;
