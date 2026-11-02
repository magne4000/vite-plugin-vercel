---
"vite-plugin-vercel": minor
---

feat: upgrade `@vercel/build-utils` to v15. Serverless functions now default to the Node.js 26 runtime (`nodejs26.x`), also when `engines.node` in `package.json` is a broad range such as `>=20`. Set `engines.node` to `24.x` to stay on Node.js 24.
