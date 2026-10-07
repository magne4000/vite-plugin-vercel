---
"vite-plugin-vercel": minor
---

feat: routes follow the rou3 v0.12+ (1.x) syntax used by `@universal-deploy/store` 0.3 and `@universal-deploy/vite` 0.2 (convert-route 2). A `*` in a route matches several segments in the generated rewrites (`/foo/*` gives `/foo/:_1*`), like the universal-deploy catch-all router, and an optional catch-all API file (`[[...slug]]`) keeps its param name (`/api/:slug*` instead of `/api/**`)
