---
'jsrepo': minor
---

feat: add a unified `plugins` option to the config. A plugin can add providers, languages, transforms and build settings (`build.transforms`, `build.remoteDependencyResolver`) from a single entry. Plugins are expected to be the default export of their package and can be added with the new `jsrepo config plugin` command. Registries can also now provide an array of `plugins` to install on `jsrepo init`. The `providers`, `languages`, `transforms` and `build` options and the existing `config` commands continue to work.
