///<reference types="vike-server/photon-types"/>

import type { Photon } from "@photonjs/core";
import { getVikeConfig } from "vike/plugin";
import { pageNamePrefix } from "vike-server/api";
import { normalizePath, type Plugin } from "vite";
import { assert } from "../utils/assert";

export function routesPlugins(): Plugin[] {
  return [
    {
      name: "vike-vercel:routes:build",
      apply: "build",

      applyToEnvironment(env) {
        return env.name === "ssr";
      },

      buildStart: {
        // Ensure that this hook is executed after Vike had time to add all Photon entries
        order: "post",
        handler() {
          for (const entry of this.environment.config.photon.entries) {
            if (!entry.vikeMeta) continue;

            const { page, pageId } = entry.vikeMeta;
            const rawIsr = extractIsr(page.config);
            let isr = assertIsr(page.config);
            const edge = assertEdge(page.config);
            const headers = assertHeaders(page.config);

            if (typeof page.route === "function" && isr) {
              this.warn(
                `Page ${pageId}: ISR is not supported when using route function. Remove \`{ isr }\` config or use a route string if possible.`,
              );
              isr = null;
            }

            if (edge && rawIsr !== null && typeof rawIsr === "object") {
              throw new Error(
                `Page ${pageId}: ISR cannot be enabled for edge functions. Remove \`{ isr }\` config or set \`{ edge: false }\`.`,
              );
            }

            if (!entry.route && headers !== null && headers !== undefined) {
              this.warn(
                `Page ${pageId}: { headers } are not supported when using route function. Remove \`{ headers }\` config or use a route string if possible.`,
              );
            }

            // Compute Vercel-specific metadata
            entry.vercel = {
              ...entry.vercel,
              destination: normalizePath(entry.name),
              isr: isr ? { expiration: isr } : undefined,
              headers: headers,
              route: entry.route ? `${routeToRegExp(entry.route)}(?:\\/index\\.pageContext\\.json)?` : undefined,
              edge: Boolean(edge),
            };
            if (edge) {
              entry.env = "vercel_edge";
            }
          }

          // By default, a unique Vike function is necessary per env (node, edge)
          // We only need to create a new function when either `isr` or `headers` is provided
          {
            const vikeEntriesEdge = this.environment.config.photon.entries.filter((e) => e.vikeMeta && e.vercel?.edge);
            const vikeEntriesNode = this.environment.config.photon.entries.filter((e) => e.vikeMeta && !e.vercel?.edge);
            const vikeEntriesToKeep = new Set<Photon.Entry>();

            for (const envEntries of [vikeEntriesEdge, vikeEntriesNode]) {
              for (const page of envEntries.filter(
                (p) =>
                  p.vercel?.isr || (p.vercel?.route && p.vercel?.headers !== null && p.vercel?.headers !== undefined),
              )) {
                vikeEntriesToKeep.add(page);
              }
            }

            this.environment.config.photon.entries = this.environment.config.photon.entries.filter(
              (e) => !e.vikeMeta || vikeEntriesToKeep.has(e),
            );
          }

          // Generate default entry
          {
            const vikeConfig = getVikeConfig(this.environment.config);
            const name = `${pageNamePrefix}/__catch_all`;
            this.environment.config.photon.server.route = "/**";
            this.environment.config.photon.server.vercel = {
              destination: normalizePath(name),
              route: ".*",
              edge: Boolean(vikeConfig?.config.edge),
              enforce: "post",
            };
          }
        },
      },

      sharedDuringBuild: true,
    },
  ];
}

function extractIsr(exports: unknown) {
  if (exports === null || typeof exports !== "object") return null;
  if (!("isr" in exports)) return null;
  const isr = (exports as { isr: unknown }).isr;

  assert(
    typeof isr === "object" &&
      typeof (isr as Record<string, unknown>).expiration === "number" &&
      (
        isr as {
          expiration: number;
        }
      ).expiration > 0,
    " `{ expiration }` must be a positive number",
  );

  return isr;
}

function assertIsr(exports: unknown): number | null {
  const isr = extractIsr(exports);
  if (isr === null || isr === undefined) return null;

  return (
    isr as {
      expiration: number;
    }
  ).expiration;
}

function assertEdge(exports: unknown): boolean | null {
  if (exports === null || typeof exports !== "object") return null;
  if (!("edge" in exports)) return null;
  const edge = (exports as { edge: unknown }).edge;

  assert(typeof edge === "boolean", " `{ edge }` must be a boolean");

  return edge;
}

function assertHeaders(exports: unknown): Record<string, string> | null {
  if (exports === null || typeof exports !== "object") return null;
  if (!("headers" in exports)) return null;
  const headers = (exports as { headers: unknown }).headers;

  if (headers === null || headers === undefined) {
    return null;
  }

  assert(typeof headers === "object", " `{ headers }` must be an object");

  for (const value of Object.values(headers)) {
    assert(typeof value === "string", " `{ headers }` must only contains string values");
  }

  return headers as Record<string, string>;
}

// TODO move to https://github.com/magne4000/convert-route
// https://github.com/h3js/rou3/blob/main/src/regexp.ts
function routeToRegExp(route = "/"): string {
  const reSegments = [];
  let idCtr = 0;
  for (const segment of route.split("/")) {
    if (!segment) continue;
    if (segment === "*") {
      reSegments.push(`(?<_${idCtr++}>[^/]*)`);
    } else if (segment.startsWith("**")) {
      reSegments.push(segment === "**" ? "?(?<_>.*)" : `?(?<${segment.slice(3)}>.+)`);
    } else if (segment.includes(":")) {
      reSegments.push(segment.replace(/:(\w+)/g, (_, id) => `(?<${id}>[^/]+)`).replace(/\./g, "\\."));
    } else {
      reSegments.push(segment);
    }
  }
  return `/${reSegments.join("/")}`;
}
