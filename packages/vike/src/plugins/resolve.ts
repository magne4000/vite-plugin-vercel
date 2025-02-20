import type { Plugin } from "vite";

const resolvedModuleId = "virtual:vike-universal-handler";
const resolvedVirtualModuleId = "\0virtual:vike-universal-handler";

export function resolvePlugin(): Plugin {
  return {
    name: "vike-vercel:resolve",

    applyToEnvironment(env) {
      return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
    },

    async resolveId(id, importer, options) {
      // ./dist/server/entry should already have been generated during "ssr" env build phase
      // So after that, we can directly import it when needed, for instance inside universal-handler
      if (id === "virtual:@brillout/vite-plugin-server-entry:serverEntry") {
        const resolved = await this.resolve("./dist/server/entry", undefined, options);
        return resolved?.id;
      }
      if (id.startsWith(resolvedModuleId)) {
        return resolvedVirtualModuleId;
      }
      if (id === resolvedVirtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        // Vike's Universal Handler wrapped to ensure that we also import ./dist/server/entry when bundling
        return `
import handler from "vike/universal-middleware";

export default async function vikeVercelHandler(...args) {
  await import("virtual:@brillout/vite-plugin-server-entry:serverEntry");
  return handler(...args);
}`;
      }
    },
  };
}
