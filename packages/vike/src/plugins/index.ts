import type { Plugin } from "vite";
import { buildAppPlugins } from "./build-app";
import { overrideConfPlugin } from "./override-conf";
import { routesPlugins } from "./routes";
import { definePhotonLib } from "@photonjs/core/api";

export const plugins: Plugin[] = [
  overrideConfPlugin(),
  ...routesPlugins(),
  buildAppPlugins(),
  ...definePhotonLib("vike-vercel"),
];
