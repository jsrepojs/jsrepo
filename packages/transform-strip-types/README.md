# @jsrepo/transform-prettier

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/transform-strip-types?color=pink)](https://npmjs.com/package/@jsrepo/transform-strip-types)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-strip-types?color=pink)](https://npmjs.com/package/@jsrepo/transform-strip-types)

A transform plugin for stripping types from TypeScript code before adding it to your project. It also renames TypeScript files to JavaScript files.

> [!NOTE]
> You might consider using this alongside a formatting plugin like [@jsrepo/transform-prettier](https://npmjs.com/package/@jsrepo/transform-prettier) or [@jsrepo/transform-biome](https://npmjs.com/package/@jsrepo/transform-biome) to ensure the code is formatted correctly.

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform strip-types
# or initialize any jsrepo project with the --js flag
jsrepo init @ieedan/std --js
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-strip-types -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import stripTypes from "@jsrepo/transform-strip-types";

export default defineConfig({
	transforms: [stripTypes()],
});
```