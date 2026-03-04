// Keep this function side effect free so that we can stringify it
export function getOriginalRequest(request: Request) {
  const xNowRouteMatchesHeader = request.headers.get("x-now-route-matches");
  let newUrl = null;

  let newRequest = request;

  if (typeof xNowRouteMatchesHeader === "string") {
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
