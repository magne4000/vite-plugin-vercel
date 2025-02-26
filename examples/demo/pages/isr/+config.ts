import type { Config } from "vike/types";

export default {
  // FIXME: Setting ISR should disable prerendering
  prerender: false,
  isr: { expiration: 5 },
} satisfies Config;
