import { build } from "esbuild";
import type { Plugin } from "vite";

export function minimalReactSsrPlugin(): Plugin {
  const re = /\?client$/;
  return {
    name: "vite-plugin-demo:react-ssr",
    enforce: "pre",

    config() {
      return {
        build: {
          rolldownOptions: {
            checks: {
              pluginTimings: false,
            },
          },
        },
      };
    },

    load: {
      filter: {
        id: [re],
      },
      async handler(id) {
        const filePath = id.replace(re, "");

        // Compile the client module with esbuild to ESM
        const result = await build({
          entryPoints: [filePath],
          bundle: true,
          format: "esm",
          write: false,
          sourcemap: false,
          jsx: "automatic",
          loader: {
            ".ts": "ts",
            ".tsx": "tsx",
            ".js": "js",
            ".jsx": "jsx",
          },
        });

        const code = result.outputFiles[0].text;
        return `export default ${JSON.stringify(code)}`;
      },
    },
  };
}
