# @jsrepo/transform-rtl

[![npm version](https://flat.badgen.net/npm/v/@jsrepo/transform-rtl)](https://npmjs.com/package/@jsrepo/transform-rtl)
[![npm downloads](https://flat.badgen.net/npm/dm/@jsrepo/transform-rtl)](https://npmjs.com/package/@jsrepo/transform-rtl)

A transform plugin for jsrepo that makes Tailwind CSS classes RTL-safe. It remaps physical directional classes (e.g. `left-`, `right-`, `ml-`, `mr-`) to logical equivalents (`start-`, `end-`, `ms-`, `me-`) and adds `rtl:` variants where needed (e.g. for `translate-x-`, `space-x-`, cursor resize).

## Usage

Run the following command to install and add the transform to your config:

```sh
jsrepo config transform @jsrepo/transform-rtl
```

### Manual Configuration

Install the transform plugin:

```sh
pnpm install @jsrepo/transform-rtl -D
```

Add the transform to your config:

```ts
import { defineConfig } from "jsrepo";
import rtl from "@jsrepo/transform-rtl";

export default defineConfig({
	transforms: [rtl()],
});
```

### Options

- **`extensions`** (optional): File extensions to transform. Default: `['.tsx', '.jsx', '.ts', '.js', '.svelte']`.
- **`classAttributes`** (optional): JSX/HTML attribute names that hold class names. Default: `['class', 'className']` (Svelte/HTML use `class`, React uses `className`).
- **`tailwindFunctions`** (optional): Names of Tailwind/class-name helper functions to transform. Default: `['cva', 'tv', 'cn', 'clsx']`.
  - `cva` and `tv`: first argument (base) and second argument (variants object) are scanned.
  - Others (e.g. `cn`, `clsx`): all arguments are scanned for class strings.

```ts
// Custom extensions and class attributes
rtl({ extensions: ['.tsx', '.svelte'], classAttributes: ['class', 'className'] })

// Add more tailwind functions
rtl({ tailwindFunctions: ['cva', 'tv', 'cn', 'clsx', 'twMerge'] })
```

## What it transforms

- **Direct replacement**: `ml-4` → `ms-4`, `text-left` → `text-start`, `rounded-l-md` → `rounded-s-md`, `border-r` → `border-e`, etc.
- **rtl: variant**: `translate-x-4` gets an additional `rtl:-translate-x-4`; `space-x-2` gets `rtl:space-x-reverse`; `cursor-e-resize` gets `rtl:cursor-w-resize`.
- **Supported contexts**: `className` and `classNames` JSX attributes (string or `cn()`), `cva()` base and variants, and `mergeProps` with `className`.

Based on [shadcn-ui's RTL transform](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/utils/transformers/transform-rtl.ts).
