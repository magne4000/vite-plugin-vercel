# @vite-plugin-vercel/vike

[`vike`](https://github.com/vikejs/vike) integration for `vite-plugin-vercel`.

- Versions `>=0.3.3` are compatible with vike@0.4.x and above
- Versions `0.1.x` are compatible with vike@0.4.x
- Versions `0.0.x` are compatible with vike@0.3.x

## Features

- [Support for ISR/Prerender Functions](#isrprerender-functions)
- [Route strings](https://vike.dev/route-string) and [filesystem routing](https://vike.dev/filesystem-routing) are compiled to [routes rules](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/routes)
- A Serverless Function is created by default to handle SSR route. No need to [manually create it](https://github.com/vikejs/vike_vercel/blob/main/api/ssr.js)
  - If you need to customize the Function, [some helpers are available](#custom-serverless-function-for-vike)

## Usage

Install `vite-plugin-vercel` and `@vite-plugin-vercel/vike` and make sure only `vite-plugin-vercel` is added as a vite plugin.

`vite-plugin-vercel` will auto load `@vite-plugin-vercel/vike` when necessary.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import ssr from 'vike/plugin';
import vercel from 'vite-plugin-vercel';

export default defineConfig(async ({ command, mode }) => {
  return {
    plugins: [ssr(), vercel()],
  };
});
```

### ISR/Prerender Functions

Official documentation: https://vercel.com/docs/build-output-api/v3/primitives#prerender-functions

:warning: Pages with [route function](https://vike.dev/route-function) are not compatible with ISR. A warning will be shown if this occurs.

#### vike 0.4.x

Take any of your `.page` file (not `.page.server`) and add the following export:

```ts
// Now this page is a Prerender Function, meaning that it will be cached on Edge network for 15 seconds.
// Check official documentation for further details on how it works.
export const isr = { expiration: 15 };
```

#### vike V1 design

Take any of your [page config file](https://vike.dev/config), and add the following configuration:

```ts
import type { Config } from 'vike/types';

export default {
  // Now this page is a Prerender Function, meaning that it will be cached on Edge network for 15 seconds.
  // Check official documentation for further details on how it works.
  isr: { expiration: 15 },
} satisfies Config;
```

### Custom Serverless Function for vike

By default, a Serverless Function is created to handle all SSR routes.
If for any reason you need to customize it, some tools are available:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { renderPage } from 'vike/server';
import {
  getDefaultEmptyResponseHandler,
  // higly recommended to use at least this one, as it handles some internals
  // that overrides `request.url`
  getDefaultPageContextInit,
  getDefaultResponseHandler,
} from '@vite-plugin-vercel/vike/helpers';

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
