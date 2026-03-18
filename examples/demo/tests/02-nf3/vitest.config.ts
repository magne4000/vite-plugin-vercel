import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/common/vitest.setup.ts"],
    coverage: {
      enabled: false,
    },
  },
});
