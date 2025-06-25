import { getVikeConfig } from "vike/plugin";
import { normalizePath, type Plugin } from "vite";
import { assert } from "../utils/assert";
import { addPhotonServerConfig } from "@photonjs/core/api";

export function routesPlugins(): Plugin[] {
  const vikePages: {
    pageId: string;
    isr: number | null;
    edge: null | boolean;
    headers: Record<string, string> | null;
    route: string | null;
  }[] = [];

  return [
    {
      name: "vike-vercel:routes:read-config",
      apply: "build",

      applyToEnvironment(env) {
        return env.name === "ssr";
      },

      closeBundle: {
        order: "post",
        async handler() {
          const vikeConfig = getVikeConfig(this.environment.config);

          for (const [pageId, page] of Object.entries(vikeConfig.pages)) {
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

            const route = typeof page.route === "string" ? getParametrizedRoute(page.route) : null;

            if (!route && headers !== null && headers !== undefined) {
              this.warn(
                `Page ${pageId}: { headers } are not supported when using route function. Remove \`{ headers }\` config or use a route string if possible.`,
              );
            }

            vikePages.push({
              pageId,
              isr,
              edge,
              headers,
              route,
            });
          }
        },
      },

      sharedDuringBuild: true,
    },
    {
      name: "vike-vercel:routes:build",
      apply: "build",

      applyToEnvironment(env) {
        return env.name === "vercel_node" || env.name === "vercel_edge";
      },

      buildStart: {
        handler() {
          // Emit vercel functions
          const isEdge = this.environment.name === "vercel_edge";
          const key = isEdge ? "__vike_edge" : "__vike_node";

          // By default, a unique Vike function is necessary per env (node, edge)
          // We only need to create a new function when either `isr` or `headers` is provided
          const currentEnvPages = vikePages.filter((p) => Boolean(p.edge) === isEdge);
          // Specific routes
          for (const page of currentEnvPages.filter(
            (p) => p.isr || (p.route && p.headers !== null && p.headers !== undefined),
          )) {
            const name = `${key}${page.pageId}`;
            addPhotonServerConfig(this, {
              name,
              route: page.route ?? undefined,
              vercel: {
                destination: normalizePath(name),
                isr: page.isr ? { expiration: page.isr } : undefined,
                headers: page.headers,
                route: page.route ? `${page.route}(?:\\/index\\.pageContext\\.json)?` : undefined,
                edge: isEdge,
              },
            });
          }

          const vikeConfig = getVikeConfig(this.environment.config);

          if (
            currentEnvPages.length > 0 &&
            // Only generate one default route
            isEdge === Boolean(vikeConfig?.config.edge)
          ) {
            // Catch-all
            const name = `${key}/__catch_all`;
            addPhotonServerConfig(this, {
              name,
              route: "/**",
              vercel: {
                destination: normalizePath(name),
                route: ".*",
                edge: isEdge,
                enforce: "post",
              },
            });
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

function getSegmentRou3(segment: string): string {
  if (segment.startsWith("@")) {
    return `/:${segment.slice(1)}`;
  }
  if (segment === "*") {
    return "/**";
  }
  return `/${segment}`;
}

export function getParametrizedRoute(route: string): string {
  const segments = (route.replace(/\/$/, "") || "/").slice(1).split("/");
  return segments.map(getSegmentRou3).join("");
}
