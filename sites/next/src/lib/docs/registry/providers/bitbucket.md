---
title: BitBucket
description: How to use BitBucket as your registry provider.
lastUpdated: 4-10-2025
---

## Branches and Tags

**jsrepo** supports BitBucket so that you can just paste a link to the repo homepage and it will be handled correctly.

Because of this all of the following paths work:

```sh
https://bitbucket.org/ieedan/std # default branch shorthand
https://bitbucket.org/ieedan/std/src/v1.5.0 # tag reference
https://bitbucket.org/ieedan/std/src/next # branch reference
```

## Using Tags for Versioning

Tags can be a great solution to ensuring remote tests and blocks stay on a consistent version.

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json",
	// use a specific version tag
	"repos": ["https://bitbucket.org/ieedan/std/src/v1.5.0"],
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

## bitbucket Shorthand

When referencing bitbucket as the provider you can use the `bitbucket` shorthand in place of `https://bitbucket.org`.

Example:

```sh
npx jsrepo add bitbucket/ieedan/std/src/main/utils/math
```

In the `jsrepo.json`:

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json",
	// use bitbucket instead of https://bitbucket.org
	"repos": ["bitbucket/ieedan/std/src/main"],
	"path": "src/blocks",
	"includeTests": false,
	"watermark": true,
	"formatter": "prettier",
	"paths": {
		"*": "./src/blocks"
	}
}
```
