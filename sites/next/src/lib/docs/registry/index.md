---
title: Getting Started
description: How to build your own registry with jsrepo.
lastUpdated: 4-10-2025
---

Here we will walk your through how to create your first registry with **jsrepo**.

## Initialize a new project

Let's start by initializing our project with a `package.json`:

```sh
npm init
```

## Create your first block

Now let's create a directory that will be our "category". A category is the section before the `/` in a block specifier (`<category>/<block>`) this allows you to categorize your blocks.

For this example we will create a new category `utils` under the `/src` directory. Your project should now look like this:

```plaintext
root
├── /src
│   └── /utils
└── package.json
```

Next let's create our first block.

Add a new file called `add.ts` under `/utils` and paste the following code:

```ts
export function add(a: number, b: number) {
	return a + b;
}
```

## Configure the build command

Now that we have a block in our category let's build it into a manifest that **jsrepo** can understand.

Before we can do that we will need to configure the `build` command so that it knows where to look for our blocks.

For this let's run:

```sh
jsrepo init --registry
```

Now **jsrepo** will ask us some questions about our project. The first of which is "Where are your blocks located?". Here we say `/src` because it is the directory containing the category we just created `utils`.

From here allow **jsrepo** to create the `jsrepo-build-config.json` file and step through the rest of the prompts.

```plaintext
┌   jsrepo  v1.0.0
│
◇  Where are your blocks located?
│  ./src
│
◇  Add another blocks directory?
│  No
│
◇  Create a `jsrepo-build-config.json` file?
│  Yes
│
◇  Added `build:registry` to scripts in package.json
│
◇  Created `jsrepo-build-config.json`
│
├  Next Steps ────────────────────────────────────────────────┐
│                                                             │
│  1. Add categories to `./src`.                              │
│  2. Run `npm run build:registry` to build the registry.     │
│                                                             │
├─────────────────────────────────────────────────────────────┘
│
└  All done!
```

Once you're done you should be able to run:

```sh
jsrepo build
```

**jsrepo** will then output a `jsrepo-manifest.json` that looks like this:

```jsonc showLineNumbers
{
	"categories": [
		{
			"name": "utils",
			"blocks": [
				{
					"name": "add",
					"directory": "src/utils",
					"category": "utils",
					"tests": false,
					"subdirectory": false,
					"list": true,
					"files": ["add.ts"],
					"localDependencies": [],
					"_imports_": {},
					"dependencies": [],
					"devDependencies": []
				}
			]
		}
	]
}
```

Congratulations you have just built your first registry.

Now you can choose any one of the [supported providers](/docs/registry/providers) to host your registry and start distributing your code!

## Resolving Dependencies

While small projects like the one above are nice as an example they really don't show any of the true power of **jsrepo**.

Most real projects will have different blocks that depend on each other or that depend on packages.

Let's see how **jsrepo** handles that...

Create a new file `print.ts` under `/utils` and paste the following code:

```ts showLineNumbers
import color from 'chalk';
import { add } from './add';

export function printSum(a: number, b: number) {
	const answer = add(a, b);

	return console.log(`The answer is: ${color.cyan(answer.toString())}`);
}
```

Now if you build your `jsrepo-manifest.json` should look like this:

```jsonc showLineNumbers
{
	"categories": [
		{
			"name": "utils",
			"blocks": [
				// add ...
				{
					"name": "print",
					"directory": "src/utils",
					"category": "utils",
					"tests": false,
					"subdirectory": false,
					"list": true,
					"files": ["print.ts"],
					"localDependencies": ["utils/add"],
					"_imports_": {
						"./add": "{{utils/add}}"
					},
					"dependencies": ["chalk"],
					"devDependencies": []
				}
			]
		}
	]
}
```

You should notice the `print` block has now been added to the `blocks` array for the `utils` category.

It should have `utils/add` under it's `localDependencies` and `chalk` under it's `dependencies`.

> Right now `chalk` doesn't have a version, but if we run `npm install chalk` **jsrepo** will use the version in your `package.json`

## Excluding Dependencies

Often you may want certain dependencies to not be installed when users add your blocks.

Most commonly this will be things like the framework you are using (`Next`, `Svelte`, `etc.`).

To prevent dependencies from being installed use the `--exclude-deps` flag or the corresponding `excludeDeps` option in your config:

Flag:

```sh
jsrepo build --exclude-deps
```

Option:

```jsonc showLineNumbers
{
	"excludeDeps": ["react"]
}
```

### Automatically Excluded Dependencies

By default in `svelte` and `vue` files importing from `svelte` or `vue` will not result in the dependencies being added.

This is because we can generally assume anyone adding either of those filetypes to their project will already have Svelte or Vue installed.

## Peer Dependencies

Peer dependencies all you to warn your users when they are using unsupported versions of dependencies they need for your registry to function.

An example of this could be your project using TailwindCSS v3 while waiting to migrate to v4. In the meantime you can setup peer dependencies to warn users that v4 is not yet fully supported.

```jsonc showLineNumbers
{
	"peerDependencies": {
		"tailwindcss": {
			"version": "3.x.x",
			"message": "Tailwind@v4 is not yet fully supported see: https://github.com/ieedan/jsrepo"
		}
	}
}
```

## Config Files

For some registries you will need the user to have config files such as a `tailwind.config.ts` or `global.css`.

You can include these files by configuring them in the `jsrepo-build-config.json`:

```jsonc showLineNumbers
{
	"configFiles": [
		{
			"name": "Tailwind Config",
			"path": "./tailwind.config.ts",
			"expectedPath": "./tailwind.config.ts",
			"optional": false
		}
	]
}
```

When users initialize your registry they will be prompted to add or update these config files.

## Metadata

You can view your registry on the **jsrepo** site by navigating to `https://jsrepo.dev/registries/<your-registry-url>` this page uses information from the manifest to display information like how many categories / blocks your registry has or it's dependencies.

However if you configure the `meta` key in the `jsrepo-build-config.json` you can add more information like a description, a homepage, and tags.

## Live Examples

- [github/ieedan/std](https://github.com/ieedan/std)
- [github/ieedan/shadcn-svelte-extras](https://github.com/ieedan/shadcn-svelte-extras)
- [gitlab/ieedan/std](https://gitlab.com/ieedan/std)
- [bitbucket/ieedan/std](https://bitbucket.org/ieedan/std)
- [azure/ieedan/std/std](https://dev.azure.com/ieedan/_git/std)
