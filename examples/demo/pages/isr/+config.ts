import type { Config } from "vike/types";

export default {
  // TODO should automatically be set by `vike-vercel`
  prerender: false,
  isr: { expiration: 5 },
} satisfies Config;
