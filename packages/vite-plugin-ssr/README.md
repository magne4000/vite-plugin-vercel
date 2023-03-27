# @magne4000/vite-plugin-vercel-ssr

[`vite-plugin-ssr`](https://github.com/brillout/vite-plugin-ssr) integration for `vite-plugin-vercel`.

- Versions `0.1.x` are compatible with vite-plugin-ssr@0.4.x
- Versions `0.0.x` are compatible with vite-plugin-ssr@0.3.x

## Features

- [Support for ISR/Prerender Functions](#isrprerender-functions)
- [Route strings](https://vite-plugin-ssr.com/route-string) and [filesystem routing](https://vite-plugin-ssr.com/filesystem-routing) are compiled to [routes rules](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/routes)
- A Serverless Function is created by default to handle SSR route. No need to [manually create it](https://github.com/brillout/vite-plugin-ssr_vercel/blob/main/api/ssr.js)
  - If you need to customize the Function, [some helpers are available](#custom-serverless-function-for-vite-plugin-ssr)

## Usage

Install this package as a dev dependency and add it to your Vite config like this:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import vercelSsr from '@magne4000/vite-plugin-vercel-ssr';

export default defineConfig(async ({ command, mode }) => {
  return {
    // `vercelSsr` MUST be after `ssr` and `vercel`
    plugins: [ssr(), vercel(), vercelSsr()],
  };
});
```

### ISR/Prerender Functions

Official documentation: https://vercel.com/docs/build-output-api/v3#vercel-primitives/prerender-functions

Take any of your `.page` file (not `.page.server`) and add the following export:

```ts
// Now this page is a Prerender Function, meaning that it will be cached on Edge network for 15 seconds.
// Check official documentation for further details on how it works.
export const isr = { expiration: 15 };
```

:warning: Pages with [route function](https://vite-plugin-ssr.com/route-function) are not compatible with ISR. A warning will be shown if this occurs.

### Custom Serverless Function for vite-plugin-ssr

By default, a Serverless Function is created to handle all SSR routes.
If for any reason you need to customize it, some tools are available:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { renderPage } from 'vite-plugin-ssr/server';
import {
  getDefaultEmptyResponseHandler,
  // higly recommended to use at least this one, as it handles some internals
  // that overrides `request.url`
  getDefaultPageContextInit,
  getDefaultResponseHandler,
} from '@magne4000/vite-plugin-vercel-ssr/helpers';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // pageContextInit.url is not necessarily equal to request.url.
  // It is required for `renderPage` to work properly.
  const pageContextInit = getDefaultPageContextInit(request);
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;

  if (!httpResponse) {
    return getDefaultEmptyResponseHandler(response);
  }

  return getDefaultResponseHandler(response, httpResponse);
}
```
