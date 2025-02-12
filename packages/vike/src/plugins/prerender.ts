import type { PrerenderContextPublic } from "vike/types";
import type { Plugin } from "vite";

export function prerenderPlugin(): Plugin {
  let vikePrerenderContext: PrerenderContextPublic | undefined = undefined;

  return {
    name: "vike-vercel:prerender",

    closeBundle: {
      order: "post",
      handler() {
        if (this.environment.name === "ssr") {
          vikePrerenderContext = this.environment.config.vike?.prerenderContext;
        }
      },
    },

    buildStart() {
      switch (this.environment.name) {
        case "vercel_node": {
          break;
        }
        case "vercel_edge": {
          break;
        }
      }

      console.log(
        this.environment.name,
        vikePrerenderContext?.pageContexts.map((x) => ({
          pageId: x.pageId,
          config: x.config,
          configEntries: x.configEntries,
        })),
      );
    },

    sharedDuringBuild: true,
  };
}
