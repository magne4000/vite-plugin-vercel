import type { Plugin, ResolvedConfig } from "vite";

export function vercelPluginCleanup(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    apply: "build",
    name: "vite-plugin-vercel:cleanup",
    enforce: "pre",

    configResolved(config) {
      resolvedConfig = config;
    },
    buildStart: {
      order: "pre",
      sequential: true,
      async handler(options) {
        if (!resolvedConfig.build?.ssr) {
          // FIXME ensure unique execution, or check if we can leverage `emptyOutDir` option
          // await cleanOutputDirectory(resolvedConfig);
        }
      },
    },
  };
}
