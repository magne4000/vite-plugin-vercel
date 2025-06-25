import type { Plugin } from "vite";
import { overrideConfPlugin } from "./override-conf";
import { routesPlugins } from "./routes";
import { installPhoton } from "@photonjs/core/vite";

export const vikeVercel: Plugin[] = [
  ...installPhoton("vike-vercel", {
    fullInstall: true,
  }),
  overrideConfPlugin(),
  ...routesPlugins(),
];
