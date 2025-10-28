import { installPhotonCore } from "@photonjs/core/vite";
import plugin from "@photonjs/vercel/vite";

export const vercel: typeof plugin = (options) => {
  const plugins = plugin(options);
  // TODO export new installPhoton util only for aliases
  return [...plugins, ...(installPhotonCore("vite-plugin-vercel") as typeof plugins)];
};

export default vercel;
