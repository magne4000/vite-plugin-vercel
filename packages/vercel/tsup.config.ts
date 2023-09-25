import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    external: ['esbuild', 'vike'],
    format: ['esm', 'cjs'],
    platform: 'node',
    target: 'node16',
    dts: {
      entry: './src/index.ts',
    },
  },
]);
