import "../types";
import { enhance, MiddlewareOrder, type UniversalMiddleware } from "@universal-middleware/core";
import type { Photon } from "@photonjs/core";

// FIXME during dev, we cannot add dynamic entries through this.emitFile.
//  So for headers to be available in dev, we must create a middleware that will do that for us.
export const applyVercelHeaders: UniversalMiddleware<
  // TODO export type from Photon
  Universal.Context & { photon?: { handler?: Photon.EntryUniversalHandler; server?: Photon.EntryServer } }
> = (_request, context) => {
  console.log(_request.url, context);
  const headers = context.photon?.handler?.vercel?.headers ?? context.photon?.server?.vercel?.headers;
  if (!headers) return;

  return (response) => {
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  };
};

export default [
  enhance(applyVercelHeaders, {
    name: "vercel:headers",
    immutable: true,
    order: MiddlewareOrder.HEADER_MANAGEMENT,
  }),
] as UniversalMiddleware[];
