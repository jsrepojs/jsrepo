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
| `transformDirectories` | `boolean` | Whether to transform directory segments in the path. When `false`, only the filename baseName is transformed. Defaults to `true` |

### Examples

Transform both directories and filenames (default behavior):

```ts
import { defineConfig } from "jsrepo";
import fileCasing from "@jsrepo/transform-filecasing";

export default defineConfig({
    // Config path: 'src/lib/components/ui'
    // Item path: 'button/index.ts'
    transforms: [fileCasing({ to: "pascal" })],
});
// Result: 'src/lib/components/ui/Button/Index.ts'
// Only the item's relative path is transformed, not the config path
```

Transform only filenames, preserve directory names:

```ts
import { defineConfig } from "jsrepo";
import fileCasing from "@jsrepo/transform-filecasing";

export default defineConfig({
    // Config path: 'src/lib/components/ui'
    // Item path: 'my-components/use-hook.ts'
    transforms: [fileCasing({ to: "camel", transformDirectories: false })],
});
// Result: 'src/lib/components/ui/my-components/useHook.ts'
// Only the filename is transformed, directories in the item path are preserved
```
