---
title: exec
description: Execute a block as a script with arguments.
lastUpdated: 4-10-2025
---

```sh
jsrepo exec
```

## Usage

Choose a script to execute from the registries in your jsrepo.json file:

```sh
jsrepo exec
```

`x` alias:

```sh
jsrepo x
```

Execute with args:

```sh
jsrepo exec -- argument --yes
```

Execute a partially qualified script using the registries in your jsrepo.json file:

```sh
jsrepo exec github/ieedan/scripts/general/hello
```

Include another registry in the scripts list:

```sh
jsrepo exec --repo github/ieedan/scripts
```

## Options

### `--`

`--` is a special option that will cause any args after it to be passed to the script instead of **jsrepo**.

#### Usage

```sh
jsrepo exec -- argument --yes
```

### `--repo`

The repository to download the scripts from.

#### Usage

```sh
jsrepo exec --repo github/ieedan/scripts
```

### `-A, --allow`

Allow **jsrepo** to download code from the provided repo. This skips the initial confirmation prompt when attempting to download a block from a registry not listed in the `jsrepo.json` file.

#### Usage

```sh
jsrepo exec --repo github/ieedan/scripts --allow
```

### `--no-cache`

Prevents caching the git provider state. Useful if the cache is incorrect due to changing the default branch for a repository or changing a tag into a head or vise versa.

#### Usage

```sh
jsrepo exec --no-cache
```

### `--verbose`

More verbose logging. (May be used to troubleshoot issues)

#### Usage

```sh
jsrepo exec --verbose
```

### `--cwd`

Run the current command on the provided directory absolute or relative.

#### Usage

```sh
jsrepo exec --cwd ./sites/docs
```

### `-h, --help`

Help with the command.

#### Usage

```sh
jsrepo exec --help
```
