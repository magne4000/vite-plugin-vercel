# vite-plugin-vercel

This is a **Work In Progress** Vercel adapter for [`vite`](https://vitejs.dev/).

Its purpose is to help you bundle your application in `.vercel` folder as supported by
[Vercel API v3](https://vercel.com/docs/build-output-api/v3).

## Features

- [x] [SSG/Static files support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/static-files)
  - see [`prerender` config](/packages/vercel/src/types.ts#L33)
- [x] [SSR/Serverless functions support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions)
  - `.[jt]s` files under the `<root>/api` folder of your project are automatically bundled as Serverless functions under `.vercel/output/functions/api/*.func`
  - see [`additionalEndpoints` config](/packages/vercel/src/types.ts#L54)
- [x] [ISR/Prerender functions support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/prerender-functions)
  - see [`isr` config](/packages/vercel/src/types.ts#L81). Also see implementation of [vite-plugin-ssr](/packages/vite-plugin-ssr/vite-plugin-ssr.ts) for example
- [x] [Edge functions support](https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions)
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
import ssr from 'vite-plugin-ssr/plugin';

export default defineConfig({
  plugins: [ssr(), vercel()],
});
```

### Usage with vite-plugin-ssr

[vite-plugin-ssr](https://vite-plugin-ssr.com/) is supported through [@magne4000/vite-plugin-vercel-ssr](/packages/vite-plugin-ssr/README.md) plugin.

Install `@magne4000/vite-plugin-vercel-ssr` package, and update your vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import ssr from 'vite-plugin-ssr/plugin';
import vercel from 'vite-plugin-vercel';
import vercelSsr from '@magne4000/vite-plugin-vercel-ssr';

export default defineConfig(async ({ command, mode }) => {
  return {
    plugins: [ssr(), vercel(), vercelSsr()],
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
