import type { Plugin } from "vite";
import { fixEnvsPlugins } from "./fix-envs";
import { wasmPlugin } from "./wasm";
import { prerenderPlugin } from "./prerender";

export const plugins: Plugin[] = [wasmPlugin(), fixEnvsPlugins(), prerenderPlugin()];
