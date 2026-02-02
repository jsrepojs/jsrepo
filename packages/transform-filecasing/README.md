# @jsrepo/transform-filecasing

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/transform-filecasing)](https://npmjs.com/package/@jsrepo/transform-filecasing)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-filecasing)](https://npmjs.com/package/@jsrepo/transform-filecasing)

A transform plugin for transforming file and folder names to different case formats before they are added to your project.

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform filecasing
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-filecasing -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import fileCasing from "@jsrepo/transform-filecasing";

export default defineConfig({
    transforms: [fileCasing({ to: "camel" })],
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `to` | `"kebab" \| "camel" \| "snake" \| "pascal"` | The target case format for file and folder names |
