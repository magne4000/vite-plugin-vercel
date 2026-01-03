import standaloner from "standaloner/vite";
import { edgeExternal } from "../utils/external.js";
import { wasmPlugin } from "./wasm.js";

export function bundlePlugin() {
  return standaloner({
    external: edgeExternal,
    isolated: true,
    bundle: {
      output: {
        // disable CJS banner
        banner: "",
      },
      plugins: [wasmPlugin()],
      // FIXME this one is not used, but it should be the only one
      isolated: true,
    },
  });
}
