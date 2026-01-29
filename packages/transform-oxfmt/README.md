# @jsrepo/transform-oxfmt

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/transform-oxfmt?color=pink)](https://npmjs.com/package/@jsrepo/transform-oxfmt)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-oxfmt?color=pink)](https://npmjs.com/package/@jsrepo/transform-oxfmt)

A transform plugin for formatting registry items with oxfmt (the Oxc formatter) before they are added to your project.

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform @jsrepo/transform-oxfmt
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-oxfmt -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import oxfmt from "@jsrepo/transform-oxfmt";

export default defineConfig({
	transforms: [oxfmt()],
});
```

### Options

The transform accepts oxfmt's `FormatOptions` to customize formatting behavior:

```ts
import { defineConfig } from "jsrepo";
import oxfmt from "@jsrepo/transform-oxfmt";

export default defineConfig({
	transforms: [oxfmt({ semi: false })],
});
```
