import type { Config } from "vike/types";

export default {
  prerender: false,
  edge: true,
  headersResponse: {
    "X-VitePluginVercel-Test": "test",
  },
} satisfies Config;
