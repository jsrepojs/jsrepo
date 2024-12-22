# jsrepo

## 1.22.2

### Patch Changes

- 6a6e84d: Provider support **Azure Devops** 🎉

## 1.22.1

### Patch Changes

- 25f9d47: `*.(sass|scss)` support 🎉
- 25f9d47: `*.html` support 🎉

## 1.22.0

### Minor Changes

- 416dfdc: Revert 75b15a6: Remove `.svelte` from block names when the block is a file that ends with `.svelte.(js|ts)`.

## 1.21.0

### Minor Changes

- 75b15a6: Remove `.svelte` from block names when the block is a file that ends with `.svelte.(js|ts)`.

### Patch Changes

- 93831d3: `*.css` file support.
- 93831d3: `*.jsonc` file support.

## 1.20.1

### Patch Changes

- 87d1f63: Resolve modules from re-exports in `*.svelte` and `*.(js|ts|jsx|tsx)` files.

## 1.20.0

### Minor Changes

- 2180952: Add `listBlocks` and `listCategories` keys to build config.

## 1.19.5

### Patch Changes

- 998b27b: ensure `build` returns the error when the extended tsconfig doesn't exist.
- 998b27b: fix stack overflow when checking for circular dependencies.

## 1.19.4

### Patch Changes

- e542460: Bump deps

## 1.19.3

### Patch Changes

- 964732c: Fixes an issue where `-y, --yes` flag would not skip the _zero-config_ confirmation prompt.
- 964732c: Fixes an issue where you would be prompted for the directory to place the same category multiple times dependending on which blocks you were installing with _zero-config_.

## 1.19.2

### Patch Changes

- 6c16a63: ensure `<script module>` dependencies are parsed in `*.svelte` files.

## 1.19.1

### Patch Changes

- d547f92: Do not list unlisted blocks on `update` command.
- d547f92: Fix `no-framework-dependency` rule so that it detects dependencies with a pinned version.

## 1.19.0

### Minor Changes

- 8481dc8: Add `excludeBlocks` and `excludeCategories` keys to `build` config.

### Patch Changes

- ad5bfea: Add `no-framework-dependency` rule so that registry authors are warned if they forget to exclude framework dependencies.

## 1.18.2

### Patch Changes

- 5c7fdd6: Remember `zero-config` settings for each directory and suggest the previously selected config as the default value for each prompt next time jsrepo is run.

## 1.18.1

### Patch Changes

- 32e9db4: Add the ability to specify a path for each category when adding without a config.

## 1.18.0

### Minor Changes

- cb31617: Add `preview` `build` option so that you can see what users will see when running the `add` command.

### Patch Changes

- cb31617: Prune unused blocks (Not listed and not a dependency of another block).
- cb31617: Add `no-unused-block` rule to warn users of blocks that will be pruned.

## 1.17.6

### Patch Changes

- ec8b55b: Add an `overwrite-all` prompt to the `add` command.

## 1.17.5

### Patch Changes

- 92a8599: Add formatter prompt to zero-config adds.

## 1.17.4

### Patch Changes

- 5dc8946: Prevent crashing because of a circular dependency.

## 1.17.3

### Patch Changes

- 1e26a7a: Add `no-circular-dependency` rule to catch circular dependencies early on.

## 1.17.2

### Patch Changes

- ac88b35: Fix incorrect schema being applied during registry `init`.

## 1.17.1

### Patch Changes

- e031016: Ensure user provides a `dirs` value in registry init.

## 1.17.0

### Minor Changes

- 12e7b8b: Remove `output` and `errorOnWarn` keys from `jsrepo-build-config.json` as they are both useless now.
- 12e7b8b: Add `rules` key to `jsrepo-build-config.json` to allow you to configure rules when checking the manifest after build.

## 1.16.6

### Patch Changes

- 7e00daf: Fix `--do-not-list` flags.

## 1.16.5

### Patch Changes

