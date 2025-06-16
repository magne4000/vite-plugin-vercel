import type { EnvironmentOptions, Plugin } from "vite";
import { getVercelAPI } from "vite-plugin-vercel/api";

/**
 * Ensure the same target between all builds
 */
function setTargetAndCssTarget(env: EnvironmentOptions) {
  env.build ??= {};
  env.build.target = "es2022";
  env.build.cssTarget = "es2022";
}

export function overrideConfPlugin(): Plugin {
  return {
    name: "vike-vercel:override-conf",
    apply: "build",

    config() {
      return {
        builder: {
          // Override Vike's buildApp, because it exit(0)
          async buildApp(builder) {
            await builder.build(builder.environments.client);
            await builder.build(builder.environments.ssr);
          },
        },
      };
    },

    configEnvironment(name, options) {
      if (name === "vercel_client" || name === "client" || name === "ssr") {
        setTargetAndCssTarget(options);
      }
    },
    buildStart() {
      const api = getVercelAPI(this);
      // Override `vite-plugin-vercel` config
      api.defaultSupportsResponseStreaming = true;
    },
  };
}
