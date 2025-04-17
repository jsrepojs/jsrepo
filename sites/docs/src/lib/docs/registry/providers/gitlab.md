---
title: GitLab
description: How to use GitLab as your registry provider.
lastUpdated: 4-10-2025
---

## Branches and Tags

**jsrepo** supports GitLab so that you can just paste a link to the repo homepage and it will be handled correctly.

Because of this all of the following paths work:

```sh
https://gitlab.com/ieedan/std # default branch shorthand
https://gitlab.com/ieedan/std/-/tree/v1.5.0 # tag reference
https://gitlab.com/ieedan/std/-/tree/next # branch reference
```

## Using Tags for Versioning

Tags can be a great solution to ensuring remote tests and blocks stay on a consistent version.

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json",
	// use a specific version tag
	"repos": ["https://gitlab.com/ieedan/std/-/tree/v1.5.0"],
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

## gitlab Shorthand

When referencing GitLab as the provider you can use the `gitlab` shorthand in place of `https://gitlab.com`.

Example:

```sh
npx jsrepo add gitlab/ieedan/std/utils/math
```

In the `jsrepo.json`:

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json",
	// use gitlab instead of https://gitlab.com
	"repos": ["gitlab/ieedan/std"],
	"path": "src/blocks",
	"includeTests": false,
	"watermark": true,
	"formatter": "prettier",
	"paths": {
		"*": "./src/blocks"
	}
}
```

## Self hosted GitLab

Some companies prefer to host their own GitLab instance so we allow that too!

You can use the `gitlab:` prefix followed by your custom domain to point to your self hosted instance:

```sh
gitlab:https://example.com/ieedan/std
```

Now requests will be made to `https://example.com` with the owner `ieedan` and the repository name `std`.
