import type { Plugin } from "vite";
import { fixEnvsPlugins } from "./fix-envs";
import { routesPlugin } from "./routes";

export const plugins: Plugin[] = [fixEnvsPlugins(), routesPlugin()];
