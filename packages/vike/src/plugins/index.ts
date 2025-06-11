import type { Plugin } from "vite";
// import { buildAppPlugins } from "./build-app";
import { overrideConfPlugin } from "./override-conf";
import { routesPlugins } from "./routes";
import { installPhoton } from "@photonjs/core/vite";

export const plugins: Plugin[] = [
  overrideConfPlugin(),
  ...routesPlugins(),
  // buildAppPlugins(),
  ...installPhoton("vike-vercel"),
];
