# jsrepo

## 3.0.0-beta.22
### Patch Changes


- fix: Ensure items are added to the correct paths in the users project ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.21
### Patch Changes


- feat: allow for searching components in list when running `add` command without a specific item ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.20
### Patch Changes


- fix: false positive for unresolvable syntax when dynamic imports are backquoted but the template is unused ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.19
### Patch Changes


- fix: Prevent duplicate dependencies in build result ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.18
### Patch Changes


- fix: peer deps ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- refactor the way that files are added to users projects ([#668](https://github.com/jsrepojs/jsrepo/pull/668))

## 3.0.0-beta.17
### Patch Changes


- fix: Skip and warn the user for dynamic imports with unresolvable syntax ([#666](https://github.com/jsrepojs/jsrepo/pull/666))


- fix: Improve errors for invalid imports. ([#666](https://github.com/jsrepojs/jsrepo/pull/666))

## 3.0.0-beta.16
### Patch Changes


- fix: Improve robustness of builds with value optional instead of key optional and better tests ([#664](https://github.com/jsrepojs/jsrepo/pull/664))

## 3.0.0-beta.15
### Patch Changes


- fix: ensure dependencies are properly installed ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.14
### Patch Changes


- fix: ensure dependencies are still installed even if file content is the same ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

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
