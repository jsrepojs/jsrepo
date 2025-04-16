---
title: jsrepo.json
description: The project config file for jsrepo.
lastUpdated: 4-10-2025
---

The `jsrepo.json` allows you to configure how **jsrepo** installs blocks in your project.

You can create a `jsrepo.json` by running the init command with the `--project` flag:

```sh
jsrepo init --project
```

## $schema

`$schema` is tracked with the cli so you can use a specific version using unpkg:

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/project-config.json"
}
```

## configFiles

Where to add specific config files in your project.

```jsonc showLineNumbers
{
	"configFiles": {
		"app.css": "./src/app.css"
	}
}
```

## formatter

The formatter to use when writing files in your project.

```jsonc showLineNumbers
{
	"formatter": "prettier" / "biome" / undefined
}
```

jsrepo can format your files following your local config before adding them to your repository. Currently the only supported formatters are Prettier and Biome.

## includeTests

Whether or not to include test files when installing blocks.

```jsonc showLineNumbers
{
	"includeTests": false
}
```

## paths

Where to add specific categories in your project.

```jsonc showLineNumbers
{
	"paths": {
		"*": "./src/blocks",
		"components": "$lib/components",
		"hooks": "$lib/hooks"
	}
}
```

## repos

`repos` allows you to specify different registries to install blocks from. All of the blocks from each registry will be listed when you run add.

```jsonc showLineNumbers
{
	"repos": ["gitlab/ieedan/std", "github/ieedan/shadcn-phone-input-svelte"]
}
```

## watermark

Whether or not to add a watermark to installed blocks.

```jsonc showLineNumbers
{
	"watermark": true
}
```

When true jsrepo adds a watermark to each block that includes the registry that it was added from from.

```ts showLineNumbers
/*
	Installed from github/ieedan/std
*/

export type Point = {
	x: number;
	y: number;
};
```
