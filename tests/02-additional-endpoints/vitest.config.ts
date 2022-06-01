import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: 'tests/02-additional-endpoints/globalSetup.ts',
    coverage: {
      enabled: false,
    },
  },
});
