import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./vite-plugin-ssr.ts'],
    external: ['esbuild', 'rollup', 'vite', 'vite-plugin-ssr'],
    format: ['esm', 'cjs'],
    platform: 'node',
    target: 'node16',
    dts: {
      entry: './vite-plugin-ssr.ts',
    },
  },
]);
