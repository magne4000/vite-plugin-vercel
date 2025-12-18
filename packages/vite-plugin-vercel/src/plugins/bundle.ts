import standaloner from "standaloner/vite";
import { edgeExternal } from "../utils/external.js";
import { wasmPlugin } from "./wasm.js";

export function bundlePlugin() {
  return standaloner({
    external: edgeExternal,
    bundle: {
      plugins: [wasmPlugin()],
    },
  });
}
