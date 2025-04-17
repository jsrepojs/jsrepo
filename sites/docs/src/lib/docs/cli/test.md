---
title: test
description: Test local blocks against their corresponding tests in their source registry.
lastUpdated: 4-10-2025
---

```sh
jsrepo test
```

## Usage

```sh
jsrepo test
```

## Options

### `--repo`

The repository to download the blocks from.

#### Usage

```sh
jsrepo test --repo github/ieedan/std
```

### `-A, --allow`

Allow **jsrepo** to download code from the provided repo. This skips the initial confirmation prompt when attempting to download a block from a registry not listed in the `jsrepo.json` file.

#### Usage

```sh
jsrepo test github/ieedan/std/utils/math --allow
```

### `--debug`

Leaves the temp test file around for debugging upon failure.

#### Usage

```sh
jsrepo test --debug
```

### `--no-cache`

Prevents caching the git provider state. Useful if the cache is incorrect due to changing the default branch for a repository or changing a tag into a head or vise versa.

#### Usage

```sh
jsrepo test --no-cache
```

### `--verbose`

More verbose logging. (May be used to troubleshoot issues)

#### Usage

```sh
jsrepo test --verbose
```

### `--cwd`

Run the current command on the provided directory absolute or relative.

#### Usage

```sh
jsrepo test --cwd ./sites/docs
```

### `-h, --help`

Help with the command.

#### Usage

```sh
jsrepo test --help
```
