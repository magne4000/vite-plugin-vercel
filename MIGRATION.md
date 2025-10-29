## v9 to v10

### 1) Update dependencies
- Install the latest `vite-plugin-vercel`.
- Ensure Vite is 7+ (Environment API). Older Vite versions used in v9 are not supported on this branch.

### 2) Declare entries explicitly (recommended)
In v9 you could rely on the conventional `/api` folder or custom mappings. In v10 you can still keep `/api`, but it’s recommended to move your handlers to a custom folder and declare them via `getEntriesFromFs()` so you fully control the mapping.

Example migration:

v9 (typical):
```ts
// vite.config.ts (v9)
import { defineConfig } from 'vite'
import vercel from 'vite-plugin-vercel'

export default defineConfig({
  plugins: [vercel()], // relied on /api or framework mapping
})
```

v10 (recommended):
```ts
// vite.config.ts (v10)
import { defineConfig } from 'vite'
import vercel from 'vite-plugin-vercel'
import { getEntriesFromFs } from 'vite-plugin-vercel/utils'

const entries = await getEntriesFromFs('endpoints/api', {
  // Auto mapping examples:
  //   endpoints/api/page.ts -> /api/page
  //   endpoints/api/name/[name].ts -> /api/name/*
  destination: 'api',
})

export default defineConfig({
  plugins: [vercel({ entries })],
})
```

> [!NOTE]
> `@vercel/build` currently forces building files under `/api`. To avoid unintended builds, prefer using a different folder (like `endpoints/api`) and map it via `getEntriesFromFs`.

### 3) Project configuration in plugin options
If you configured `rewrites`, `headers`, `redirects`, `cleanUrls`, or `trailingSlash` in v9 (either via plugin options or `vercel.json`), define them in the plugin options in v10:
```ts
vercel({
  rewrites: [{ source: '/about', destination: '/about-our-company.html' }],
  headers: [{ source: '/service-worker.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] }],
  redirects: [{ source: '/me', destination: '/profile.html', permanent: false }],
  cleanUrls: true,
  trailingSlash: true,
})
```
