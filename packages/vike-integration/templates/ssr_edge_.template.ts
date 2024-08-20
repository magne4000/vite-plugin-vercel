import { renderPage } from "vike/server";
import { getDefaultEmptyResponseHandler, getDefaultPageContextInit, getDefaultResponseHandler } from "./edge-helpers";

export default async function handler(request: Request): Promise<Response> {
  console.debug("url", request.url);
  console.debug("headers", request.headers);
  const pageContextInit = getDefaultPageContextInit(request);
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;

  if (!httpResponse) {
    return getDefaultEmptyResponseHandler();
  }

  return getDefaultResponseHandler(httpResponse);
}
