import vikeReact from "vike-react/config";
import vikeVercel from "vike-vercel/config";
import type { Config } from "vike/types";
import { Layout } from "../components/Layout";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

export default {
  prerender: true,
  Layout,
  vite6BuilderApp: true,
  extends: [vikeReact, vikeVercel],
  photon: {
    expiration: 25,
    handlers: {
      ...(await getEntriesFromFs("endpoints", {
        // Auto mapping:
        //   endpoints/edge.ts -> /edge
        //   endpoints/og-node.tsx -> /og-node
        //   endpoints/og-edge.tsx -> /og-edge
        //   endpoints/api/isr.ts -> /api/isr
        //   etc...
        destination: "",
      })),
    },
  },
} satisfies Config;
