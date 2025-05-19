# vite-plugin-vercel

## 9.0.6-beta.1

### Patch Changes

- use urlOriginal and headersOriginal
- Updated dependencies
  - @vite-plugin-vercel/vike@9.0.5-beta.1

## 9.0.6-beta.0

### Patch Changes

- 4efb81e: wip
- Updated dependencies [4efb81e]
  - @vite-plugin-vercel/vike@9.0.5-beta.0

## 9.0.5

### Patch Changes

- Updated dependencies
  - @vite-plugin-vercel/vike@9.0.4

## 9.0.4

### Patch Changes

- Update peerDependencies to include Vite6
- Updated dependencies
  - @vite-plugin-vercel/vike@9.0.3

## 9.0.3

### Patch Changes

- fix: pass endpoint buildOptions to esbuild

## 9.0.2

### Patch Changes

- Upgrade dependencies
- fix CVE-2024-45296. See https://github.com/advisories/GHSA-9wv6-86v2-598j
- Updated dependencies
- Updated dependencies
  - @vite-plugin-vercel/vike@9.0.2

## 9.0.1

### Patch Changes

- feat: Vike now support headers in +config.ts
- Updated dependencies
  - @vite-plugin-vercel/vike@9.0.1

## 9.0.0

### Minor Changes

- feat(vike): support edge config in +config.ts file

### Patch Changes

- Updated dependencies
  - @vite-plugin-vercel/vike@9.0.0

## 8.0.1

### Patch Changes

- avoid double build of additionnal endpoint
- Updated dependencies
  - @vite-plugin-vercel/vike@8.0.1

## 8.0.0

### Minor Changes

- Target node@18 by default

### Patch Changes

- Updated dependencies
  - @vite-plugin-vercel/vike@8.0.0

## 7.0.2

### Patch Changes

- Explicitely export types
  - @vite-plugin-vercel/vike@7.0.1

## 7.0.1

### Patch Changes

- Better support for servers like express
- Updated dependencies
  - @vite-plugin-vercel/vike@7.0.1

## 7.0.0

### Patch Changes

- Updated dependencies
  - @vite-plugin-vercel/vike@7.0.0

## 6.0.1

### Patch Changes

- Update target to es2022
- Updated dependencies
  - @vite-plugin-vercel/vike@6.0.1

## 6.0.0

### Patch Changes

- add support for supportsResponseStreaming
- Updated dependencies
  - @vite-plugin-vercel/vike@6.0.0

## 5.0.5

### Patch Changes

- Fix warning when trying to read exports
- Updated dependencies
  - @vite-plugin-vercel/vike@5.0.3

## 5.0.4

### Patch Changes

- Replace workspace-root by @manypkg/find-root
  - @vite-plugin-vercel/vike@5.0.2

## 5.0.3

### Patch Changes

- Avoid potential url and path module conflict
  - @vite-plugin-vercel/vike@5.0.2

## 5.0.2

### Patch Changes

- Updated dependencies
  - @vite-plugin-vercel/vike@5.0.2

## 5.0.1

### Patch Changes

- Updated dependencies
  - @vite-plugin-vercel/vike@5.0.1

## 5.0.0

### Major Changes

- Always target ESM by default

### Patch Changes

- @vite-plugin-vercel/vike@5.0.0

## 4.0.2

### Patch Changes

- Upgrade dependencies
- Updated dependencies
  - @vite-plugin-vercel/vike@4.0.2

## 4.0.1

### Patch Changes

- Fix cleanup order
- Updated dependencies
  - @vite-plugin-vercel/vike@4.0.1

## 4.0.0

### Minor Changes

- Handle API endpoints with brackets

### Patch Changes

- @vite-plugin-vercel/vike@4.0.0

## 3.0.2

### Patch Changes

- Add support for static vite builds
  - @vite-plugin-vercel/vike@3.0.1

## 3.0.1

### Patch Changes

- 8e7cad4: Add vite@5 in peerDependencies
- Updated dependencies [8e7cad4]
  - @vite-plugin-vercel/vike@3.0.1

## 3.0.0

### Major Changes

- ec8dcba: - Target node20.x
  - Upgrade all dependencies to their latest versions
  - Drops support for vike non-v1 design (still works with v2)

### Patch Changes

- Updated dependencies [ec8dcba]
  - @vite-plugin-vercel/vike@3.0.0

## 2.0.1

### Patch Changes

- fix: warn instead of crash in case parsing fails
  - @vite-plugin-vercel/vike@2.0.0

## 2.0.0

### Minor Changes

- Respect configured node version

### Patch Changes

- @vite-plugin-vercel/vike@2.0.0

## 1.0.0

### Minor Changes

- Ability to exports configs directly from endpoints

### Patch Changes

- @vite-plugin-vercel/vike@1.0.0

## 0.3.7

### Patch Changes

- Upgrade dependencies
- Updated dependencies
  - @vite-plugin-vercel/vike@0.4.2

## 0.3.6

### Patch Changes

- chore: remove esbuild verbose warnings
- Updated dependencies
  - @vite-plugin-vercel/vike@0.4.1

## 0.3.5

### Patch Changes

- fix: ensure output folder is created
  - @vite-plugin-vercel/vike@0.4.0

## 0.3.4

### Patch Changes

- Rename vite-plugin-vercel to Vike
- Updated dependencies
  - @vite-plugin-vercel/vike@0.4.0

## 0.3.3

### Patch Changes

- Adds support for @vercel/og
  - @vite-plugin-vercel/vike@0.3.3

## 0.3.2

### Patch Changes

- Add support for vike V1 design
- Updated dependencies
  - @vite-plugin-vercel/vike@0.3.3

## 0.3.1

### Patch Changes

- update dependencies
- Updated dependencies
  - @vite-plugin-vercel/vike@0.3.2

## 0.3.0

### Minor Changes

- Rename Vike integration plugin to @vite-plugin-vercel/vike

### Patch Changes

- Updated dependencies
  - @vite-plugin-vercel/vike@0.3.1

## 0.2.2

### Patch Changes

- Update documentation and upgrade dependencies

## 0.2.1

### Patch Changes

- fix use case without vike

## 0.2.0

### Minor Changes

- upgrade dependencies

### Patch Changes

- support edge-light target

## 0.1.7

### Patch Changes

- fix issue with win32 path

## 0.1.6

### Patch Changes

- Upgrade dependencies. Fixes #9 and #10

## 0.1.5

### Patch Changes

- Edge Functions support

## 0.1.4

### Patch Changes

- Support for vite@3

## 0.1.3

### Patch Changes

- Support rewrites/redirects options (prefered over config.routes)

## 0.1.2

### Patch Changes

- Truncate user provided static html files

## 0.1.1

### Patch Changes

- Create a dedicated package for vike integration

## 0.1.0

### Minor Changes

- Vercel API v3 beta release with ISR support fix

## 0.0.7

### Patch Changes

- remove references to API v2

## 0.0.6

### Patch Changes

- change target of serverless function back to cjs

## 0.0.5

### Patch Changes

- initial beta release for v3 Vercel API
