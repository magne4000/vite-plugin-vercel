import standaloner from "standaloner/vite";
import { edgeExternal } from "../utils/external.js";
import { wasmPlugin } from "./wasm.js";

export function bundlePlugin() {
  return standaloner({
    external: edgeExternal,
    bundle: {
      output: {
        // disable CJS banner
        banner: "",
        // already sanitized
        sanitizeFileName: false,
        // avoids empty imports at the top of entry chunks
        hoistTransitiveImports: false,
      },
      experimental: {
        // avoids empty imports at the top of entry chunks
        strictExecutionOrder: false,
      },
      plugins: [wasmPlugin()],
      // one isolated file per function
      isolated: true,
    },
  });
}
