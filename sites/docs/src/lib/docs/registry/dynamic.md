---
title: Dynamic Registries
description: How to create dynamic registries in jsrepo.
lastUpdated: 4-10-2025
---

The final frontier of reusable code.

If you have ever used [shadcn](https://ui.shadcn.com) to install components from [v0](https://v0.dev) you are familiar with dynamic registries. They allow the server to serve different files to the CLI based on the route that was requested.

This is useful if your product generates code that you want to distribute through the **jsrepo** CLI.

To understand how to effectively create a dynamic registry in **jsrepo** you need to have a deeper understanding of the way that the manifest file works.

## How jsrepo locates files

The `jsrepo-manifest.json` includes all the blocks in your registry and their locations relative to the manifest file.

This means that you need to ensure that the files needed for your registry are served from the path that is inferred from the `jsrepo-manifest.json`.

For example take this manifest entry for a button component:

```jsonc showLineNumbers
{
    name: 'ui',
    blocks: [
        {
            name: 'button',
            directory: 'src/ui/button',
            category: 'ui',
            tests: false,
            subdirectory: true,
            list: true,
            files: ['button.svelte', 'index.ts'],
            localDependencies: ['utils/utils'],
            dependencies: [],
            devDependencies: [
                '@lucide/svelte@^0.475.0',
                'bits-ui@1.3.2',
                'tailwind-variants@^0.3.1'
            ],
            _imports_: {
                '$lib/utils/utils.js': '{{utils/utils}}.js'
            }
        }
    ]
},
```

The directory that the files for button live in is `src/ui/button` because the `directory` prop is set to `src/ui/button`.

Because of this **jsrepo** expects the files `button.svelte` and `index.ts` to exist at `src/ui/button/button.svelte` and `src/ui/button/index.ts` respectively.

## Dependencies

Any remote or local dependencies that need to be resolved should also be added to each block. In the case of the button component shown above. It has 3 remote dependencies and 1 local dependency.

Remote dependencies exist under `dependencies` or `devDependencies` and give the name of the package optionally followed by the version.

Local dependencies exist under `localDependencies` and reference other blocks in the registry and they are listed by `<category>/<block>`. In this case `utils/utils` is referring to the `utils` block in the `utils` category.

Local dependencies should also come with corresponding mappings in `_imports_`. The `_imports_` key maps literal import statements to a template that is replaced before adding blocks to your project. This allows users to put blocks anywhere in their project without breaking their code.

If you want dynamic blocks to depend on other blocks you will need to be able to add keys to `_imports_` to prevent breaking their code. Here is an example of how you might resolve the `utils` import from the button component above:

```js
// here we just replace everything except for the extension
// so it turns into {{utils/utils}}.js
import { cn } from '$lib/utils/utils.js';
// turns into {{utils/utils}}
import { cn } from '$lib/utils/utils';
// turns into {{utils/utils}}
import { cn } from '../utils/utils';
// if utils was a subdirectory with a file index.js
// turns into {{utils/utils}}/index.js
import { cn } from '../utils/utils/index.js';
```

Essentially the path to the local dependency is insignificant but the file or extension after it must be included.

## Type Definitions

Type definitions for the manifest can be acquired via the JS API:

```ts
import type { Manifest } from 'jsrepo';
```

## Conclusion

With all of this considered you can pretty easily create a dynamic **jsrepo** registry in a few minutes and start distributing components through the **jsrepo** CLI.

## Examples

- [github/ieedan/jsrepo-dynamic](https://github.com/ieedan/jsrepo-dynamic)
