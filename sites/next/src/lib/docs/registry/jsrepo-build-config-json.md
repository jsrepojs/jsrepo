---
title: jsrepo-build-config.json
description: The registry config file for jsrepo.
lastUpdated: 4-10-2025
---

`jsrepo-build-config.json` holds the configuration for your registry.

You can create a `jsrepo-build-config.json` by running the `init` command with the `--registry` flag:

```sh
jsrepo init --registry
```

### `$schema`

`$schema` is tracked with the cli so you can use a specific version using unpkg:

```jsonc showLineNumbers
{
	"$schema": "https://unpkg.com/jsrepo@1.47.0/schemas/registry-config.json"
}
```

### `allowSubdirectories`

`allowSubdirectories` allows subdirectories to be built.

```jsonc showLineNumbers
{
	"allowSubdirectories": false
}
```

### `configFiles`

`configFiles` allows you to specify files that the user may need in their project for the registry to function properly.

```jsonc showLineNumbers
{
	"configFiles": [
		{
			"name": "app.css",
			"path": "./src/app.css",
			"expectedPath": "./src/app.css",
			"optional": false
		}
	]
}
```

#### `expectedPath`

The path where you expect users to have this file (used as a default in prompts).

#### `name`

The name as it will be displayed in prompts to the user.

#### `optional`

When true users will be prompted to ask whether or not they want to add the config file.

#### `path`

The path of the file in your registry.

### `dirs`

`dirs` is a list of the directories that contain your block categories.

```jsonc showLineNumbers
{
	"dirs": ["./src", "./blocks"]
}
```

### `doNotListBlocks`

`doNotListBlocks` is a list of block names that shouldn't be listed when the user runs the `add` command.

```jsonc showLineNumbers
{
	"doNotListBlocks": ["utils"]
}
```

### `doNotListCategories`

`doNotListCategories` is a list of category names that shouldn't be listed when the user runs the `add` command.

```jsonc showLineNumbers
{
	"doNotListCategories": ["utils"]
}
```

### `excludeBlocks`

`excludeBlocks` allows you to prevent the specified blocks from being included in the manifest.

```jsonc showLineNumbers
{
	"excludeBlocks": ["domain"]
}
```

### `excludeCategories`

`excludeCategories` allows you to prevent the specified categories from being included in the manifest.

```jsonc showLineNumbers
{
	"excludeCategories": ["INTERNAL"]
}
```

### `excludeDeps`

`excludeDeps` allows you to prevent specified remote dependencies from being installed when the user adds/updates blocks. This is useful for framework specific API's like React or Svelte.

```jsonc showLineNumbers
{
	"excludeDeps": ["svelte", "react", "vue"]
}
```

### `includeBlocks`

`includeBlocks` allows you to only include specified blocks in the final manifest file. Keep in mind that if these blocks are referenced by other blocks that are included then your build will break.

```jsonc showLineNumbers
{
	"includeBlocks": ["ui", "hooks"]
}
```

### `includeCategories`

`includeCategories` allows you to only include specified categories in the final manifest file. Keep in mind that if these categories are referenced by other categories that are included then your build will break.

```jsonc showLineNumbers
{
	"includeCategories": ["components", "utils"]
}
```

### `listBlocks`

`listBlocks` is a list of block names that should be listed when the user runs the `add` command.

```jsonc showLineNumbers
{
	"listBlocks": ["utils"]
}
```

### `listCategories`

`listCategories` is a list of category names that should be listed when the user runs the `add` command.

```jsonc showLineNumbers
{
	"listCategories": ["utils"]
}
```

### `meta`

`meta` allows you to provide optional information about the registry that can be displayed to users for better documentation.

```jsonc showLineNumbers
{
	"meta": {
		"authors": ["Aidan Bleser"],
		"bugs": "https://github.com/ieedan/std/issues",
		"description": "Fully tested and documented TypeScript utilities brokered by jsrepo.",
		"homepage": "https://ieedan.github.io/std/",
		"repository": "https://github.com/ieedan/std",
		"tags": ["typescript", "std"]
	}
}
```

### `outputDir`

`outputDir` is an optional key that allows you to copy the resulting `jsrepo-manifest.json` and any required files to a custom directory.

This is useful if you want to host the registry in a different location from where the code actually lives. (This should NOT be used when hosting your registry from a git repository)

```jsonc showLineNumbers
{
	"outputDir": "./static/new-york"
}
```

### `peerDependencies`

`peerDependencies` allow you to warn users when they are missing dependencies that are required or are using dependency versions that are incompatible.

```jsonc showLineNumbers
{
	"peerDependencies": {
		"svelte": {
			"version": "5.x.x",
			"message": "Svelte 5 is the only supported version for this registry see: https://github.com/ieedan/jsrepo"
		},
		"tailwindcss": "3.x.x"
	}
}
```

#### `message`

A message displayed to users when installing with an incompatible peer dependency.

#### `version`

The version or version range that is supported by your registry.

### `preview`

`preview` displays a preview of the blocks list.

```jsonc showLineNumbers
{
	"preview": false
}
```

### `rules`

`rules` allows you to configure the rules when checking the manifest file after build.

Below are the default settings for each rule.

```jsonc showLineNumbers
{
	"rules": {
		"no-category-index-file-dependency": "warn",
		"no-unpinned-dependency": "warn",
		"require-local-dependency-exists": "error",
		"max-local-dependencies": ["warn", 10],
		"no-cir-dependency": "error",
		"no-unused-block": "warn",
		"no-framework-dependency": "warn"
	}
}
```

#### `no-category-index-file-dependency`

Disallow depending on the index file of a category.

#### `no-unpinned-dependency`

Require all dependencies to have a pinned version.

#### `require-local-dependency-exists`

Require all local dependencies to exist.

#### `max-local-dependencies`

Enforces a limit on the amount of local dependencies a block can have.

#### `no-circular-dependency`

Disallow circular dependencies.

#### `no-unused-block`

Disallow unused blocks. (Not listed and not a dependency of another block)

#### `no-framework-dependency`

Disallow frameworks (Svelte, Vue, React) as dependencies.
