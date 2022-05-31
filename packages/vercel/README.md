# vite-plugin-vercel

This is a **Work In Progress** Vercel adapter for [`vite`](https://vitejs.dev/).

Its purpose is to help you bundle your application in `.vercel` folder as supported by
([Vercel API v3](https://vercel.com/docs/build-output-api/v3)).

## Features

- [x] [SSG/Static files support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/static-files)
  - see [`prerender` config](/packages/vercel/src/types.ts#L33)
- [x] [SSR/Serverless functions support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions)
  - `.[jt]s` files under the `<root>/api` folder of your project are automatically bundled as Serverless functions under `.vercel/output/functions/api/*.func`
  - see [`additionalEndpoints` config](/packages/vercel/src/types.ts#L54)
- [x] [ISR/Prerender functions support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/prerender-functions)
  - see [`isr` config](/packages/vercel/src/types.ts#L81). Also see implementation of [vite-plugin-ssr](./prerender/vite-plugin-ssr.ts) for example
- [ ] [Edge functions support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions)
- [ ] [Images optimization support](https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/images)
- [ ] [Preview mode support](https://vercel.com/docs/build-output-api/v3#features/preview-mode)
- [x] [Advanced config override](/packages/vercel/src/types.ts#L15)
  - [ ] Complete config override

## Usage

First, make sure `ENABLE_VC_BUILD=1` is declared as an Environment Variable in your deployment configuration.

Then, install this package as a dev dependency and add it to your Vite config like this:

```ts
import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';
import ssr from 'vite-plugin-ssr';

export default defineConfig({
  plugins: [ssr(), vercel()],
});
```

### Usage with vite-plugin-ssr

[vite-plugin-ssr](https://vite-plugin-ssr.com/) will support this plugin when stable.
In the meantime, you can add experimental support yourself.

First copy [prerender](/prerender) folder to the root of your project.
Then, update your vercel config:

```ts
// vercel.config.ts
// A TS config is prefered if your project is of { type: "module" }

import module from 'module';
import { defineConfig } from 'vite';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';

// FIX esbuild bug https://github.com/evanw/esbuild/pull/2067
// probably not necessary when `./prerender/vite-plugin-ssr` will be included in `vite-plugin-ssr`
// eslint-disable-next-line no-undef
globalThis.require = module.createRequire(import.meta.url);

export default defineConfig(async ({ command, mode }) => {
  // Dynamic import to bypass esbuild compilation issue.
  // If you are not using ESM, could me move as a top synchronous import
  const vitePluginSsrVercelPlugin = await import('./prerender/vite-plugin-ssr');

  return {
    plugins: [ssr(), vercel(), vitePluginSsrVercelPlugin.default()],
    build: {
      polyfillDynamicImport: false,
    },
    vercel: {
      // Tweak what you need, check TS definition for details
    },
  };
});
```

### Config

See [TS types](/packages/vercel/src/types.ts#L15) for details.

## Demo

https://test-vite-vercel-plugin.vercel.app/
