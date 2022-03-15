import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    external: ['esbuild', 'vite-plugin-ssr'],
    format: ['esm', 'cjs'],
    platform: 'node',
    target: 'node14',
    dts: {
      entry: './src/index.ts',
    },
    loader: {
      '.template.ts': 'text',
    },
  },
]);
