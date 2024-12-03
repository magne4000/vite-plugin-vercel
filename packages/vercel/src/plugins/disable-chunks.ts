import { randomUUID } from "node:crypto";
import type { LoadResult } from "rollup";
// Inspired by https://github.com/rollup/rollup/issues/2756#issuecomment-2078799110
import type { Plugin } from "vite";

export function disableChunks(): Plugin {
  return {
    name: "vite-plugin-vercel:disable-chunks",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (
        !source.startsWith("virtual:vite-plugin-vercel:entry") &&
        (this.environment.name === "vercel_node" || this.environment.name === "vercel_edge")
      ) {
        const resolved = await this.resolve(source, importer, options);

        if (resolved && !resolved.external) {
          return `${resolved.id}?unique=${randomUUID()}`;
        }
      }
    },
    // TODO
    // resolveDynamicImport(specifier, importer) {
    //   console.log("\nresolveDynamicImport", {
    //     specifier,
    //     importer,
    //   });
    // },
    load(id) {
      const regex = /(\?unique=.*)$/;
      if (regex.test(id)) {
        return this.load({ id: id.replace(regex, "") }) as Promise<LoadResult>;
      }
    },
  };
}
