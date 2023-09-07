import { defineConfig } from 'tsup';
import { rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export default defineConfig([
  {
    clean: true,
    entry: ['./vite-plugin-ssr.ts', './templates/helpers.ts', './+config.h.ts'],
    external: ['esbuild', 'rollup', 'vite', 'vite-plugin-ssr'],
    format: ['esm'],
    platform: 'node',
    target: 'node16',
    dts: {
      entry: [
        './vite-plugin-ssr.ts',
        './templates/helpers.ts',
        './+config.h.ts',
      ],
    },
    async onSuccess() {
      // rollup-plugin-dts chooses to rename things its way
      // and tsup doesn't wait for dts to be done to trigger this callback...
      // so https://github.com/egoist/tsup/issues/700#issuecomment-1499745933

      const start = Date.now();

      // timeout after 5 seconds
      while (start + 5000 > Date.now()) {
        if (existsSync('./dist/_config.h.d.ts')) {
          break;
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 250);
        });
      }

      await rename('./dist/_config.h.d.ts', './dist/+config.h.d.ts');
    },
  },
]);
