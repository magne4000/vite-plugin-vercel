import { VercelRequest, VercelResponse } from '@vercel/node';
import type { renderPage } from 'vite-plugin-ssr/dist/cjs/node/renderPage';

// TODO export this type from vite-plugin-ssr
type HttpResponse = NonNullable<
  Awaited<ReturnType<typeof renderPage>>['httpResponse']
>;

export function getDefaultPageContextInit(request: VercelRequest) {
  const query: Record<string, string | string[]> = request.query ?? {};
  const url: string =
    typeof query.__original_path === 'string'
      ? query.__original_path
      : request.url!;
  return {
    url,
    body: request.body,
    cookies: request.cookies,
  };
}

export function getDefaultEmptyResponseHandler(response: VercelResponse) {
  response.statusCode = 200;
  response.setHeader('content-type', 'text/html; charset=UTF-8');
  return response.end('');
}

export function getDefaultResponseHandler(
  response: VercelResponse,
  httpResponse: HttpResponse,
) {
  const { statusCode, body, contentType } = httpResponse;

  response.statusCode = statusCode;
  response.setHeader('content-type', contentType);
  return response.end(body);
}
