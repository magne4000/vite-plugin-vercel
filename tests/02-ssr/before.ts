import { build } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from 'vite-plugin-vercel';

await build({
  plugins: [react(), vercel()],
  vercel: {
    apiEndpoints: ['./api/post.ts'],
  },
});
