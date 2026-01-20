# @jsrepo/autobuild

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/autobuild?color=pink)](https://npmjs.com/package/@jsrepo/autobuild)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/autobuild?color=pink)](https://npmjs.com/package/@jsrepo/autobuild)

A package to automatically collect and build your jsrepo registry.

## Usage

Install the package:

```sh
pnpm install @jsrepo/autobuild -D
```

Add the autobuild function to your config:

```ts
import { defineConfig } from "jsrepo";
import { autobuild } from "@jsrepo/autobuild";

export default defineConfig({
	registry: autobuild({
		name: "my-registry",
		// the directories to scan for items
		dirs: ['src/registry'],
		// ... build options
	}),
});
```
