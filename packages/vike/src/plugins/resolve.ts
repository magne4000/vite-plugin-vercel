import type { Plugin } from "vite";
import { getAsset } from "../assets";

export const resolvedModuleId = "virtual:vike-universal-handler";
const resolvedVirtualModuleId = "\0virtual:vike-universal-handler";

export function resolvePlugin(): Plugin {
  return {
    name: "vike-vercel:resolve",

    applyToEnvironment(env) {
      return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
    },

    async resolveId(id, _importer, options) {
      if (id.startsWith(resolvedModuleId) || id === resolvedVirtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return getAsset("vike", this.environment.config.command === "build");
      }
    },
  };
}
