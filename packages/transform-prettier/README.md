# @jsrepo/transform-prettier

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/transform-prettier)](https://npmjs.com/package/@jsrepo/transform-prettier)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-prettier)](https://npmjs.com/package/@jsrepo/transform-prettier)

A transform plugin for formatting registry items with Prettier using your local Prettier configuration before they are added to your project.

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform @jsrepo/transform-prettier
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-prettier -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import prettier from "@jsrepo/transform-prettier";

export default defineConfig({
	transforms: [prettier()],
});
```