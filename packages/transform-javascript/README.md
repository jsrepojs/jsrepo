# @jsrepo/transform-prettier

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/transform-javascript)](https://npmjs.com/package/@jsrepo/transform-javascript)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-javascript)](https://npmjs.com/package/@jsrepo/transform-javascript)

A transform plugin for transforming TypeScript registry items into JavaScript before adding them to your project.

> [!NOTE]
> You might consider using this alongside a formatting plugin like [@jsrepo/transform-prettier](https://npmjs.com/package/@jsrepo/transform-prettier) or [@jsrepo/transform-biome](https://npmjs.com/package/@jsrepo/transform-biome) to ensure the code is formatted correctly.

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform javascript
# or initialize any jsrepo project with the --js flag
jsrepo init @ieedan/std --js
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-javascript -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import javascript from "@jsrepo/transform-javascript";

export default defineConfig({
	transforms: [javascript()],
});
```