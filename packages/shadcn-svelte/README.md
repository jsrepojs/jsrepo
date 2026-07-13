# @jsrepo/shadcn-svelte

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/shadcn-svelte)](https://npmjs.com/package/@jsrepo/shadcn-svelte)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/shadcn-svelte)](https://npmjs.com/package/@jsrepo/shadcn-svelte)

A package to help you distribute your jsrepo registry as a shadcn-svelte registry.

## Usage

Install the package:

```sh
pnpm install @jsrepo/shadcn-svelte -D
```

Use the output to output a shadcn-svelte registry:

```ts
import { defineConfig } from "jsrepo";
import { output } from "@jsrepo/shadcn-svelte/output";

export default defineConfig({
	registry: {
        // ...
		outputs: [output({ dir: "./public/r" })],
	},
});
```

If you want to ensure compatibility with the shadcn registry while losing access to some of the features of the jsrepo registry you can use the `defineShadcnSvelteRegistry` function. This can also be useful for incremental adoption as it closely matches the shadcn registry schema.

```ts
import { defineShadcnSvelteRegistry, output } from "@jsrepo/shadcn-svelte";

export default defineConfig({
	registry: defineShadcnSvelteRegistry({
		// ...
        // make sure you still include the output
        outputs: [output({ dir: "./public/r" })],
	}),
});
```