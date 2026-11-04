---
'@jsrepo/shadcn': minor
'@jsrepo/bun': minor
'@jsrepo/pnpm': minor
'@jsrepo/transform-biome': minor
'@jsrepo/transform-filecasing': minor
'@jsrepo/transform-javascript': minor
'@jsrepo/transform-oxfmt': minor
'@jsrepo/transform-prettier': minor
---

feat: the default export is now a jsrepo plugin that can be added to the `plugins` array of your config. The default exports of `@jsrepo/shadcn` and the transform packages still work with the legacy `providers`/`transforms` options, and the named `pnpm` and `bun` exports still work with `build.remoteDependencyResolver`.
