---
title: build
description: Build your code into a jsrepo registry.
lastUpdated: 4-10-2025
---

```sh
jsrepo build
```

## Usage

The build command builds the specified directories into a `jsrepo-manifest.json` file which **jsrepo** can use to locate blocks in your repository.

```sh
jsrepo build
```

## Options

### `--dirs`

The directories containing the categories. Corresponding config key: `dirs`

#### Usage

```sh
jsrepo build --dirs ./src ./blocks
```

### `--output-dir`

Directory to copy the `jsrepo-manifest.json` and all required registry files to once the build is complete. This is useful when you want to host your registry on a custom domain from a different directory from where the code actually lives. Corresponding config key: `outputDir`

#### Usage

```sh
jsrepo build --output-dir ./static/new-york
```

### `--include-blocks`

Include only the blocks with these names. Corresponding config key: `includeBlocks`

#### Usage

```sh
jsrepo build --include-blocks math logger
```

### `--include-categories`

Include only the categories with these names. Corresponding config key: `includeCategories`

#### Usage

```sh
jsrepo build --include-categories utils scripts
```

### `--exclude-blocks`

Do not include the blocks with these names. Corresponding config key: `excludeBlocks`

#### Usage

```sh
jsrepo build --exclude-blocks math logger
```

### `--exclude-categories`

Do not include the categories with these names. Corresponding config key: `excludeCategories`

#### Usage

```sh
jsrepo build --exclude-categories utils scripts
```

### `--list-blocks`

List only the blocks with these names. Corresponding config key: `listBlocks`

#### Usage

```sh
jsrepo build --list-blocks math logger
```

### `--list-categories`

List only the categories with these names. Corresponding config key: `listCategories`

#### Usage

```sh
jsrepo build --list-categories utils scripts
```

### `--do-not-list-blocks`

Do not list the blocks with these names. Corresponding config key: `doNotListBlocks`

#### Usage

```sh
jsrepo build --do-not-list-blocks math logger
```

### `--do-not-list-categories`

Do not list the categories with these names. Corresponding config key: `doNotListCategories`

#### Usage

```sh
jsrepo build --do-not-list-categories utils scripts
```

### `--exclude-deps`

Prevent these dependencies from being included in the `jsrepo-manifest.json` file. Corresponding config key: `excludeDeps`

#### Usage

```sh
jsrepo build --exclude-deps svelte react
```

### `--allow-subdirectories`

Allow subdirectories to be built. Corresponding config key: `allowSubdirectories`

#### Usage

```sh
jsrepo build --allow-subdirectories
```

### `--preview`

Display a preview of the blocks list. Corresponding config key: `preview`

#### Usage

```sh
jsrepo build --preview
```

### `--verbose`

More verbose logging. (May be used to troubleshoot issues)

#### Usage

```sh
jsrepo build --verbose
```

### `--cwd`

Run the current command on the provided directory absolute or relative.

#### Usage

```sh
jsrepo build --cwd ./sites/docs
```

### `-h, --help`

Help with the command.

#### Usage

```sh
jsrepo build --help
```
