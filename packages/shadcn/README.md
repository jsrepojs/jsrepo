# @jsrepo/shadcn

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/shadcn?color=pink)](https://npmjs.com/package/@jsrepo/shadcn)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/shadcn?color=pink)](https://npmjs.com/package/@jsrepo/shadcn)

A package to help you distribute your jsrepo registry as a shadcn registry.

## Usage

Install the package:

```sh
pnpm install @jsrepo/shadcn
```

Use the output to output a shadcn registry:

```ts
import { defineConfig } from "jsrepo";
import { output } from "@jsrepo/shadcn/output";

export default defineConfig({
	registry: {
        // ...
		outputs: [output({ dir: "./public/r/shadcn" })],
	},
});
```

> [!IMPORTANT]
> If you have multiple outputs you need to ensure that the directory is unique for each output. jsrepo outputs will conflict with shadcn outputs.

If you want to ensure compatibility with the shadcn registry while losing access to some of the features of the jsrepo registry you can use the `defineShadcnRegistry` function. This can also be useful for incremental adoption as it closely matches the shadcn registry schema.

```ts
import { defineShadcnRegistry, output } from "@jsrepo/shadcn";

export default defineConfig({
	registry: defineShadcnRegistry({
		// ...
        // make sure you still include the output
        outputs: [output({ dir: "./public/r/shadcn" })],
	}),
});
```