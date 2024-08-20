# vite-plugin-vercel

Vercel adapter for [Vite](https://vitejs.dev/).

Bundle your Vite application as supported by [Vercel Output API (v3)](https://vercel.com/docs/build-output-api/v3).

## Install

```bash
npm i -D vite-plugin-vercel
```

```bash
yarn add -D vite-plugin-vercel
```

```bash
pnpm add -D vite-plugin-vercel
```

```bash
bun add -D vite-plugin-vercel
```

## Features

- [x] [SSG/Static files](https://vercel.com/docs/build-output-api/v3/primitives#static-files)
  - see [`prerender` config](/packages/vercel/src/types.ts#L37)
- [x] [SSR/Serverless functions](https://vercel.com/docs/build-output-api/v3/primitives#serverless-functions)
  - `.[jt]s` files under the `<root>/api` folder of your project are automatically bundled as Serverless functions under `.vercel/output/functions/api/*.func`
  - see [`additionalEndpoints` config](/packages/vercel/src/types.ts#L62)
- [x] [ISR/Prerender functions](https://vercel.com/docs/build-output-api/v3/primitives#prerender-functions)
  - see [`isr` config](/packages/vercel/src/types.ts#L89). Also see implementation of [vike](/packages/vike-integration/vike.ts) for example
- [x] [Edge functions](https://vercel.com/docs/build-output-api/v3/primitives#edge-functions)
- [x] [Edge middleware](https://vercel.com/docs/functions/edge-middleware/middleware-api)
- [ ] [Images optimization](https://vercel.com/docs/build-output-api/v3/configuration#images)
- [ ] [Preview mode](https://vercel.com/docs/build-output-api/v3/features#preview-mode)
- [x] [Advanced config](/packages/vercel/src/types.ts#L19)

## Simple usage

Install this package as a dev dependency and add it to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [vercel()],
  vercel: {
    // optional configuration options, see "Advanced usage" below for details
  },
});
```

> [!NOTE]
> Files under `/api` or `/_api` directory will automatically be added under `/api/*` route
> Prefer using `/_api` directory, as `@vercel/build` is currently force building `/api` files,
> with no way to disable it, thus avoiding double compilation and unexpected behaviour.

### Configure endpoints

Endpoints under `/api`, `/_api` or added through `additionalEndpoints` can be configured
by exporting values from the endpoint file:

```ts
// file: _api/endpoint.ts

// Should run on edge runtime
export const edge = true;

// Always add those header to this endpoint
export const headers = {
  'Some-Header': 'some value',
};

// Stream the response
export const streaming = true;

// Enable Incremental Static Regeneration for this endpoint
export const isr = {
  expiration: 30,
};

export default async function handler() {
  return new Response('Edge Function: OK', {
    status: 200,
  });
}
```

> [!NOTE]
> Please create an issue if you need other per-endpoints configurations

### Edge middleware

You can use [Edge middleware as describe in the official documentation](https://vercel.com/docs/functions/edge-middleware/middleware-api) (i.e. with a `middleware.ts` file at the root of your project).

## Usage with Vike

[Vike](https://vike.dev/) is supported through [@vite-plugin-vercel/vike](/packages/vike-integration/README.md) plugin.

You only need to install `@vite-plugin-vercel/vike`, the Vite config stays the same as above.

You can then leverage [config files](https://vike.dev/config) to customize your endpoints:

```ts
// /pages/product/+config.ts

import Page from './Page';
import type { Config } from 'vike/types';

export default {
  // Customize ISR config for this page
  isr: { expiration: 15 },
  // Target Edge instead of Serverless
  edge: true,
  // append headers to all responses
  headers: {
    'X-Header': 'value'
  }
} satisfies Config;
```

You will also need to extend the [renderer config](https://vike.dev/config#renderer) so that `vike` is aware of the new parameter:

```ts
// /renderer/+config.ts

import config from '@vite-plugin-vercel/vike/config';
import type { Config } from 'vike/types';

export default {
  extends: config,
} satisfies Config;
```

## Advanced usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [vercel()],
  vercel: {
    // All the followings optional

    /**
     * How long Functions should be allowed to run for every request, in seconds.
     * If left empty, default value for your plan will be used.
     */
    defaultMaxDuration: 30,
    /**
     * Enable streaming responses by default for all Serverless Functions
     */
    defaultSupportsResponseStreaming: true,
    /**
     * Default expiration time (in seconds) for prerender functions.
     * Defaults to 86400 seconds (24h).
     */
    expiration: 86400,
    /**
     * Also known as Server Side Generation, or SSG.
     * If present, this function is responsible to create static files in `.vercel/output/static`.
     * Defaults to `false`, which disables prerendering.
     */
    prerender(resolvedConfig) {
      // Check `/packages/vike/vike.ts` `prerender` for an example
    },
    /**
     * See https://vercel.com/docs/projects/project-configuration#rewrites
     */
    rewrites: [{ source: '/about', destination: '/about-our-company.html' }],
    /**
     * @see {@link https://vercel.com/docs/projects/project-configuration#headers}
     */
    headers: [
      {
        "source": "/service-worker.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      }
    ],
    /**
     * See https://vercel.com/docs/projects/project-configuration#redirects
     */
    redirects: [
      { source: '/me', destination: '/profile.html', permanent: false },
    ],
    /**
     * See https://vercel.com/docs/projects/project-configuration#cleanurls
     */
    cleanUrls: true,
    /**
     * See https://vercel.com/docs/projects/project-configuration#trailingslash
     */
    trailingSlash: true,
    /**
     * By default, all `api/*` and `_api/*` endpoints are compiled under `.vercel/output/functions/api/*.func`.
     * If others serverless functions need to be compiled under `.vercel/output/functions`, they should be added here.
     * For instance, a framework can leverage this to have a generic ssr endpoint
     * without requiring the user to write any code.
     */
    additionalEndpoints: [
      {
        // can also be an Object representing an esbuild StdinOptions
        source: '/path/to/file.ts',
        // URL path of the handler, will be generated to `.vercel/output/functions/api/file.func/index.js`
        destination: '/api/file',
      },
    ],
    /**
     * Advanced configuration to override .vercel/output/config.json
     * See https://vercel.com/docs/build-output-api/v3/configuration#configuration
     */
    config: {
      // routes?: Route[];
      // images?: ImagesConfig;
      // wildcard?: WildcardConfig;
      // overrides?: OverrideConfig;
      // cache?: string[];
      // crons?: CronsConfig;
    },
    /**
     * ISR and SSG pages are mutually exclusive. If a page is found in both, ISR prevails.
     * Keys are path relative to .vercel/output/functions directory, either without extension,
     * or with `.prerender-config.json` extension.
     * If you have multiple isr configurations pointing to the same underlying function, you can leverage the `symlink`
     * property.
     *
     * Can be an object or a function returning an object (or a Promise of an object).
     *
     * Check `/packages/vike/vike.ts` `vitePluginVercelVpsIsrPlugin` for advanced usage.
     */
    isr: {
      // `symlink: 'ssr_'` means that a function is available under `.vercel/output/functions/ssr_.func`
      '/pages/a': { expiration: 15, symlink: 'ssr_', route: '^/a/.*$' },
      '/pages/b/c': { expiration: 15, symlink: 'ssr_', route: '^/b/c/.*$' },
      '/pages/d': { expiration: 15, symlink: 'ssr_', route: '^/d$' },
      '/pages/e': { expiration: 25 },
    },
    /**
     * Defaults to `.vercel/output`. Mostly useful for testing purpose
     */
    outDir: '.vercel/output',
  },
});
```

## Demo

https://test-vite-vercel-plugin.vercel.app/
