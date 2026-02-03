import type { Plugin } from "vite";
import type { ViteVercelConfig } from "../types";
import { getBuildEnvNames } from "../utils/buildEnvs";

export function reactEdgePlugin(pluginConfig: ViteVercelConfig): Plugin {
  const envNames = getBuildEnvNames(pluginConfig);
  return {
    name: "vite-plugin-vercel:react-edge",

    applyToEnvironment(env) {
      return env.name === envNames.edge;
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
