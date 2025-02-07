# vite-plugin-vercel

> [!WARNING]
> :construction: Work In Progress
> 
> You are on the [Vite Environment API](https://vite.dev/guide/api-environment.html#environment-configuration) development branch. Check out [v9 branch](https://github.com/magne4000/vite-plugin-vercel/tree/v9) current stable version.

Vercel adapter for [Vite 6](https://vitejs.dev/).

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
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

export default defineConfig({
  plugins: [vercel({
    entries: [
      ...(await getEntriesFromFs("_api", {
        // Auto mapping examples:
        //   _api/page.ts -> /api/page
        //   _api/post.ts -> /api/post
        //   _api/name/[name].ts -> /api/name/*
        destination: "api",
      }))
    ]
  })],
});
```

> [!NOTE]
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

### Edge middleware

You can use [Edge middleware as describe in the official documentation](https://vercel.com/docs/functions/edge-middleware/middleware-api) (i.e. with a `middleware.ts` file at the root of your project).

## FAQ

### What does ISR do in dev mode?
Nothing. It's a production-only feature

### What does `edge: true` target do in dev mode?
Nothing (yet?). If you have a use-case where an actual Edge runtime would be necessary in dev, please open a discussion

### I don't see Vercel specific headers in dev mode
This is not yet supported. Please open an issue if you need this (PR welcome).

Related documentation: https://vercel.com/docs/edge-network/headers/request-headers

## Migration from v9

TODO
