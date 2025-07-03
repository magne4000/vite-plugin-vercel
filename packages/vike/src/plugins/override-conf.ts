import { resolvePhotonConfig } from "@photonjs/core/api";
import { getVikeConfig } from "vike/plugin";
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

export function overrideConfPlugin(): Plugin[] {
  return [
    {
      name: "vike-vercel:photon-config",

      config(userConfig) {
        const vikeConfig = getVikeConfig(userConfig);
        if (vikeConfig.config.photon) {
          return {
            photon: resolvePhotonConfig(vikeConfig.config.photon),
            resolve: {
              // TODO should be set by vike-server itself
              noExternal: ["vike-server"],
            },
          };
        }
      },
    },
    {
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
      buildStart: {
        order: "pre",
        handler() {
          this.environment.config.photon.server.vercel ??= {};
          // We will only rely on `additionalServerConfigs` to generate all functions
          this.environment.config.photon.server.vercel.disabled = true;
          const api = getVercelAPI(this);
          // Override `vite-plugin-vercel` config
          api.defaultSupportsResponseStreaming = true;
        },
      },
    },
  ];
}
