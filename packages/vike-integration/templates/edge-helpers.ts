import { parse } from "qs";
import type { renderPage } from "vike";
import { getOriginalUrl } from "./utils";

type HttpResponse = NonNullable<Awaited<ReturnType<typeof renderPage>>["httpResponse"]>;

/**
 * Extract useful pageContext from request to give to renderPage(...).
 * It handles internals such as retrieving the original url from `x-now-route-matches` header or from `__original_path` query,
 * so it's highly recommended to use it instead of `request.url`.
 * @param request
 */
export function getDefaultPageContextInit(request: Request) {
  const queryString = new URL(request.url).search.slice(1); // Remove the leading "?" with .slice(1)
  const query = parse(queryString);
  const url = getOriginalUrl(request.headers.get("x-now-route-matches"), query.__original_path, request.url);
  const cookieHeader = request.headers.get("Cookie") || "";

  const cookies = cookieHeader.split("; ").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.split("=");
      acc[name] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    urlOriginal: url,
    body: request.body,
    cookies,
  };
}

/**
 * Send a default empty HTML response
 */
export function getDefaultEmptyResponseHandler(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  });
}

/**
 * Send `httpResponse` through `response`
 */
export function getDefaultResponseHandler(httpResponse: HttpResponse): Response {
  const { statusCode, body, headers } = httpResponse;

  return new Response(body, {
    status: statusCode,
    headers,
  });
}
