---
title: add
description: Add blocks to your project from a registry.
lastUpdated: 4-10-2025
---

```sh
jsrepo add
```

## Usage

Choose a block to add from the registries in your jsrepo.json file:

```sh
jsrepo add
```

Add a partially qualified block using the registries in your jsrepo.json file:

```sh
jsrepo add utils/math
```

Add a fully qualified block:

```sh
jsrepo add github/ieedan/std/utils/math
```

Include another registry in the blocks list:

```sh
jsrepo add --repo github/ieedan/std
```

## Options

### `--watermark`

Include a watermark at the top of added files. (For non-interactive zero-config adds)

#### Usage

```sh
jsrepo add --watermark true
```

### `--tests`

Include tests along with the blocks when adding them. (For non-interactive zero-config adds)

#### Usage

```sh
jsrepo add --tests true
```

### `--formatter`

Configure the formatter used when adding and updating blocks. (prettier, biome, none) (For non-interactive zero-config adds)

#### Usage

```sh
jsrepo add --formatter prettier
```

### `--paths`

Allows you to specify where to install categories. A mirror of the paths functionality in the `jsrepo.json` file. (For non-interactive zero-config adds)

#### Usage

```sh
jsrepo add --paths utils=./src/blocks/utils,ui=./src/blocks/ui
```

### `-E, --expand`

Expands the diff past the limit set by `--max-unchanged` so that you can see the entire file.

#### Usage

```sh
jsrepo add --expand
```

### `--max-unchanged`

Sets a limit on the maximum unchanged lines to display in a diff before it is collapsed. (default: 3)

#### Usage

```sh
jsrepo add --max-unchanged 10
```

### `--repo`

The repository to download the blocks from.

#### Usage

```sh
jsrepo add --repo github/ieedan/std
```

### `-A, --allow`

Allow jsrepo to download code from the provided repo. This skips the initial confirmation prompt when attempting to download a block from a registry not listed in the `jsrepo.json` file.

#### Usage

```sh
jsrepo add github/ieedan/std/utils/math --allow
```

### `-y, --yes`

Skips confirmation prompts. (Not including permissions prompts)

#### Usage

```sh
jsrepo add --yes
```

### `--no-cache`

Prevents caching the git provider state. Useful if the cache is incorrect due to changing the default branch for a repository or changing a tag into a head or vise versa.

#### Usage

```sh
jsrepo add --no-cache
```

### `--verbose`

More verbose logging. (May be used to troubleshoot issues)

#### Usage

```sh
jsrepo add --verbose
```

### `--cwd`

Run the current command on the provided directory absolute or relative.

#### Usage

```sh
jsrepo add --cwd ./sites/docs
```

### `-h, --help`

Help with the command.

#### Usage

```sh
jsrepo add --help
```