- 7218997: When running `add` blocks are now fetched concurrently.

## 1.16.4

### Patch Changes

- e4363f2: Fixes issue where configuring paths was required when adding a repo on `init`.
- 83ac4e6: Improve performance when resolving an excessive amount of blocks at once.

## 1.16.3

### Patch Changes

- 69d84aa: Imports like `$lib/assets/icons` that end up resolving to the category root will not resolve to `$lib/assets/icons/index` as is the expected behavior with JS.
- 69d84aa: `*.svg` support.

## 1.16.2

### Patch Changes

- 3728010: When adding a new repo with `init` and configuring paths, paths that already had a value will default to that value.

## 1.16.1

### Patch Changes

- 836645b: Fixes issue where custom paths were overwritten when running `init` for a second time.

## 1.16.0

### Minor Changes

- 147c18d: Add `do-not-list-blocks` and `do-not-list-categories` options to `build` to allow for hiding specific blocks from users in the `add` command.
- 147c18d: Add `jsrepo-build-config.json` file allowing an easier time configuring build options.

### Patch Changes

- 0169655: Fix issue where `resolveTree` could end up in an infinite loop under the right conditions.

## 1.15.1

### Patch Changes

- 9f30e28: When running `init` if you choose to use a formatter your `jsrepo.json` file will be formatted using that formatter.
- 9f30e28: Add `*.json` support.

## 1.15.0

### Minor Changes

- ea802f9: BREAKING: Enable mapping of categories to directories in your project.

## 1.14.1

### Patch Changes

- 20314c1: Auto detect default branch on **GitLab** and **BitBucket**.

## 1.14.0

### Minor Changes

- e54ae5f: Add support for path aliases 🎉

## 1.13.3

### Patch Changes

- 80070c5: Minify output for reduced package size.

## 1.13.2

### Patch Changes

- 3a95769: Improve package README
- 3a95769: Remove unnecessary use of bin.mjs.
- 3a95769: Only include `./dist` and `schema.json` in package now.

## 1.13.1

### Patch Changes

- 0ec0d11: Fix a few things with logging
- 0ec0d11: Show `<category>/<block>` when asking if users would like to overwrite a block.
- 0ec0d11: Ensure `vitest` is only included as a devDependency if the block includes tests.
- 0ec0d11: Use `<category>/<name>` as the key when resolving blocks to improve consistency.

## 1.13.0

### Minor Changes

- 7d6d5d4: Use `node-fetch` instead of fetch to prevent infinite hanging behavior in some environments.

### Patch Changes

- 8bb4da8: More logging

## 1.12.8

### Patch Changes

- 86949c9: More logging

## 1.12.7

### Patch Changes

- 1638603: Request logging for add.

## 1.12.6

### Patch Changes

- 5c322a5: More verbose logging.

## 1.12.5

### Patch Changes

- 954a2a4: More logging for `--verbose` option on `add` command.

## 1.12.4

### Patch Changes

- 54e4721: `github` provider will now detect default branch if a branch is not supplied.

## 1.12.3

### Patch Changes

- b976ea0: Improved error message when failing to fetch manifest file with some troubleshooting steps.

## 1.12.2

### Patch Changes

- 5d14390: Fix issue where `build` could create circular dependencies.

## 1.12.1

### Patch Changes

- 9b4dafb: Fixes an issue where new files would not be created in update command.

## 1.12.0

### Minor Changes

- 8830cd9: Fixes issue with building files that reference a file from another block directory.

## 1.11.0

### Minor Changes

- 2f49635: Added `formatter` key to config to allow you to format `blocks` before adding them to your project.

### Patch Changes

- 7a760b0: Fix `*.(yml|yaml)` watermark to only have a single space between the `#` and comment content.
- 2f49635: Fix issue where vue compiler error would not show during build.

## 1.10.2

### Patch Changes

- 282b15c: Checks package.json for dependencies before trying to install the same dependency on `update` and `add`.

