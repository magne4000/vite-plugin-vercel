import { resolve } from "node:path";
import type { Plugin } from "vite";

export function wasmPlugin(): Plugin {
  return {
    name: "vike-vercel:fix-wasm-module",
    enforce: "pre",

    resolveId: {
      order: "pre",
      // FIXME wasm files are not copied to outDir
      async handler(id, importer, options) {
        if (id.endsWith(".wasm?module")) {
          const newId = id.replace(/\.wasm\?module$/i, ".wasm?url");

          const resolved = await this.resolve(newId, importer, options);

          if (!resolved) return;

          // const newId = id.replace(/\.wasm\?module$/i, ".wasm");
          // const newIdAbsolute = importer ? resolve(importer, "..", newId) : newId;
          const newIdAbsolute = importer ? resolve(importer, "..", id) : id;

          // FIXME use @vercel/nft. Could I make a rollup-plugin-nft?
          // this.emitFile({
          //   type: "asset",
          //   fileName: newId.split("/").at(-1),
          //   source: readFileSync(newIdAbsolute),
          //   originalFileName: newIdAbsolute,
          // });

          // console.log("REF", ref);

          return resolved;
        }
      },
    },
  };
}
