---
title: AzureDevops
description: How to use AzureDevops as your registry provider.
lastUpdated: 4-10-2025
---

## Branches and Tags

Because the AzureDevops URL structure doesn't include enough information to fetch raw files we have to use a custom structure so copy pasting the URL from the homepage like you can for other providers won't just work.

Instead you need to follow the following format:

`azure/<organization>/<project>/<repo>/(tags|heads)/<ref>`

```sh
azure/ieedan/std/std # default branch shorthand
azure/ieedan/std/std/tags/v1.5.0 # tag reference
azure/ieedan/std/std/heads/next # branch reference
```

## Using Tags for Versioning

Tags can be a great solution to ensuring remote tests and blocks stay on a consistent version.

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json",
	// use a specific version tag
	"repos": ["azure/ieedan/std/std/tags/v1.5.0"],
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
