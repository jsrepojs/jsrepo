# jsrepo

## 3.0.6
### Patch Changes


- fix: Ensure circular dependencies are handled correctly when adding ([#708](https://github.com/jsrepojs/jsrepo/pull/708))

## 3.0.5
### Patch Changes


- fix: only show updates when there are updates ([#703](https://github.com/jsrepojs/jsrepo/pull/703))


- fix: normalize file type when getting the path ([#703](https://github.com/jsrepojs/jsrepo/pull/703))


- feat: show the names of skipped dependencies ([#703](https://github.com/jsrepojs/jsrepo/pull/703))

## 3.0.4
### Patch Changes


- fix: Ensure items in repository mode are fetched with the `relativePath` ([#701](https://github.com/jsrepojs/jsrepo/pull/701))

## 3.0.3
### Patch Changes


- fix: Ensure that `config mcp` writes the correct file ([`ccbab08`](https://github.com/jsrepojs/jsrepo/commit/ccbab0840fc4fdf103e1cbab0d7edd9a18c43cc0))

## 3.0.2
### Patch Changes


- fix: ensure paths are resolved correctly ([#697](https://github.com/jsrepojs/jsrepo/pull/697))


- fix: Ensure the user selects at least one option in the add command multiselect ([#697](https://github.com/jsrepojs/jsrepo/pull/697))

## 3.0.1
### Patch Changes


- fix: Ensure that the correct package is installed on config commands ([`218b395`](https://github.com/jsrepojs/jsrepo/commit/218b39550e8a338bb4b792b1384a018563da8dad))

## 3.0.0
### Patch Changes


- v3 initial beta release ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: remove `registry:` prefix from item types ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: add `meta` prop to registry items ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: ensure token is provided to fetch methods ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Remove zod reliance for exported types ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: allow for searching components in list when running `add` command without a specific item ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Improve robustness of builds with value optional instead of key optional and better tests ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: peer deps ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Ensure that paths are updated when running add/update commands ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Fix add type ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: make `svelte` and `vue` optional peer dependencies ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Skip and warn the user for dynamic imports with unresolvable syntax ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: `publish` command ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Add `docsLink` to `NoOutputsError` ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: ensure dependencies are properly installed ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Fixed an issue where when initializing a registry paths would be unnecessarily added to the config ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: improve error formatting ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- Fix error message stacking in manifest fetch errors. Removes redundant "Error fetching" prefixes to improve readability of error messages. ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- chore: bump deps ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: add `categories` prop to registry items ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: ensure vscode configuration is correct ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Create config at `.mts` only if `type: "module"` is not set in package.json ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: add `optionally-on-init` add option ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: ensure dependencies are still installed even if file content is the same ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- update `transform` api to allow for renaming files ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- breaking: rename `contents` -> `content` for shadcn compatibility ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: transform imports from shadcn registries ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: make peer deps less agressive ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Fixed an issue where files with multiple dots i.e. foo.bar.ts were not resolved correctly ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- breaking: Rename `remoteDependencies` -> `dependencies` and `devDependencies` for improved shadcn compatibility ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: ensure dev dependencies are added ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: `config mcp` support for google antigravity ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- Fix bundling issues ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Improve error message when registry item cannot be found ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- shadcn-compat: add `title` to registry items config ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Improve errors for invalid imports. ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Ensure items are added to the correct paths in the users project ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Exit with the correct code for `publish` and `build` commands ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: `publish` command ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Ensure registry dependencies exist ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: false positive for unresolvable syntax when dynamic imports are backquoted but the template is unused ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: Prevent duplicate dependencies in build result ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: add support for `index` items ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- refactor the way that files are added to users projects ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- breaking: Rename manifest file from `jsrepo.json` -> `registry.json` ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.29
### Patch Changes


- fix: Ensure that paths are updated when running add/update commands ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.28
### Patch Changes


- fix: Fix add type ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.27
### Patch Changes


- fix: ensure vscode configuration is correct ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.26
### Patch Changes


- Fix error message stacking in manifest fetch errors. Removes redundant "Error fetching" prefixes to improve readability of error messages. ([#686](https://github.com/jsrepojs/jsrepo/pull/686))

## 3.0.0-beta.25
### Patch Changes


- feat: transform imports from shadcn registries ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: `config mcp` support for google antigravity ([#682](https://github.com/jsrepojs/jsrepo/pull/682))

## 3.0.0-beta.24
### Patch Changes


- fix: Fixed an issue where when initializing a registry paths would be unnecessarily added to the config ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- fix: improve error formatting ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: add support for `index` items ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

## 3.0.0-beta.23
### Patch Changes


- feat: add `meta` prop to registry items ([#634](https://github.com/jsrepojs/jsrepo/pull/634))


- feat: add `categories` prop to registry items ([#634](https://github.com/jsrepojs/jsrepo/pull/634))

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
