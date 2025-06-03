import { createMiddleware } from "@universal-middleware/express";
import { getTransformedRoutes, type RouteWithSrc } from "@vercel/routing-utils";
import { match } from "path-to-regexp";
import type { Environment, Plugin, RunnableDevEnvironment } from "vite";
import { photonEntryDestinationDefault } from "../utils/destination";
import { assert } from "../assert";
import path from "node:path";

export function isRunnableDevEnvironment(environment: Environment): environment is RunnableDevEnvironment {
  return "runner" in environment;
}

export function devServerPlugin(): Plugin {
  return {
    name: "vite-plugin-vercel:dev-server",

    configureServer: {
      order: "post",
      async handler(server) {
        const entries = server.config.photon.handlers;
        const transformedRoutes = getTransformedRoutes({
          rewrites: Object.values(entries).map((entry) => ({
            // TODO handle entry.route
            source: typeof entry.vercel?.route === "string" ? `(${entry.vercel.route})` : entryToPathtoregex(entry),
            destination: photonEntryDestinationDefault(entry),
          })),
        });

        const routes = (transformedRoutes.routes ?? [])
          .filter((r): r is RouteWithSrc => Boolean(r.src))
          .map((r) => {
            const entry = Object.values(entries).find(
              (e) => photonEntryDestinationDefault(e) === r.dest?.split("?")[0],
            );
            return {
              src: new RegExp(r.src),
              dest: r.dest,
              entry: Object.values(entries).find((e) => photonEntryDestinationDefault(e) === r.dest?.split("?")[0]),
              re: entry
                ? typeof entry.vercel?.route === "string"
                  ? (str: string) => str.match(entry.vercel?.route as string)
                  : match(entryToPathtoregex(entry))
                : null,
            };
          });

        // Inject Post Middleware that executes AFTER Vite's internal middlewares
        return () => {
          const routesWithAddedHeaders = routes.filter((r) => r.entry?.vercel?.headers);
          if (routesWithAddedHeaders.length > 0) {
            // This middleware is in charge of adding user-provided headers onto the Response
            server.middlewares.use(
              createMiddleware(() => async (request) => {
                return (response) => {
                  const url = new URL(request.url);
                  for (const r of routesWithAddedHeaders) {
                    if (r.entry?.vercel?.headers && r.src.test(url.pathname)) {
                      for (const [key, value] of Object.entries(r.entry.vercel.headers))
                        response.headers.set(key, value);
                    }
                  }
                  return response;
                };
              })(),
            );
          }

          // This middleware is in charge of resolving Vercel entries
          // This middleware needs access to vite environments, so it cannot be moved to Photon `resolveMiddleware`
          server.middlewares.use(
            createMiddleware(() => async (request, ctx, runtime) => {
              const url = new URL(request.url);

              for (const r of routes) {
                const found = r.re?.(url.pathname);
                if (r.entry && found) {
                  const devEnv = r.entry.vercel?.edge
                    ? server.environments.vercel_edge
                    : server.environments.vercel_node;

                  if (isRunnableDevEnvironment(devEnv)) {
                    const newRequest = request.clone();
                    if (r.entry.vercel?.headers) {
                      for (const [key, value] of Object.entries(r.entry.vercel?.headers))
                        newRequest.headers.set(key, value);
                    }

                    // FIXME: extract params for entries with `entry.route` regex
                    const params = "params" in found ? found.params : {};

                    // Add 'x-now-route-matches' header
                    request.headers.set(
                      "x-now-route-matches",
                      new URLSearchParams(params as Record<string, string>).toString(),
                    );
                    // patch `runtime.params` because its computing is based on 'x-now-route-matches' header
                    // which we just added.
                    runtime.params = params as Record<string, string>;

                    // Other internal headers are listed here if we need future support
                    // https://github.com/vercel/next.js/blob/c994df87a55c1912a99b4ca25cd5d5d5790c1dac/packages/next/src/server/lib/server-ipc/utils.ts#L42

                    const fileEntry = await devEnv.runner.import(r.entry.id);

                    if (typeof fileEntry.default === "function") {
                      // Universal Handler
                      return fileEntry.default(newRequest, ctx, runtime);
                    }
                    if (fileEntry.default) {
                      throw new Error("Server entry must be defined under `index` entry");
                    }
                    // TODO use Photon Error classes
                    throw new Error(`Unable to determine entry type of ${r.entry.id}`);
                  }

                  throw new Error(`${devEnv.name} environment is not Runnable`);
                }
              }
            })(),
          );
        };
      },
    },

    sharedDuringBuild: true,
  };
}

// @vercel/routing-utils respects path-to-regexp syntax
function entryToPathtoregex(entry: Photon.Entry) {
  assert(typeof entry.vercel?.route !== "string", "Do not pass entry with route string to entryToPathtoregex");
  return path.posix
    .resolve("/", photonEntryDestinationDefault(entry))
    .split("/")
    .map((segment) =>
      segment
        .replace(/^\[\[\.\.\.([^/]+)\]\]$/g, ":$1*")
        .replace(/^\[\[([^/]+)\]\]$/g, ":$1?")
        .replace(/^\[\.\.\.([^/]+)\]$/g, ":$1+")
        .replace(/^\[([^/]+)\]$/g, ":$1"),
    )
    .join("/");
}
