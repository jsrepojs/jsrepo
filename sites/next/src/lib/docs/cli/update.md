---
title: update
description: Interactively update your blocks.
lastUpdated: 4-10-2025
---

```sh
jsrepo update
```

## Usage

Choose which blocks to update:

```sh
jsrepo update
```

Update a specific block:

```sh
jsrepo update utils/math
```

## Options

### `--all`

Update all installed components.

#### Usage

```sh
jsrepo update --all
```

### `-E, --expand`

Expands the diff past the limit set by `--max-unchanged` so that you can see the entire file.

#### Usage

```sh
jsrepo update --expand
```

### `--max-unchanged`

Sets a limit on the maximum unchanged lines to display in a diff before it is collapsed. (default: 3)

#### Usage

```sh
jsrepo update --max-unchanged 10
```

### `-n, --no`

Do update any blocks.

#### Usage

```sh
jsrepo update --no
```

### `--repo`

The repository to download the blocks from.

#### Usage

```sh
jsrepo update --repo github/ieedan/std
```

### `-A, --allow`

Allow **jsrepo** to download code from the provided repo. This skips the initial confirmation prompt when attempting to download a block from a registry not listed in the `jsrepo.json` file.

#### Usage

```sh
jsrepo update github/ieedan/std/utils/math --allow
```

### `-y, --yes`

Skips confirmation prompts. (Not including permissions prompts)

#### Usage

```sh
jsrepo update --yes
```

### `--no-cache`

Prevents caching the git provider state. Useful if the cache is incorrect due to changing the default branch for a repository or changing a tag into a head or vise versa.

#### Usage

```sh
jsrepo update --no-cache
```

### `--verbose`

More verbose logging. (May be used to troubleshoot issues)

#### Usage

```sh
jsrepo update --verbose
```

### `--cwd`

Run the current command on the provided directory absolute or relative.

#### Usage

```sh
jsrepo update --cwd ./sites/docs
```

### `-h, --help`

Help with the command.

#### Usage

```sh
jsrepo update --help
```
