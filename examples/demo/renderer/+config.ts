import type { Config } from "vike/types";
import config from "@vite-plugin-vercel/vike/config";

// https://vike.dev/config
export default {
  passToClient: ["pageProps", "title", "someAsyncProps"],
  clientRouting: true,
  hydrationCanBeAborted: true,
  // https://vike.dev/meta
  meta: {
    // Create new config 'title'
    title: {
      env: { server: true, client: true },
    },
    // Create new config 'onBeforeRenderIsomorph'
    onBeforeRenderIsomorph: {
      env: { config: true },
      effect({ configDefinedAt, configValue }) {
        if (typeof configValue !== "boolean") {
          throw new Error(`${configDefinedAt} should be a boolean`);
        }
        if (configValue) {
          return {
            meta: {
              onBeforeRender: {
                // We override VPS's default behavior of always loading/executing onBeforeRender() on the server-side.
                // If we set onBeforeRenderIsomorph to true, then onBeforeRender() is loaded/executed in the browser as well, allowing us to fetch data direcly from the browser upon client-side navigation (without involving our Node.js/Edge server at all).
                env: { server: true, client: true },
              },
            },
          };
        }
      },
    },
  },
  prerender: true,
  extends: config,
} satisfies Config;
