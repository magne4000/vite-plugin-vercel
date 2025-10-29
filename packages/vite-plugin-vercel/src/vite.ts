import { installPhotonResolver } from "@photonjs/core/vite";
import plugin from "@photonjs/vercel/vite";

export const vercel: typeof plugin = (options) => {
  const plugins = plugin(options);
  return [...plugins, ...(installPhotonResolver("vite-plugin-vercel") as typeof plugins)];
};

export default vercel;
