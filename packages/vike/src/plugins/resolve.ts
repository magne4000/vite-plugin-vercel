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
      // ./dist/server/entry should already have been generated during "ssr" env build phase
      // So after that, we can directly import it when needed, for instance inside universal-handler
      if (id === "virtual:@brillout/vite-plugin-server-entry:serverEntry") {
        const resolved = await this.resolve("./dist/server/entry", undefined, options);
        return resolved?.id;
      }
      if (id.startsWith(resolvedModuleId) || id === resolvedVirtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        // Vike's Universal Handler wrapped to ensure that we also import ./dist/server/entry when bundling
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

  console.log({
    xNowRouteMatchesHeader,
    originalUrl: request.url,
    originalPath
  });
  
  if (originalPath) {
    newUrl = new URL(originalPath, request.url).toString();
    console.log('newUrl 1', newUrl);
  } else if (typeof xNowRouteMatchesHeader === "string") {
    const originalPathBis = new URLSearchParams(xNowRouteMatchesHeader).get("1");
    if (originalPathBis) {
      newUrl = new URL(originalPathBis, request.url).toString();
      console.log('newUrl 2', newUrl);
    }
  }
  
  if (newUrl) {
    console.log('newRequest');
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
