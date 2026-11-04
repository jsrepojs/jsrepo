# @jsrepo/pnpm

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/pnpm)](https://npmjs.com/package/@jsrepo/pnpm)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/pnpm)](https://npmjs.com/package/@jsrepo/pnpm)

A remote dependency resolver for **jsrepo** that resolves pnpm `workspace:` and `catalog:` protocol versions to concrete semver strings during registry builds.

## Usage

Install the package:

```sh
pnpm install @jsrepo/pnpm -D
```

Add the plugin to your jsrepo config:

```ts
import { defineConfig } from "jsrepo";
import pnpm from "@jsrepo/pnpm";

export default defineConfig({
  plugins: [pnpm()],
});
```

Now your `workspace:` and `catalog:` versions will be resolved to concrete versions when building your registry.

You can also use the named `pnpm` export with the legacy `build.remoteDependencyResolver` option.
