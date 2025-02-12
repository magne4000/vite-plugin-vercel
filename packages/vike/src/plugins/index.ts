import type { Plugin } from "vite";
import { fixEnvsPlugins } from "./fix-envs";
import { routesPlugin } from "./routes";
import { wasmPlugin } from "./wasm";

export const plugins: Plugin[] = [wasmPlugin(), fixEnvsPlugins(), routesPlugin()];
