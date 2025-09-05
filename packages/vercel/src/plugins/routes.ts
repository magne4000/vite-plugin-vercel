import type { Photon } from "@photonjs/core";
import type { Plugin } from "vite";

export function routesPlugins(): Plugin[] {
  return [
    {
      name: "vite-plugin-vercel:routes-dedupe",
      apply: "build",

      applyToEnvironment(env) {
        return env.name === "ssr";
      },

      buildStart: {
        // Ensure that this hook is executed close to last, ensuring that all plugins had time to inject their Photon entries
        order: "post",
        handler() {
          // By default, a unique Function is necessary per env (node, edge)
          // We only need to create a new function when either `isr` or `headers` is provided
          const entriesEdge = this.environment.config.photon.entries.filter((e) => e.vercel?.edge);
          const entriesNode = this.environment.config.photon.entries.filter((e) => !e.vercel?.edge);
          const entriesToKeep = new Set<Photon.Entry>();

          for (const envEntries of [entriesEdge, entriesNode]) {
            for (const page of envEntries.filter(
              (p) =>
                p.vercel?.isr || (p.vercel?.route && p.vercel?.headers !== null && p.vercel?.headers !== undefined),
            )) {
              entriesToKeep.add(page);
            }
          }

          this.environment.config.photon.entries = this.environment.config.photon.entries.filter(
            (e) => !e.vikeMeta || entriesToKeep.has(e),
          );
        },
      },

      sharedDuringBuild: true,
    },
  ];
}
