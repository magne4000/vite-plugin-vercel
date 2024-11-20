import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default defineConfig({
  plugins: [
    vercel({
      entries: [
        {
          input: "_api/edge.ts",
          destination: "api/edge",
          edge: true,
        },
        {
          input: "_api/endpoint.ts",
          destination: "api/endpoint",
        },
      ],
    }),
  ],
});
