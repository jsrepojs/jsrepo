---
title: init
description: Initialize a registry or project with jsrepo.
lastUpdated: 4-10-2025
---

```sh
jsrepo init
```

## Usage

Choose to initialize a registry or project:

```sh
jsrepo init
```

Initialize a project:

```sh
jsrepo init --project
```

Initialize a registry:

```sh
jsrepo init --registry
```

Initialize a project with registries:

```sh
jsrepo init github/ieedan/std
```

## Options

### `--repos`

Deprecated
The repositories to install the blocks from. (For project setup)

#### Usage

```sh
jsrepo init --repos github/ieedan/std github/ieedan/shadcn-svelte-extras
```

### `--no-watermark`

Sets the watermark config key to false. (For project setup)

#### Usage

```sh
jsrepo init --no-watermark
```

### `--tests`

Sets the tests config key to true. (For project setup)

#### Usage

```sh
jsrepo init --tests
```

### `--formatter`

Configure the formatter used when adding and updating blocks. (prettier, biome) (For project setup)

#### Usage

```sh
jsrepo init --formatter prettier
```

### `-P, --project`

Takes you through the steps to initialize a project.

#### Usage

```sh
jsrepo init --project
```

### `-R, --registry`

Takes you through the steps to initialize a registry.

#### Usage

```sh
jsrepo init --registry
```

### `--script`

The name of the build script. (For registry setup)

#### Usage

```sh
jsrepo init --script build:registry
```

### `-y, --yes`

Skips confirmation prompts. (Not including permissions prompts)

#### Usage

```sh
jsrepo init --yes
```

### `--no-cache`

Prevents caching the git provider state. Useful if the cache is incorrect due to changing the default branch for a repository or changing a tag into a head or vise versa.

#### Usage

```sh
jsrepo init --no-cache
```

### `--cwd`

Run the current command on the provided directory absolute or relative.

#### Usage

```sh
jsrepo init --cwd ./packages/blocks
```

### `-h, --help`

Help with the command.

#### Usage

```sh
jsrepo init --help
```
