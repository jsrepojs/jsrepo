# @jsrepo/transform-biome

[![npm version](https://flat.badgen.net/npm/v/@svecosystem/strip-types?color=pink)](https://npmjs.com/package/@jsrepo/transform-biome)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-biome?color=pink)](https://npmjs.com/package/@jsrepo/transform-biome)

A transform plugin for formatting registry items with Biome using your local biome configuration before they are added to your project.

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform @jsrepo/transform-biome
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-biome -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import biome from "@jsrepo/transform-biome";

export default defineConfig({
	transforms: [biome()],
});
```