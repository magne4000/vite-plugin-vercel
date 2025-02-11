import { randomUUID } from "node:crypto";
import type { LoadResult } from "rollup";
import type { Plugin } from "vite";

// Inspired by https://github.com/rollup/rollup/issues/2756#issuecomment-2078799110
export function disableChunks(): Plugin {
  return {
    name: "vite-plugin-vercel:disable-chunks",
    apply: "build",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (
        !source.startsWith("virtual:") &&
        // !source.startsWith("virtual:vite-plugin-vercel:entry") &&
        (this.environment.name === "vercel_node" || this.environment.name === "vercel_edge")
      ) {
        const resolved = await this.resolve(source, importer, options);

        if (resolved && !resolved.external && !resolved.meta.unique) {
          // FIXME those cause weird Vite Errors:
          //   Another solution is to call `esbuild` to bundle each generated function separately
          // * Error during build: Unexpected early exit.
          // * This happens when Promises returned by plugins cannot resolve. Unfinished hook action(s) on exit
          if (resolved.id.includes("react")) return;
          if (resolved.id.includes("vike")) return;
          if (resolved.id.includes("/renderer")) return;
          // console.log(source);

          // Reuse importer UUID if it exists
          const match = importer?.match(/\?unique=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
          const uuid = match?.[1] ?? randomUUID();
          return {
            ...resolved,
            id: `${resolved.id}?unique=${uuid}`,
            meta: {
              ...resolved.meta,
              unique: uuid,
            },
          };
        }
        return resolved;
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
