---
title: auth
description: Configure access tokens for private registry access and update with AI.
lastUpdated: 4-10-2025
---

```sh
jsrepo auth
```

## Usage

Choose a service and provide a token:

```sh
jsrepo auth
```

Authenticate to a specific service:

```sh
jsrepo auth github
```

Choose a service to logout from:

```sh
jsrepo auth --logout
```

Logout from a specific service:

```sh
jsrepo auth github --logout
```

## Options

### `--token`

The token to use for authenticating to your service.

#### Usage

```sh
jsrepo auth --token xxxxxxxxxxx
```

### `--logout`

Executes the logout flow.

#### Usage

```sh
jsrepo auth --logout
```

### `--cwd`

Run the current command on the provided directory absolute or relative.

#### Usage

```sh
jsrepo auth --cwd ./sites/docs
```

### `-h, --help`

Help with the command.

#### Usage

```sh
jsrepo add --help
```
