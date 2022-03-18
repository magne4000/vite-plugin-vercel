import { build, InlineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from 'vite-plugin-vercel';

const config: InlineConfig = {
  configFile: false,
  mode: 'production',
  root: process.cwd(),
  plugins: [react(), vercel()],
  vercel: {
    apiEndpoints: ['./api/post.ts'],
  },
};

await build({
  ...config,
  build: {
    rollupOptions: {
      input: './tests/common/index.html',
    },
  },
});
await build({
  ...config,
  build: {
    rollupOptions: {
      input: './tests/common/index.ts',
    },
    ssr: true,
  },
});
