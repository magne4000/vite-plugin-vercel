# @vite-plugin-vercel/vike

## 9.0.6

### MINOR BREAKING CHANGES

- Update Vike to `0.4.229` or above.

## 9.0.5

### Patch Changes

- 3f3dd9c: fix(vike): do not show route function warnings for non route function
- 3f3dd9c: fix(vike): streaming error in \_error pages

## 9.0.4

### Patch Changes

- Improve compatibility with latest Vike versions

## 9.0.3

### Patch Changes

- Update peerDependencies to include Vite6

## 9.0.2

### Patch Changes

- Upgrade dependencies
- fix CVE-2024-45296. See https://github.com/advisories/GHSA-9wv6-86v2-598j

## 9.0.1

### Patch Changes

- feat: Vike now support headers in +config.ts

## 9.0.0

### Minor Changes

- feat(vike): support edge config in +config.ts file

### Patch Changes

- Updated dependencies
  - vite-plugin-vercel@9.0.0

## 8.0.1

### Patch Changes

- avoid double build of additionnal endpoint
- Updated dependencies
  - vite-plugin-vercel@8.0.1

## 8.0.0

### Minor Changes

- Target node@18 by default

### Patch Changes

- Updated dependencies
  - vite-plugin-vercel@8.0.0

## 7.0.1

### Patch Changes

- Better support for servers like express
- Updated dependencies
  - vite-plugin-vercel@7.0.1

## 7.0.0

### Minor Changes

- Support for vike@0.4.172

### Patch Changes

- vite-plugin-vercel@7.0.0

## 6.0.1

### Patch Changes

- Update target to es2022
- Updated dependencies
  - vite-plugin-vercel@6.0.1

## 6.0.0

### Minor Changes

- add support for supportsResponseStreaming

### Patch Changes

- Updated dependencies
  - vite-plugin-vercel@6.0.0

## 5.0.3

### Patch Changes

- Fix warning when trying to read exports
- Updated dependencies
  - vite-plugin-vercel@5.0.5

## 5.0.2

### Patch Changes

- Update minimum peer dependency
  - vite-plugin-vercel@5.0.2

## 5.0.1

### Patch Changes

- Migrate to last recommendations
  - vite-plugin-vercel@5.0.1

## 5.0.0

### Patch Changes

- Updated dependencies
  - vite-plugin-vercel@5.0.0

## 4.0.2

### Patch Changes

- Upgrade dependencies
- Updated dependencies
  - vite-plugin-vercel@4.0.2

## 4.0.1

### Patch Changes

- Fix **VITE_ASSETS_MAP** error
- Updated dependencies
  - vite-plugin-vercel@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies
  - vite-plugin-vercel@4.0.0

## 3.0.1

### Patch Changes

- 8e7cad4: Add vite@5 in peerDependencies
- Updated dependencies [8e7cad4]
  - vite-plugin-vercel@3.0.1

## 3.0.0

### Major Changes

- ec8dcba: - Target node20.x
  - Upgrade all dependencies to their latest versions
  - Drops support for vike non-v1 design (still works with v2)

### Patch Changes

- Updated dependencies [ec8dcba]
  - vite-plugin-vercel@3.0.0

## 2.0.0

### Patch Changes

- Updated dependencies
  - vite-plugin-vercel@2.0.0

## 1.0.0

### Patch Changes

- Updated dependencies
  - vite-plugin-vercel@1.0.0

## 0.4.2

### Patch Changes

- Upgrade dependencies
- Updated dependencies
  - vite-plugin-vercel@0.3.7

## 0.4.1

### Patch Changes

- chore: remove esbuild verbose warnings
- Updated dependencies
  - vite-plugin-vercel@0.3.6

## 0.4.0

### Minor Changes

- Rename vite-plugin-vercel to Vike

## 0.3.3

### Patch Changes

- Add support for vike V1 design

## 0.3.2

### Patch Changes

- update dependencies

## 0.3.1

### Patch Changes

- Rename Vike integration plugin to @vite-plugin-vercel/vike

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

## 0.1.5

### Patch Changes

- fix issue with win32 path

## 0.1.4

### Patch Changes

- Upgrade dependencies. Fixes #9 and #10

## 0.1.3

### Patch Changes

- Edge Functions support

## 0.1.2

### Patch Changes

- Fix exports

## 0.1.1

### Patch Changes

- Add missing helper file in bundle

## 0.1.0

### Minor Changes

- Support for vike@0.4.x

### Patch Changes

- Support for vite@3

## 0.0.9

### Patch Changes

- Fix duplicate route entries

## 0.0.8

### Patch Changes

- Support rewrites/redirects options (prefered over config.routes)

## 0.0.7

### Patch Changes

- Change config syntax

## 0.0.6

### Patch Changes

- Default SSR route excludes /api

## 0.0.5

### Patch Changes

- isr config can now be overriden when using vike integration

## 0.0.4

### Patch Changes

- Include templates folder

## 0.0.3

### Patch Changes

- Update package.json metadata

## 0.0.2

### Patch Changes

- Create a dedicated package for vike integration
