import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { renderPage } from "vike";
import { getOriginalUrl } from "./utils";

type HttpResponse = NonNullable<Awaited<ReturnType<typeof renderPage>>["httpResponse"]>;

/**
 * Extract useful pageContext from request to give to renderPage(...).
 * It handles internals such as retrieving the original url from `x-now-route-matches` header or from `__original_path` query,
 * so it's highly recommended to use it instead of `request.url`.
 * @param request
 */
export function getDefaultPageContextInit(request: VercelRequest) {
  const query: Record<string, string | string[]> = request.query ?? {};
  const url = getOriginalUrl(request.headers["x-now-route-matches"], query.__original_path, request.url);
  return {
    url,
    urlOriginal: url,
    body: request.body,
    cookies: request.cookies,
  };
}

/**
 * Send a default empty HTML response
 * @param response
 */
export function getDefaultEmptyResponseHandler(response: VercelResponse) {
  response.statusCode = 200;
  response.setHeader("content-type", "text/html; charset=UTF-8");
  return response.end("");
}

/**
 * Send `httpResponse` through `response`
 * @param response
 * @param httpResponse
 */
export function getDefaultResponseHandler(response: VercelResponse, httpResponse: HttpResponse) {
  const { statusCode, body, headers } = httpResponse;

  response.statusCode = statusCode;
  for (const [name, value] of headers) {
    response.setHeader(name, value);
  }
  return response.end(body);
}
