import assert from "node:assert";
import type { EnvironmentOptions, Plugin } from "vite";

function setTargetAndCssTarget(env: EnvironmentOptions) {
  env.build ??= {};
  env.build.target = "es2022";
  env.build.cssTarget = "es2022";
}

export function fixEnvsPlugins(): Plugin {
  return {
    name: "vike-vercel:fix-envs",
    apply: "build",

    // FIXME use configEnvironment https://vite.dev/guide/api-environment-plugins.html#configuring-environment-using-hooks
    config(previousConfig) {
      assert(previousConfig.builder);
      previousConfig.builder.buildApp = async (builder) => {
        console.log("BUILDAPP vike-vercel");
        // FIXME, can we provide something via the api?
        const priority: Record<string, number> = {
          client: 1,
          ssr: 2,
          vercel_edge: 3,
          vercel_node: 4,
          vercel_client: 5,
        }; // Higher priority values should be at the end

        const envs = Object.values(builder.environments);
        envs.sort((a, b) => {
          const aPriority = priority[a.name] ?? 0;
          const bPriority = priority[b.name] ?? 0;

          return aPriority - bPriority;
        });

        // console.log(
        //   "buildApp",
        //   envs.map((e) => e.name),
        // );

        for (const environment of envs) {
          console.log("BUILDAPP vike-vercel", environment.name);
          // console.log("buildApp", environment.name);
          await builder.build(environment);
          // console.log("buildApp", environment.name, "END");
        }
      };

      assert(previousConfig.environments);

      // Fixes CSS warning
      assert(previousConfig.environments.vercel_client);
      setTargetAndCssTarget(previousConfig.environments.vercel_client);
      assert(previousConfig.environments.client);
      setTargetAndCssTarget(previousConfig.environments.client);
    },
  };
}
