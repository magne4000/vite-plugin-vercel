import type { Plugin } from "vite";

const wasmHelper = async (url: string) => {
  if (url.startsWith("data:")) {
    const urlContent = url.replace(/^data:.*?base64,/, "");
    let bytes;
    if (typeof Buffer === "function" && typeof Buffer.from === "function") {
      bytes = Buffer.from(urlContent, "base64");
    } else if (typeof atob === "function") {
      const binaryString = atob(urlContent);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      throw new Error("Failed to decode base64-encoded data URL, Buffer and atob are not supported");
    }
    return bytes;
  } else {
    // https://github.com/mdn/webassembly-examples/issues/5
    // WebAssembly.instantiateStreaming requires the server to provide the
    // correct MIME type for .wasm files, which unfortunately doesn't work for
    // a lot of static file servers, so we just work around it by getting the
    // raw buffer.
    // eslint-disable-next-line n/no-unsupported-features/node-builtins -- this function runs in browsers
    const response = await fetch(url);
    return response;
  }
};

const wasmHelperCode = wasmHelper.toString();

const wasmHelperId = "\0vite-plugin-vercel/wasm-helper-module.js";

export function wasmPlugin(): Plugin {
  return {
    name: "vite-plugin-vercel:fix-wasm-module",
    enforce: "pre",

    resolveId: {
      order: "pre",
      async handler(id, importer, options) {
        if (id === wasmHelperId) {
          return id;
        }
        // if (id.endsWith(".wasm?module")) {
        //   return id;
        //   // FIXME, in edge runtime, the export must not be rewritten
        //   // From the documentation:
        //   // While WebAssembly.instantiate is supported in Edge Runtime,
        //   // it requires the Wasm source code to be provided using the import statement.
        //   // This means you cannot use a buffer or byte array to dynamically compile the module at runtime.
        //   const newId = id.replace(/\.wasm\?module$/i, ".wasm");
        //
        //   // FIXME
        //   // from the doc:
        //   // Pre-compiled WebAssembly can be imported with the ?module suffix.
        //   // This will provide an array of the Wasm data that can be instantiated using WebAssembly.instantiate().
        //   //
        //   // So somewhat like "?raw" but that returns a buffer?
        //
        //   return this.resolve(newId, importer, options);
        // }
      },
    },

    async load(id) {
      if (id === wasmHelperId) {
        return `export default ${wasmHelperCode}`;
      }

      if (id.endsWith(".wasm?module")) {
        return `
import { readFileSync } from "node:fs";
export default readFileSync(${JSON.stringify(id.replace(/\.wasm\?module$/i, ".wasm"))});
`;
        // const url = await fileToUrl(this, id);

        //         return `
        // import initWasm from "${wasmHelperId}";
        //
        // export default initWasm(${JSON.stringify(url)});
        // `;
      }
    },
  };
}
