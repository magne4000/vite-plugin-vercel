import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: 'tests/05-vite-plugin-ssr/globalSetup.ts',
    coverage: {
      enabled: false,
    },
  },
});
