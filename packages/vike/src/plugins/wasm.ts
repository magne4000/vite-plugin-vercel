import { resolve } from "node:path";
import type { Plugin } from "vite";

export function wasmPlugin(): Plugin {
  return {
    name: "vike-vercel:fix-wasm-module",
    enforce: "pre",

    resolveId: {
      order: "pre",
      // FIXME wasm files are not copied to outDir
      handler(id, importer) {
        if (id.endsWith(".wasm?module")) {
          const newId = id.replace(/\.wasm\?module$/i, ".wasm?url");
          const newIdAbsolute = importer ? resolve(importer, "..", newId) : newId;

          // const ref = this.emitFile({
          //   type: "asset",
          //   name: newId.split("/").at(-1),
          //   source: readFileSync(newIdAbsolute),
          //   originalFileName: newIdAbsolute,
          // });

          // console.log("REF", ref);

          return {
            id: newIdAbsolute,
          };
        }
      },
    },
  };
}
