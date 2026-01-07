import type { Plugin } from "vite";

export function reactEdgePlugin(): Plugin {
  return {
    name: "vite-plugin-vercel:react-edge",

    applyToEnvironment(env) {
      return env.name === "vercel_edge";
    },

    resolveId: {
      order: "pre",
      filter: {
        id: [/^react-dom\/server$/],
      },

      handler(_id, importer, opts) {
        return this.resolve("react-dom/server.edge", importer, opts);
      },
    },
  };
}
