import type { Plugin } from "vite";
import { buildAppPlugins } from "./build-app";
import { fixEnvsPlugins } from "./fix-envs";
import { routesPlugins } from "./routes";

export const plugins: Plugin[] = [fixEnvsPlugins(), ...routesPlugins(), buildAppPlugins()];
