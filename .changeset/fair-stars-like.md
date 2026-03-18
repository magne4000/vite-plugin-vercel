---
"vite-plugin-vercel": major
---

feat!: support `{ fetch }` server entries

This version introduces several breaking changes to better align with the latest Vercel and Vite standards. Key changes include:
- Support for `{ fetch }` server entries, replacing the old handler format.
- Mandatory explicit entry declaration via `getVercelEntries()` or similar.
- Plugin options now directly handle `rewrites`, `headers`, `redirects`, and other Vercel configuration.

Please refer to the [MIGRATION.md](./MIGRATION.md) document for detailed instructions on how to upgrade from v9 to v11.
