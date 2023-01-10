import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./vite-plugin-ssr.ts', './templates/helpers.ts'],
    external: ['esbuild', 'rollup', 'vite', 'vite-plugin-ssr'],
    format: ['esm', 'cjs'],
    platform: 'node',
    target: 'node16',
    shims: true,
    dts: {
      entry: ['./vite-plugin-ssr.ts', './templates/helpers.ts'],
    },
  },
]);
