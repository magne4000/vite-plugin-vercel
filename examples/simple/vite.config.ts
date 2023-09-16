import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [
    vercel({
      // `smart` param only exist to circumvent a pnpm issue in this repo
      // You should not use this parameter outside this repository
      smart: false,
    }),
  ],
});
