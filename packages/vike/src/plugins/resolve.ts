import type { Plugin } from "vite";

export const resolvedModuleId = "virtual:vike-universal-handler";
const resolvedVirtualModuleId = "\0virtual:vike-universal-handler";

export function resolvePlugin(): Plugin {
  return {
    name: "vike-vercel:resolve",

    applyToEnvironment(env) {
      return env.name === "vercel_node" || env.name === "vercel_edge" || env.name === "vercel_client";
    },

    async resolveId(id, _importer, options) {
      if (id.startsWith(resolvedModuleId) || id === resolvedVirtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        // Vike's Universal Handler wrapped to ensure that we also import ./dist/server/entry when bundling
        // It also fixes the actual request URL thanks to `x-now-route-matches` and `__original_path`
        //language=javascript
        return `
import "virtual:@brillout/vite-plugin-server-entry:serverEntry";
import handler from "vike/universal-middleware";

export default function vercelVikeHandler(request, context, runtime) {
  const xNowRouteMatchesHeader = request.headers.get("x-now-route-matches");
  const originalUrl = new URL(request.url);
  const originalPath = originalUrl.searchParams.get("__original_path");
  let newUrl = null;
  
  let newRequest = request;
  
  if (originalPath) {
    newUrl = new URL(originalPath, request.url).toString();
  } else if (typeof xNowRouteMatchesHeader === "string") {
    const originalPathBis = new URLSearchParams(xNowRouteMatchesHeader).get("1");
    if (originalPathBis) {
      newUrl = new URL(originalPathBis, request.url).toString();
    }
  }
  
  if (newUrl) {
    newRequest = new Request(newUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      integrity: request.integrity
    })
  }
  
  return handler(newRequest, context, runtime);
}
`;
      }
    },
  };
}
