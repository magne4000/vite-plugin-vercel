import { VercelRequest, VercelResponse } from '@vercel/node';
import type { renderPage } from 'vite-plugin-ssr/dist/cjs/node/renderPage';
import { parse } from 'querystring';

// TODO export this type from vite-plugin-ssr
type HttpResponse = NonNullable<
  Awaited<ReturnType<typeof renderPage>>['httpResponse']
>;

export function getDefaultPageContextInit(request: VercelRequest) {
  const query: Record<string, string | string[]> = request.query ?? {};
  const matches =
    // FIXME x-now-route-matches is not definitive https://github.com/orgs/vercel/discussions/577#discussioncomment-2769478
    typeof request.headers['x-now-route-matches'] === 'string'
      ? parse(request.headers['x-now-route-matches'])
      : null;
  const url: string =
    typeof query.__original_path === 'string'
      ? query.__original_path
      : matches && typeof matches!['1'] === 'string'
      ? matches['1']
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
