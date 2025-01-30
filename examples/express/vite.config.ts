import react from "@vitejs/plugin-react-swc";
import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default {
  plugins: [
    react(),
    vercel({
      entries: [
        {
          input: "express-entry.ts",
          destination: "",
        },
      ],
    }),
  ],
} as UserConfig;
