---
title: GitHub
description: How to use GitHub as your registry provider.
lastUpdated: 4-10-2025
---

## Branches and Tags

**jsrepo** supports GitHub so that you can just paste a link to the repo homepage and it will be handled correctly.

Because of this all of the following paths work:

```sh
https://github.com/ieedan/std # default branch shorthand
https://github.com/ieedan/std/tree/v1.5.0 # tag reference
https://github.com/ieedan/std/tree/next # branch reference
```

## Using Tags for Versioning

Tags can be a great solution to ensuring remote tests and blocks stay on a consistent version.

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json",
	// use a specific version tag
	"repos": ["https://github.com/ieedan/std/tree/v1.5.0"],
	"path": "src/blocks",
	"includeTests": false,
	"watermark": true,
	"formatter": "prettier",
	"paths": {
		"*": "./src/blocks"
	}
}
```

Tags do not however work like npm packages. Tags are completely mutable meaning a malicious registry could publish over a tag with different code.

This is why it's always important to make sure you trust the owner of the registry.

## github Shorthand

When referencing GitHub as the provider you can use the `github` shorthand in place of `https://github.com`.

Example:

```sh
npx jsrepo add github/ieedan/std/utils/math
```

In the `jsrepo.json`:

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json",
	// use github instead of https://github.com
	"repos": ["github/ieedan/std"],
	"path": "src/blocks",
	"includeTests": false,
	"watermark": true,
	"formatter": "prettier",
	"paths": {
		"*": "./src/blocks"
	}
}
```

## Rate Limiting

If you are doing a lot of testing with **jsrepo** you may eventually get to a point where GitHub "cuts you off". At this point GitHub will start to return cached responses when trying to add, update, or test blocks.

You can get around this by supplying a PAT with the `auth` command.

## CI / CD

If you are creating your own registry you may want to build the registry on a push to the main branch to make sure that the `jsrepo-manifest.json` is always up to date with the latest changes.

Workflow to build the manifest and create a pull request:

```yaml showLineNumbers
name: build-registry
on:
  push:
    branches:
      - main
permissions:
  contents: write
  pull-requests: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      # jsrepo doesn't need any of your
      # dependencies to be installed to work
      - name: Build jsrepo-manifest.json
        run: npx jsrepo build
      - name: Create pull request with changes
        uses: peter-evans/create-pull-request@v7
        with:
          title: 'chore: update `jsrepo-manifest.json`'
          body: |
            - Update `jsrepo-manifest.json`
            ---
            This PR was auto generated
          branch: build-manifest
          commit-message: build `jsrepo-manifest.json`
```
