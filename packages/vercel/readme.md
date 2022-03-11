# vite-plugin-vercel

This is a wip Vercel adapter for [`vite`](https://vitejs.dev/).

## Usage

Install as a dev dependency and add it to your Vite config like this:

```ts
import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';
import ssr from 'vite-plugin-ssr';

export default defineConfig({
  plugins: [
    ssr(),
    vercel({
      dynamicRoutes: [
        {
          ssr: true,
          page: '/ssr',
          regex: '/((?!assets/)(?!api/).*)',
        },
      ],
    }),
  ],
});
```
