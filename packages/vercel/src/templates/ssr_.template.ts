import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPageRenderer } from 'vite-plugin-ssr';

const renderPage = createPageRenderer({ isProduction: true });

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const url = request.url!;
  const pageContextInit = {
    url,
    body: request.body,
    cookies: request.cookies,
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    response.statusCode = 200;
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    return response.end('');
  }
  const { statusCode, body, contentType } = httpResponse;

  response.statusCode = statusCode;
  response.setHeader('content-type', contentType);
  return response.end(body);
}
