import react from "@vitejs/plugin-react";
import { build } from "esbuild";
import { defineConfig } from "vite";
import { getVercelEntries } from "vite-plugin-vercel";
import { vercel } from "vite-plugin-vercel/vite";

// Scan `src/routes` directory for entries
const routes = await getVercelEntries("src/routes", {
  destination: "",
});

export default defineConfig({
  plugins: [
    react(),
    vercel({
      entries: routes,
    }),
    // Minimal SSR plugin for React
    {
      name: "vite-plugin-demo:react-ssr",
      enforce: "pre",
      async load(id) {
        if (!id.endsWith("?client")) return;

        const [filePath] = id.split("?client");

        // Compile the client module with esbuild to ESM
        const result = await build({
          entryPoints: [filePath],
          bundle: true,
          format: "esm",
          write: false,
          sourcemap: false,
          jsx: "automatic",
          loader: {
            // Important for JSX/TSX
            ".ts": "ts",
            ".tsx": "tsx",
            ".js": "js",
            ".jsx": "jsx",
          },
        });

        // Get the code as string
        const code = result.outputFiles[0].text;

        // Return a JS module exporting that string
        return `export default ${JSON.stringify(code)}`;
      },
    },
  ],
});
