import type { Config } from 'vite-plugin-ssr/types';

export default {
  meta: {
    isr: {
      env: 'server-only',
    },
  },
} satisfies Config;
