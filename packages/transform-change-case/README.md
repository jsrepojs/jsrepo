# @jsrepo/transform-change-case

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/transform-change-case)](https://npmjs.com/package/@jsrepo/transform-change-case)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-change-case)](https://npmjs.com/package/@jsrepo/transform-change-case)

A transform plugin for transforming file names to different case formats before they are added to your project.

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform change-case
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-change-case -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import changeCase from "@jsrepo/transform-change-case";

export default defineConfig({
    transforms: [changeCase({ to: "camel" })],
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `to` | `"kebab" \| "camel" \| "snake" \| "pascal"` | The target case format for file names |
