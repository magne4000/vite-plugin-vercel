import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel/vite";

export default defineConfig({
  plugins: [vercel()],
});