## 1.10.1

### Patch Changes

- 722dd80: Add no longer prompts for options for every block when using zero-config.
- 722dd80: Add `*.(yml|yaml)` support

## 1.10.0

### Minor Changes

- 2f5d566: BitBucket support 🎉

## 1.9.0

### Minor Changes

- 6d15a77: GitLab support 🎉

## 1.8.0

### Minor Changes

- 7b37835: Allow for zero-config adds where users will be prompted for the options necessary to install the `block`.

### Patch Changes

- 7b37835: Make `auth --logout` smarter so that it shows you if you were already logged out.

## 1.7.1

### Patch Changes

- 9cef7ca: Moves check for `package.json` to the top of `init --registry`

## 1.7.0

### Minor Changes

- 65216c4: Add `auth` command to allow you to supply a token for private repositories.
- 65216c4: Private repository support 🎉
- 65216c4: Add prompts to `init` to allow you to supply a token when setting up repositories.

## 1.6.0

### Minor Changes

- caff9cc: Add `--include-blocks` and `--include-categories` flags to `build` command. These allow you to only include the provided blocks or categories in the build.
- fd66b24: Add `error-on-warn` flag so that you can choose to error on warnings during build.
- e408c46: jsrepo now checks the manifest file before writing it to warn about potential issues.

## 1.5.0

### Minor Changes

- 5ac4967: Improves onboarding experience by adding a `registry` option when running `init`.

### Patch Changes

- 5ac4967: Fixed an issue where detect wasn't using the correct cwd in some cases.
- c3cd417: Fixed an issue where subdirectories of a subdirectory would give a unhelpful warning.

## 1.4.2

### Patch Changes

- fb39985: Bump deps.

## 1.4.1

### Patch Changes

- 5b83b5b: Use `pathe` instead of `node:path`.

## 1.4.0

### Minor Changes

- fb29892: **vue** support! 🎉
- 48a17aa: Add `--exclude-deps` flag to `build`. This allows you to prevent certain dependencies from being added during the build.

### Patch Changes

- 48a17aa: When `*.svelte` files import 'svelte' it will not longer result in `svelte` being added as a dependency.

## 1.3.1

### Patch Changes

- 6a531fc: Fix arg ordering for test command.

## 1.3.0

### Minor Changes

- 3d4d754: Add `update` command. `update` allows you to update components with a nice ui for seeing the differences.

## 1.2.4

### Patch Changes

- 31921ab: Fixes line numbers on `diff` command. Previously there were issues when there were changes that add or removed multiple lines of whitespace now they are fixed.
- 7bb7084: Adds different coloring for single line changes to make them more discernable in `diff`.

## 1.2.3

### Patch Changes

- 909d942: Fixed an issue where block subdeps would be added twice.

## 1.2.2

### Patch Changes

- bb07833: No noteworthy changes.

## 1.2.1

### Patch Changes

- b1dee7f: Remove `npx jsrepo` from error message when no config is provided.

## 1.2.0

### Minor Changes

- dce42bb: Add `--cwd <path>` option to all CLI commands.

## 1.1.0

### Minor Changes

- 2ad43fe: fix `add` command issue where package sub dependencies weren't added.

### Patch Changes

- b0b8edb: Fixed an issuew where the tasks showed an incomplete specifier when saying `Added <x>`.

## 1.0.3

### Patch Changes

- 81842c1: `add` now gets blocks from remote specified source even if you have repo paths.
- 81842c1: `add` command now asks before installing code from remote repositories supplied in block specifiers.

## 1.0.2

### Patch Changes

- 3097380: `build` command can now add dependencies with complex paths such as `lucide-svelte/icons/moon`.

## 1.0.1

### Patch Changes

- f69a155: Change to monorepo structure.
- 39cf37b: - Update --help docs.
- 39cf37b: - Update output files to `jsrepo.json` and `jsrepo-manifest.json`.
