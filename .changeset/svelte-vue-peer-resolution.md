---
"jsrepo": patch
---

fix: resolve the `svelte`/`vue` compilers from the consumer's project directory instead of jsrepo's own install location, so builds no longer report `<pkg> is required for <lang> language support to work` when the framework is installed in the project but jsrepo lives in a different `node_modules`
