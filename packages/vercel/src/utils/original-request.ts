export function getOriginalRequest(request: Request) {
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
      integrity: request.integrity,
    });
  }

  return newRequest;
}
