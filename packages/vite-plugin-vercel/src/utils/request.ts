// Keep this function side effect free so that we can stringify it
export function getOriginalRequest(request: Request) {
  const xOriginalPath = request.headers.get("x-original-path");
  let newUrl = null;

  let newRequest = request;

  if (typeof xOriginalPath === "string") {
    newUrl = new URL(xOriginalPath, request.url).toString();
  }

  if (newUrl && request.url !== newUrl) {
    const requestInit: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers: request.headers,
      body: request.body,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      integrity: request.integrity,
    };

    if (request.body) {
      requestInit.duplex = "half";
    }

    newRequest = new Request(newUrl, requestInit);
  }

  return newRequest;
}
