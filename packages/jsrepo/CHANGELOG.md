# jsrepo

## 3.0.0-beta.13
### Patch Changes


- fix: make peer deps less agressive ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: ensure dev dependencies are added ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.12
### Patch Changes


- fix: Fixed an issue where files with multiple dots i.e. foo.bar.ts were not resolved correctly ([#659](https://github.com/jsrepojs/jsrepo/pull/659))

## 3.0.0-beta.11
### Patch Changes


- fix: Ensure registry dependencies exist ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.10
### Patch Changes


- fix: Create config at `.mts` only if `type: "module"` is not set in package.json ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.9
### Patch Changes


- fix: Add `docsLink` to `NoOutputsError` ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.8
### Patch Changes


- shadcn-compat: add `title` to registry items config ([#653](https://github.com/jsrepojs/jsrepo/pull/653))

## 3.0.0-beta.7
### Patch Changes


- update `transform` api to allow for renaming files ([#651](https://github.com/jsrepojs/jsrepo/pull/651))

## 3.0.0-beta.6
### Patch Changes


- fix: Exit with the correct code for `publish` and `build` commands ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.5
### Patch Changes


- feat: add `optionally-on-init` add option ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.4
### Patch Changes


- feat: remove `registry:` prefix from item types ([#645](https://github.com/jsrepojs/jsrepo/pull/645))


- feat: `publish` command ([#645](https://github.com/jsrepojs/jsrepo/pull/645))


- breaking: rename `contents` -> `content` for shadcn compatibility ([#645](https://github.com/jsrepojs/jsrepo/pull/645))


- breaking: Rename `remoteDependencies` -> `dependencies` and `devDependencies` for improved shadcn compatibility ([#645](https://github.com/jsrepojs/jsrepo/pull/645))


- feat: `publish` command ([#645](https://github.com/jsrepojs/jsrepo/pull/645))

## 3.0.0-beta.3
### Patch Changes


- fix: ensure token is provided to fetch methods ([#643](https://github.com/jsrepojs/jsrepo/pull/643))


- fix: Improve error message when registry item cannot be found ([#643](https://github.com/jsrepojs/jsrepo/pull/643))

## 3.0.0-beta.2
### Patch Changes


- fix: Remove zod reliance for exported types ([#641](https://github.com/jsrepojs/jsrepo/pull/641))


- chore: bump deps ([#641](https://github.com/jsrepojs/jsrepo/pull/641))

## 3.0.0-beta.1
### Patch Changes


- fix: make `svelte` and `vue` optional peer dependencies ([#640](https://github.com/jsrepojs/jsrepo/pull/640))


- Fix bundling issues ([#640](https://github.com/jsrepojs/jsrepo/pull/640))


- breaking: Rename manifest file from `jsrepo.json` -> `registry.json` ([#637](https://github.com/jsrepojs/jsrepo/pull/637))

## 3.0.0-beta.0
### Patch Changes


- v3 initial beta release ([#635](https://github.com/jsrepojs/jsrepo/pull/635))
