import { installPhoton } from "@photonjs/runtime/vite";
import type { Plugin } from "vite";
import { overrideConfPlugin } from "./override-conf";
import { prerenderPlugin } from "./prerender";
import { routesPlugins } from "./routes";

export const vikeVercel: Plugin[] = [
  ...installPhoton("vike-vercel"),
  ...overrideConfPlugin(),
  ...routesPlugins(),
  ...prerenderPlugin(),
];
