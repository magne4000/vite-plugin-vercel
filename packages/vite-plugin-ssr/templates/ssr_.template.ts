import type { VercelRequest, VercelResponse } from '@vercel/node';
import { renderPage } from 'vite-plugin-ssr/server';
import {
  getDefaultEmptyResponseHandler,
  getDefaultPageContextInit,
  getDefaultResponseHandler,
} from './helpers';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  console.debug('query', request.query);
  console.debug('url', request.url);
  console.debug('headers', request.headers);
  const pageContextInit = getDefaultPageContextInit(request);
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;

  if (!httpResponse) {
    return getDefaultEmptyResponseHandler(response);
  }

  return getDefaultResponseHandler(response, httpResponse);
}
