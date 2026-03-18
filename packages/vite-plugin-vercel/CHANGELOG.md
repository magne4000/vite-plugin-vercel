# vite-plugin-vercel

## 11.0.2

### Patch Changes

- d6239c5: feat: new routes.transforms property
- Updated dependencies [d6239c5]
  - @vite-plugin-vercel/schemas@1.1.0

## 11.0.1

### Patch Changes

- ae7ece7: fix: upgrade dependencies

## 11.0.0

### Major Changes

- 5491975: feat!: support `{ fetch }` server entries

  This version introduces several breaking changes to better align with the latest Vercel and Vite standards. Key changes include:

  - Support for `{ fetch }` server entries, replacing the old handler format.
  - Mandatory explicit entry declaration via `getVercelEntries()` or similar.
  - Plugin options now directly handle `rewrites`, `headers`, `redirects`, and other Vercel configuration.

  Please refer to the [MIGRATION.md](./MIGRATION.md) document for detailed instructions on how to upgrade from v9 to v11.

## 11.0.0-beta.2

### Major Changes

- e64efc0: feat!: support `{ fetch }` server entries

## 11.0.0-beta.1

### Major Changes

- e64efc0: feat!: support `{ fetch }` server entries

## 11.0.0-beta.0

### Major Changes

- e64efc0: feat!: support `{ fetch }` server entries
