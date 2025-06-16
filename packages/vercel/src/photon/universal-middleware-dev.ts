import '../types'
import { enhance, MiddlewareOrder, type UniversalMiddleware } from "@universal-middleware/core";
import type { Photon } from "@photonjs/core/api";

export const applyVercelHeaders: UniversalMiddleware<
  // TODO export type from Photon
  Universal.Context & { photon?: { handler?: Photon.EntryUniversalHandler; server?: Photon.EntryServer } }
> = (_request, context) => {
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
