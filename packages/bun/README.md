# @jsrepo/bun

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/bun)](https://npmjs.com/package/@jsrepo/bun)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/bun)](https://npmjs.com/package/@jsrepo/bun)

A remote dependency resolver for **jsrepo** that resolves Bun `workspace:` protocol versions to concrete semver strings during registry builds.

## Usage

Install the package:

```sh
pnpm install @jsrepo/bun -D
```

Add the resolver to your jsrepo config:

```ts
import { defineConfig } from "jsrepo";
import { bun } from "@jsrepo/bun";

export default defineConfig({
  build: {
    remoteDependencyResolver: bun(),
  },
});
```

Now your `workspace:` versions will be resolved to concrete versions when building your registry.