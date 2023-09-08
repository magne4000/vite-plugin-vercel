import { Config } from 'vite-plugin-ssr/types';

export default {
  prerender: false,
  isr: { expiration: 15 },
} satisfies Config;
