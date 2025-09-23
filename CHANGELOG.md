# jsrepo

## 2.5.0
### Minor Changes

- 5985e18: feat: Add `includeFiles` to config to allow for serving any file type from a registry

### Patch Changes

- 5985e18: fix: Remove console.log in `build` command

## 2.4.9
### Patch Changes

- 4bc9736: fix: Ensure stale cache is cleared in `--no-cache` mode
- 4bc9736: fix: Update bitbucket default branch

## 2.4.8
### Patch Changes

- ff542fb: chore: bump deps

## 2.4.7
### Patch Changes

- 30aa663: fix: prevent out-of-memory when resolving cyclic dependency graphs
- 47f3b08: fix: Ensure watermarks are not added to plain json files

## 2.4.6
### Patch Changes

- 75ec915: fix: Resolve tsconfig references

## 2.4.5
### Patch Changes

- e010847: feat: Add optional argument to the `mcp` command to allow users to limit the mcp requests to one registry
- e010847: chore: Move mcp server code from `@modelcontextprotocol/sdk` to `tmcp`

## 2.4.4
### Patch Changes

- f8b4a55: fix: Fix a regression where users couldn't access private github repos

## 2.4.3
### Patch Changes

- 8b6eaae: fix: Ensure blocks can resolve blocks built out of a different `dir`

## 2.4.2
### Patch Changes

- 42c7972: fix: Check if an import is a path alias before checking if it's a dependency

## 2.4.1
### Patch Changes

- f1cce8b: fix: If a publish results in a `500` error guide user on where to get support.

## 2.4.0
### Minor Changes

- d13b121: feat: Optionally include documentation files (*.md, *.mdx) in registry

## 2.3.3
### Patch Changes

- b59bdc5: fix: Ignore `.DS_Store` files in build.

## 2.3.2
### Patch Changes

- 6cb32f0: feat(mcp): Optimizations and improvements

## 2.3.1
### Patch Changes

- 0b297be: feat(mcp): Tool improvements and optimizations

## 2.3.0
### Minor Changes

- de1aaca: feat: Allow registry owners to configure default paths for their users

## 2.2.2
### Patch Changes

- cde57fc: feat(mcp): Include barebones CLI reference in response of tool calls

## 2.2.1
### Patch Changes

- b0394f4: fix: Remove resources from mcp server capabilities

## 2.2.0
### Minor Changes

- b885eaf: feat: Add non-interactive path for project initialization
- b885eaf: feat: 🎉 `mcp` command

### Patch Changes

- b885eaf: feat: Generate CLI reference on new version

## 2.1.0
### Minor Changes

- 0bba0db: feat: Add `info` command.

## 2.0.4
### Patch Changes

- 7f7657e: fix: Always resolve to local dependencies to most specific path

## 2.0.3
### Patch Changes

- bbe6009: feat: Support jsrepo.com marketplace

## 2.0.2
### Patch Changes

- 06d814d: chore: remove `prettier-plugin-svelte` (unnecessary)
- 06d814d: chore: change over from `execa` to `tinyexec`

## 2.0.1
### Patch Changes

- f946ccf: chore: bump deps
- f946ccf: chore: remove octokit

## 2.0.0
### Major Changes

- 3900102: breaking: original `auth` command is now `tokens` and `auth` command is now just for jsrepo.com.
- 3900102: feat: Support jsrepo as a registry provider 🎉

### Minor Changes

- 3900102: feat: Allow for caching using `make-fetch-happen`
- 3900102: feat: Setup registry for publish on jsrepo.com during init
- 3900102: feat: Always install jsrepo as a dev dependency when initializing a new registry

## 1.47.1
### Patch Changes

- 45357a2: chore: Update `package.json` links for repo move.

## 1.47.0
### Minor Changes

- 7a0c113: fix: Update args for `add` so that config takes priority as expected

### Patch Changes

- 7a0c113: fix: ensure package with unpinned version isn't installed if already installed in the users project
- 5fd4c12: chore: housekeeping

## 1.46.2
### Patch Changes

- 0e41ca6: chore: bump deps
- 2b9f754: fix: Delete outdated state cache entries when using `--no-cache`
- 0e41ca6: fix: Fix self-hosted gitlab registries.

## 1.46.1
### Patch Changes

- 144cff5: fix: Ensure original import is quoted before replacing it in test files.

## 1.46.0
### Minor Changes

- 47d0c1c: feat: Add flags for "zero-config" adds.

### Patch Changes

- 2090485: chore: bump deps

## 1.45.3

### Patch Changes

- a5daf17: fix: Fix url parsing for gitlab self hosted on a subdomain

## 1.45.2

### Patch Changes

- cbea8cb: Bump dependencies

## 1.45.1

### Patch Changes

