import type { Plugin } from "vite";
import { fixEnvsPlugins } from "./fix-envs";

export const plugins: Plugin[] = [fixEnvsPlugins()];
