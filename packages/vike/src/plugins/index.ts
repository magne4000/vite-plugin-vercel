import type { Plugin } from "vite";
import { buildAppPlugins } from "./build-app";
import { overrideConfPlugin } from "./override-conf";
import { routesPlugins } from "./routes";
import { resolvePlugin } from "./resolve";

export const plugins: Plugin[] = [overrideConfPlugin(), resolvePlugin(), ...routesPlugins(), buildAppPlugins()];