- 222935f: fix: Ensure that Svelte files can be formatted when using `--cwd`.

## 1.45.0

### Minor Changes

- 9153afe: feat: Enable usage of self hosted gitlab using the `gitlab:` prefix.

## 1.44.2

### Patch Changes

- e0b4b93: fix: Ensure devDependencies are installed as such.

## 1.44.1

### Patch Changes

- d148d4a: fix: Ensure token is read using registry origin.

## 1.44.0

### Minor Changes

- cecf74c: feat: Allow users to provide a token to self-hosted registries with the `Bearer` scheme.

## 1.43.0

### Minor Changes

- 1311e97: feat: Remove version and date from watermarks to simplify diffs.

## 1.42.0

### Minor Changes

- 41926d7: feat: Stability improvements for nuxt/vue

### Patch Changes

- 41926d7: chore: Remove ts-morph in favor of oxc

## 1.41.4

### Patch Changes

- 2ed3e67: feat: Update model choices for `Update with AI` --ChatGPT 4o, ChatGPT 4o-mini ++OpenAI o3-mini

## 1.41.3

### Patch Changes

- 40d81e0: chore: Bump `package-manager-detector`

## 1.41.2

### Patch Changes

- 32f5561: fix: Don't require package.json if there are no peer dependencies

## 1.41.1

### Patch Changes

- 56b0004: fix: Fix install dependencies prompt for regisry init

## 1.41.0

### Minor Changes

- 3a0af9e: feat: Update options for `Update with AI` to use Claude 3.7 Sonnet.

## 1.40.1

### Patch Changes

- f89ecdf: feat: Display logs when installing dependencies

## 1.40.0

### Minor Changes

- 3c06fe3: feat: Allow for updating existing blocks when running `add`
- 3c06fe3: perf: Improve concurrency to improve performance of `add` and `update` commands.

## 1.39.3

### Patch Changes

- f8d5dd7: chore: bump deps

## 1.39.2

### Patch Changes

- a42cebd: fix: Add more test suffixes.

## 1.39.1

### Patch Changes

- 54d1d20: api: Export type definitions for individual provider states.

## 1.39.0

### Minor Changes

- 378ba97: feat: Peer dependencies 🎉

## 1.38.0

### Minor Changes

- 239ff85: Allow for managing API tokens for Anthropic and OpenAI using the `auth` command.

## 1.37.0

### Minor Changes

- 3955aaf: feat: Dependency resolution support for css and sass 🎉

## 1.36.0

### Minor Changes

- 256456f: feat: Add `additional instructions` prompt to `✨ Update with AI ✨` to allow users to give more context to the model on how to update the file
- 256456f: feat: Add `iterate` option for `✨ Update with AI ✨` so that you can reprompt with the context of past chats and iterate on the generated file.

### Patch Changes

- 256456f: feat: Remember model choice for `✨ Update with AI ✨`

## 1.35.1

### Patch Changes

- d96f481: Improve verbose logging.

## 1.35.0

### Minor Changes

- 2260f3d: perf: Cache git provider state to improve time it takes to fetch the manifest. (This behavior can be disabled with the `--no-cache` flag)

## 1.34.0

### Minor Changes

- 511c288: feat: Resolve remote dependencies for config files 🎉

## 1.33.1

### Patch Changes

- cdd2486: feat: Autofix incorrect extension on (.ts|js|mjs|cjs) config files.
- 3c7eeb4: fix: Ensure registries coming from args are always configured first.
- 2bf2f5b: feat: Improve error messages when paths are incorrectly named or do not resolve.
- 2bf2f5b: fix: Do not accept invalid path default blocks path on init.

## 1.33.0

### Minor Changes

- 673d300: feat: Use "✨ Update with AI ✨" to update your config files on `init` 🎉
- 317fdc8: feat: 🎉 Specify config files to add on `init` from `jsrepo-build-config.json` 🎉

### Patch Changes

- 673d300: updated: During project init you will now be prompted to initialize registries after being prompted for the formatter.
- 34198ac: fix: Fix an issue where the same registry would be duplicated in the config if you ran init multiple times on that registry.
- 34198ac: fix: Always configure registries provided as args on init.

## 1.32.1

### Patch Changes

- 63a1ccb: chore: Bump deps
- 2f5cff4: fix: Fix regression where unused blocks were not removed from the manifest.

## 1.32.0

### Minor Changes

- 8168f20: feat: Detect dependencies from dynamic imports in TypeScript and Svelte files. 🎉

## 1.31.0

### Minor Changes

- 0424970: feat: Support for subdirectories 🎉

## 1.30.1

### Patch Changes

- f7e3220: Remove `meta.builtAt` key from `jsrepo-manifest.json`

## 1.30.0

### Minor Changes

- d72a2e9: feat: Optional metadata for the manifest file provided from the `jsrepo-build-config.json`.
- d72a2e9: feat: Object based manifest

