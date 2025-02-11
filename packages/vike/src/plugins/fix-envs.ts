import type { EnvironmentOptions, Plugin } from "vite";
import assert from "node:assert";

function setTargetAndCssTarget(env: EnvironmentOptions) {
  env.build ??= {};
  env.build.target = "es2022";
  env.build.cssTarget = "es2022";
}

export function fixEnvsPlugins(): Plugin {
  return {
    name: "vike-vercel:fix-envs",

    config(previousConfig) {
      assert(previousConfig.builder);
      previousConfig.builder.buildApp = async (builder) => {
        console.log("BUILDADD vike-vercel");
        const priority: Record<string, number> = {
          client: 1,
          vercel_edge: 2,
          vercel_node: 3,
          vercel_client: 4,
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
          if (environment.name === "ssr") {
            continue;
          }
          console.log("BUILDADD vike-vercel", environment.name);
          // console.log("buildApp", environment.name);
          await builder.build(environment);
          // console.log("buildApp", environment.name, "END");
        }
      };

      assert(previousConfig.environments);
      assert(previousConfig.environments.vercel_client);
      setTargetAndCssTarget(previousConfig.environments.vercel_client);
      assert(previousConfig.environments.client);
      setTargetAndCssTarget(previousConfig.environments.client);
    },
  };
}
