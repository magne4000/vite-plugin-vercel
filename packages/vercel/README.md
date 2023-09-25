# vite-plugin-vercel

Vercel adapter for [`vite`](https://vitejs.dev/).

Its purpose is to help you bundle your application in `.vercel` folder as supported by
[Vercel API v3](https://vercel.com/docs/build-output-api/v3).

## Features

- [x] [SSG/Static files support](https://vercel.com/docs/build-output-api/v3/primitives#static-files)
  - see [`prerender` config](/packages/vercel/src/types.ts#L37)
- [x] [SSR/Serverless functions support](https://vercel.com/docs/build-output-api/v3/primitives#serverless-functions)
  - `.[jt]s` files under the `<root>/api` folder of your project are automatically bundled as Serverless functions under `.vercel/output/functions/api/*.func`
  - see [`additionalEndpoints` config](/packages/vercel/src/types.ts#L62)
- [x] [ISR/Prerender functions support](https://vercel.com/docs/build-output-api/v3/primitives#prerender-functions)
  - see [`isr` config](/packages/vercel/src/types.ts#L89). Also see implementation of [vike](/packages/vike-integration/vike.ts) for example
- [x] [Edge functions support](https://vercel.com/docs/build-output-api/v3/primitives#edge-functions)
- [ ] [Images optimization support](https://vercel.com/docs/build-output-api/v3/configuration#images)
- [ ] [Preview mode support](https://vercel.com/docs/build-output-api/v3/features#preview-mode)
- [x] [Advanced config override](/packages/vercel/src/types.ts#L19)
  - [ ] Complete config override

## Simple usage

Then, install this package as a dev dependency and add it to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [vercel()],
  vercel: {
    // optional configuration options, see below for details
  },
});
```

## Usage with vike

[vike](https://vike.dev/) is supported through [@vite-plugin-vercel/vike](/packages/vike-integration/README.md) plugin.

You only need to install `@vite-plugin-vercel/vike`, the Vite config stays the same as above.

> [!IMPORTANT]  
> `@vite-plugin-vercel/vike` supersedes the old `@magne4000/vite-plugin-vercel-ssr` package.
> As such, you should remove `@magne4000/vite-plugin-vercel-ssr` from your package.json and vite config file.

### vike V1 design

`vite-plugin-vercel` fully supports [vike V1 design](https://vike.dev/migration/v1-design),
and thus you can leverage [config files](https://vike.dev/config) to customize ISR configuration:

```ts
// /pages/product/+config.h.ts

import Page from './Page';
import type { Config } from 'vike/types';

// Customize ISR config for this page
export default {
  isr: { expiration: 15 },
} satisfies Config;
```

You will also need to extend the [renderer config](https://vike.dev/config#renderer) so that `vike` is aware of the new parameter:

```ts
// /renderer/+config.h.ts

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
     * By default, all `api/*` endpoints are compiled under `.vercel/output/functions/api/*.func`.
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
