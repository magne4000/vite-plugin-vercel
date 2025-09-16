import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeReact from "vike-react/config";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";
import { Layout } from "../components/Layout";

export default {
  prerender: true,
  Layout,
  extends: [vikeReact, vikePhoton],
  photon: {
    expiration: 25,
    entries: {
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