## 1.29.1

### Patch Changes

- d4e42fd: Ensure parsed urls from http provider end with a trailing slash.
- d4e42fd: Catch `JSON.parse` errors when fetching the manifest to provide a more clear error to the user.

## 1.29.0

### Minor Changes

- 074fb73: re-write internal apis to make the public api usable in the browser. (No change for cli users)

## 1.28.4

### Patch Changes

- d6bc0ee: Expose registry types.

## 1.28.3

### Patch Changes

- 9b9b4a2: perf: Resolve repository paths and fetch jsrepo-manifest.json in parallel.
- 53ddf84: chore: Bump deps
- 53ddf84: fix: Wrap overflowed text in boxes

## 1.28.2

### Patch Changes

- 1bc5b91: Update `no-framework-dependency` list to include `@sveltejs/kit`
- fbd749a: Ensure dependency versions are correctly parsed when adding/updating blocks.

## 1.28.1

### Patch Changes

- 9b9ddee: Ensure `/.a/` ignore syntax works during build.

## 1.28.0

### Minor Changes

- f52c4db: feat: ✨ Update with AI ✨ Adds "Update with AI" to the "Accept changes?" prompt when running `jsrepo update`. This allows for smarter updates when overwriting the entire file isn't what you want.

## 1.27.0

### Minor Changes

- 4d372c6: Respect `.gitignore` when running `build`. `.git` and `node_modules` are always ignored.

## 1.26.6

### Patch Changes

- 2091a2c: Remove debug log.

## 1.26.5

### Patch Changes

- 881e470: Fix url handling (again).

## 1.26.4

### Patch Changes

- 6c21d16: Allow relative imports from anywhere in the project.

## 1.26.3

### Patch Changes

- bdb3460: Ensure urls with or without a trailing slash are treated the same.

## 1.26.2

### Patch Changes

- 8e3c183: Improve error message when fetching for a self-hosted registry.

## 1.26.1

### Patch Changes

- 36771a9: Fix an issue where aliases with an extension could cause the build to fail.

## 1.26.0

### Minor Changes

- 57c21d6: Support for self-hosted registries. 🎉
- ad0ba56: Add `outputDir` config key to allow copying the registry to a different location on build. Useful for hosting registries on your own domain.

### Patch Changes

- 449e1a5: Add tests for `add` and `build` commands.
- c208ee4: When adding blocks with zero-config you will now be prompted before overwriting an existing block
- 57c21d6: When supplying a fully qualified block while using a config. Repos in the config are no longer fetched unless necessary.

## 1.25.0

### Minor Changes

- c977659: Deprecate `--repos` flag for `init` command in favor of arguments.

### Patch Changes

- c977659: Allow for configuring repos provided from the cli to encourage path customization.
- c977659: Allow for reconfiguring repos with the `init` command.

## 1.24.3

### Patch Changes

- ae93877: Use `add` instead of `install` for `package-manager-detector` when installing dependencies.

## 1.24.2

### Patch Changes

- c9c58e4: Improve error message when there is an error fetching a file to give a customized message based on the git provider used.

## 1.24.1

### Patch Changes

- e4cb5d3: Ensure imports like `foo.svelte` are resolved properly when the real path is `foo.svelte.ts`.
- e4cb5d3: Fix an issue where resolved file extensions were left on the import even though not provided by the user.

## 1.24.0

### Minor Changes

- 80590cd: Remove `diff` command.
- d30d9ce: Use `semver.satisfies` to determine if a version of a dependency is already installed when adding and updating.

### Patch Changes

- d30d9ce: Add `-n, --no` flag to `update` command to promote identical behavior to the now removed `diff` command.
- d30d9ce: Update dependencies.

## 1.23.7

### Patch Changes

- 9ffde8a: Use `vue/compiler-sfc` instead of `@vue/compiler-sfc` to avoid compiler issues.

## 1.23.6

### Patch Changes

- f3ecf0d: Ensure vue compiler has `fs` access.

## 1.23.5

### Patch Changes

- eaeac96: Fix an issue where the `test` command would fail when running tests on linux.

## 1.23.4

### Patch Changes

- 5764ab5: Add message to let users know that an update is available to the CLI when their version is out of date.

## 1.23.3

### Patch Changes

- 036b8c0: Add descriptions for `add`, `exec`, and `update` commands.
- 036b8c0: Move some files to enable documentation generation.

## 1.23.2

### Patch Changes

- 6ec9cab: Update dependencies.

## 1.23.1

### Patch Changes

- 4f897ca: Update dependencies.
- 433bca7: Remove unused and unnecessary `--cwd` option from `auth` command.

## 1.23.0

### Minor Changes

- 17762ac: Add `exec` (`x`) command.

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
