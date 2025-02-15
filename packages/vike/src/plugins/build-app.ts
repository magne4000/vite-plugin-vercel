import type { Plugin } from "vite";

export function buildAppPlugins(): Plugin {
  return {
    name: "vike-vercel:build-app",
    apply: "build",

    enforce: "post",

    config: {
      order: "post",
      handler() {
        return {
          builder: {
            async buildApp(builder) {
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
            },
          },
        };
      },
    },
  };
}
