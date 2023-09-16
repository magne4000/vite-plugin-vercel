import { Config } from 'vite-plugin-ssr/types';

export default {
  // Should warn when building because it's incompatible with route function
  isr: { expiration: 15 },
} satisfies Config;
