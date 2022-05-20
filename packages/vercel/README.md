# vite-plugin-vercel

This is a **Work In Progress** Vercel adapter for [`vite`](https://vitejs.dev/).

## Usage

Install as a dev dependency and add it to your Vite config like this:

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

First copy [prerender](../../prerender) folder to the root of your project.
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
