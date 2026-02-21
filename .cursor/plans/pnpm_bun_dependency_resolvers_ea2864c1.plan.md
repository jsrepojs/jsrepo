---
name: pnpm/bun dependency resolvers
overview: Create @jsrepo/pnpm and @jsrepo/bun packages that export resolver functions (`pnpm` and `bun`) for resolving workspace and catalog protocol versions to concrete semver strings, plugging into `build.remoteDependencyResolver` in jsrepo config.
todos:
  - id: jsrepo-export
    content: Export RemoteDependencyResolverOptions from jsrepo/api/config
    status: completed
  - id: pnpm-scaffold
    content: "@jsrepo/pnpm - Create package scaffold (package.json, tsdown, tsconfig)"
    status: completed
  - id: pnpm-workspace
    content: "@jsrepo/pnpm - Implement workspace discovery (find pnpm-workspace.yaml, expand globs, build package map)"
    status: completed
  - id: pnpm-catalog
    content: "@jsrepo/pnpm - Implement catalog parsing and lookup from pnpm-workspace.yaml"
    status: completed
  - id: pnpm-resolver
    content: "@jsrepo/pnpm - Implement pnpm resolver with workspace + catalog resolution and caching"
    status: completed
  - id: bun-scaffold
    content: "@jsrepo/bun - Create package scaffold (package.json, tsdown, tsconfig)"
    status: completed
  - id: bun-workspace
    content: "@jsrepo/bun - Implement workspace discovery (find root package.json with workspaces, expand globs, build package map)"
    status: completed
  - id: bun-resolver
    content: "@jsrepo/bun - Implement bun resolver with workspace resolution and caching"
    status: completed
  - id: pnpm-tests
    content: "@jsrepo/pnpm - Add unit tests with pnpm workspace fixtures"
    status: completed
  - id: bun-tests
    content: "@jsrepo/bun - Add unit tests with bun workspace fixtures"
    status: completed
isProject: false
---

# pnpm and bun Remote Dependency Resolver Packages

## Context

`[RemoteDependencyResolver](packages/jsrepo/src/utils/config/index.ts)` in jsrepo receives each `RemoteDependency` and `RemoteDependencyResolverOptions`, and returns a resolved dependency with concrete versions. This enables registry builds that use `workspace:*` or `catalog:` in source `package.json` files to output publishable manifests with real versions.

**Current signature:**

```ts
type RemoteDependencyResolverOptions = { cwd: AbsolutePath };

type RemoteDependencyResolver = (
  dep: RemoteDependency,
  options: RemoteDependencyResolverOptions
) => MaybePromise<RemoteDependency>;
```

The build process passes `{ cwd }` on every call ([build.ts:887](packages/jsrepo/src/utils/build.ts)) — resolvers receive `cwd` from the framework and do not need to capture or accept it at creation time.

## Package Structure

Both packages follow the existing pattern (e.g. [@jsrepo/transform-prettier](packages/transform-prettier/package.json), [@jsrepo/shadcn](packages/shadcn/package.json)):

- New directories: `packages/pnpm/` and `packages/bun/`
- Build with tsdown (E SM only)
- Peer dependency on `jsrepo` for `RemoteDependency`, `RemoteDependencyResolver`, and `RemoteDependencyResolverOptions` types
- Add both to `pnpm-workspace.yaml` (already uses `packages/*` glob)

## API Design

**Resolver functions** — each IS a `RemoteDependencyResolver` (no builder, no options at creation):

```ts
// @jsrepo/pnpm
export const pnpm: RemoteDependencyResolver;

// @jsrepo/bun  
export const bun: RemoteDependencyResolver;
```

- `cwd` is provided per-call via `options.cwd`; resolvers should use `options.cwd` for workspace/catalog discovery
- Both resolvers will be async (file I/O for workspace/catalog parsing)
- **Caching:** Parse workspace/catalog files keyed by `options.cwd` and cache to avoid re-parsing on every dep during a build

**Export from jsrepo:** Ensure `[api/config.ts](packages/jsrepo/src/api/config.ts)` exports `RemoteDependencyResolverOptions` so the packages can type the second parameter.

**Usage in jsrepo config:**

```ts
import { defineConfig } from "jsrepo";
import { pnpm } from "@jsrepo/pnpm";

export default defineConfig({
  build: {
    remoteDependencyResolver: pnpm,
  },
});
```

---

## TODOs

- **jsrepo-export** — Export `RemoteDependencyResolverOptions` from jsrepo `api/config`
- **pnpm-scaffold** — @jsrepo/pnpm: Create package scaffold (package.json, tsdown, tsconfig)
- **pnpm-workspace** — @jsrepo/pnpm: Implement workspace discovery (find pnpm-workspace.yaml, expand globs, build package map)
- **pnpm-catalog** — @jsrepo/pnpm: Implement catalog parsing and lookup from pnpm-workspace.yaml
- **pnpm-resolver** — @jsrepo/pnpm: Implement pnpm resolver with workspace + catalog resolution and caching
- **bun-scaffold** — @jsrepo/bun: Create package scaffold (package.json, tsdown, tsconfig)
- **bun-workspace** — @jsrepo/bun: Implement workspace discovery (find root package.json with workspaces, expand globs, build package map)
- **bun-resolver** — @jsrepo/bun: Implement bun resolver with workspace resolution and caching
- **pnpm-tests** — @jsrepo/pnpm: Add unit tests with pnpm workspace fixtures
- **bun-tests** — @jsrepo/bun: Add unit tests with bun workspace fixtures

---

## Testing Plan

Both packages use vitest (like [transform-filecasing](packages/transform-filecasing)). Each has its own `tests/` folder and `tests/fixtures/` with a minimal workspace layout. Add `"test": "vitest"` to package.json scripts.

### @jsrepo/pnpm fixtures

Create `packages/pnpm/tests/fixtures/pnpm-workspace/`:

- `pnpm-workspace.yaml` with `packages: ["packages/*"]`, `catalog: { lodash: "^4.17.21" }`, optional `catalogs: { deps: { react: "^18.0.0" } }`
- `packages/pkg-a/package.json` — `{ "name": "pkg-a", "version": "1.2.3" }`
- `packages/pkg-b/package.json` — `{ "name": "pkg-b", "version": "2.0.0" }`

### @jsrepo/pnpm test cases

- Resolves `workspace:`* to exact version (e.g. `pkg-a` → `1.2.3`)
- Resolves `workspace:^` to `^<version>`
- Resolves `workspace:~` to `~<version>`
- Resolves `workspace:1.0.0` to `1.0.0` (literal)
- Resolves `catalog:` (default) to catalog version
- Resolves `catalog:deps` (named) to named catalog version
- Returns dep unchanged when version is not workspace/catalog (e.g. `^1.0.0`)
- Throws when workspace package not found
- Throws when catalog entry not found
- Uses `options.cwd` for discovery (pass fixtures path)
- Caching: multiple resolutions with same cwd do not re-parse

### @jsrepo/bun fixtures

Create `packages/bun/tests/fixtures/bun-workspace/`:

- `package.json` with `workspaces: ["packages/*"]` (array format)
- `packages/foo/package.json` — `{ "name": "foo", "version": "3.0.1" }`
- `packages/bar/package.json` — `{ "name": "bar", "version": "0.1.0" }`

Optional second fixture for object format: `workspaces: { packages: ["packages/*"] }`

### @jsrepo/bun test cases

- Resolves `workspace:`* to exact version (e.g. `foo` → `3.0.1`)
- Resolves `workspace:^` to `^<version>`
- Resolves `workspace:~` to `~<version>`
- Resolves `workspace:1.0.0` to `1.0.0`
- Returns dep unchanged when version is not workspace
- Throws when workspace package not found
- Supports `workspaces: ["packages/*"]` (array)
- Supports `workspaces: { packages: ["packages/*"] }` (object)
- Uses `options.cwd` for discovery
- Caching: multiple resolutions with same cwd do not re-parse

### Integration (optional)

Add a test in [jsrepo `build.test.ts](packages/jsrepo/tests/build.test.ts)` that runs a build with `remoteDependencyResolver: pnpm` using the existing build fixtures. The fixtures cwd (`packages/jsrepo/tests/fixtures/build`) walks up to the monorepo root, so the pnpm resolver should resolve `catalog:` and `workspace:`* deps from the jsrepo monorepo.

---

## @jsrepo/pnpm

**Resolves:** workspace protocol and catalog protocol.

### Workspace protocol (from [pnpm docs](https://pnpm.io/workspaces))


| Input version             | Resolved output                           |
| ------------------------- | ----------------------------------------- |
| `workspace:`*             | Exact version from workspace package      |
| `workspace:^`             | `^<version>`                              |
| `workspace:~`             | `~<version>`                              |
| `workspace:1.0.0`         | `1.0.0`                                   |
| `workspace:../path`       | Version from package at that path         |
| `workspace:foo@`* (alias) | `npm:foo@<version>` (name stays as alias) |


### Catalog protocol (from [pnpm catalogs](https://pnpm.io/catalogs))


| Input version                   | Resolved output                                       |
| ------------------------------- | ----------------------------------------------------- |
| `catalog:` or `catalog:default` | Version from `catalog` in `pnpm-workspace.yaml`       |
| `catalog:name`                  | Version from `catalogs.name` in `pnpm-workspace.yaml` |


### Implementation approach

1. **Discover workspace root:** Walk up from `options.cwd` to find `pnpm-workspace.yaml`.
2. **Parse `pnpm-workspace.yaml`:** Use a YAML parser (e.g. `yaml` or built-in) to read `packages`, `catalog`, and `catalogs`.
3. **Expand workspace globs:** Use `fast-glob` (or similar, already in jsrepo) to resolve `packages/`* etc. to package directories.
4. **Build workspace package map:** For each matched directory, read `package.json` and map `name` -> `version`.
5. **Build catalog map:** Merge `catalog` and `catalogs.`* into a lookup by package name (and catalog name for named catalogs).
6. **Cache:** Store parsed workspace/catalog state in a module-level `Map<cwd, ParsedState>`; look up on first resolution for a given cwd.
7. **Resolve function:** For each `RemoteDependency`:
  - If `version` matches `workspace:`*, `workspace:^`, etc.: look up `dep.name` in workspace map (or parse alias from `workspace:foo@`*), apply semver transformation, return `{ ...dep, version }`.
  - If `version` matches `catalog:` or `catalog:name`: look up `dep.name` in catalog, return `{ ...dep, version }`.
  - Otherwise: return `dep` unchanged.

---

## @jsrepo/bun

**Resolves:** workspace protocol only (per your spec).

### Workspace protocol (from [bun docs](https://bun.com/docs/install/workspaces))


| Input version     | Resolved output |
| ----------------- | --------------- |
| `workspace:`*     | Exact version   |
| `workspace:^`     | `^<version>`    |
| `workspace:~`     | `~<version>`    |
| `workspace:1.0.0` | `1.0.0`         |


### Implementation approach

1. **Discover workspace root:** Walk up from `options.cwd` to find a `package.json` with a `workspaces` field.
2. **Parse workspaces:** Bun uses either `workspaces: ["packages/*"]` or `workspaces: { packages: ["packages/*"] }`.
3. **Expand globs:** Resolve workspace patterns to package directories.
4. **Build workspace package map:** Same as pnpm — read each `package.json`, map `name` -> `version`.
5. **Cache:** Store parsed workspace state in a module-level `Map<cwd, WorkspaceState>`; look up on first resolution for a given cwd.
6. **Resolve function:** For `workspace:`*, `workspace:^`, `workspace:~`, `workspace:1.0.0` — lookup and transform; otherwise return `dep` unchanged.

*Note: Bun also supports catalogs via root `package.json`, but you specified workspace-only for bun, so we will not implement catalog resolution in @jsrepo/bun.*

---

## Files to Create

### @jsrepo/pnpm


| File                                           | Purpose                                                       |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `packages/pnpm/package.json`                   | Package manifest, peerDep on jsrepo                           |
| `packages/pnpm/tsdown.config.ts`               | Build config                                                  |
| `packages/pnpm/tsconfig.json`                  | TypeScript config (copy from transform-prettier)              |
| `packages/pnpm/src/index.ts`                   | Export `pnpm` resolver (implement `RemoteDependencyResolver`) |
| `packages/pnpm/src/workspace.ts`               | Workspace discovery and package mapping                       |
| `packages/pnpm/src/catalog.ts`                 | Catalog parsing and lookup                                    |
| `packages/pnpm/tests/pnpm.test.ts`             | Unit tests for pnpm resolver                                  |
| `packages/pnpm/tests/fixtures/pnpm-workspace/` | Fixture: minimal pnpm workspace with catalog                  |


### @jsrepo/bun


| File                            | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `packages/bun/package.json`     | Package manifest, peerDep on jsrepo                          |
| `packages/bun/tsdown.config.ts` | Build config                                                 |
| `packages/bun/tsconfig.json`    | TypeScript config                                            |
| `packages/bun/src/index.ts`     | Export `bun` resolver (implement `RemoteDependencyResolver`) |
| `packages/bun/src/workspace.ts` | Workspace discovery and package mapping                      |


---

## Shared Considerations

1. **Caching:** Parse workspace/catalog files once per `options.cwd` and cache in a module-level Map. The resolver is invoked once per dependency during a build, so caching by cwd avoids redundant file I/O.
2. **Missing workspace/catalog:** If `options.cwd` is not in a pnpm/bun workspace, or a reference cannot be resolved, throw (recommend throwing for clarity).
3. **Dependencies:** Both will need:
  - `pathe` (path resolution; already used in jsrepo)
  - YAML parser for pnpm (e.g. `yaml` — check if jsrepo already has one, or use a lightweight alternative)
  - `fast-glob` or similar for workspace glob expansion (jsrepo has `fast-glob`)
  - `fs` / `path` for reading files
4. **Type import:** Import `RemoteDependency`, `RemoteDependencyResolver`, and `RemoteDependencyResolverOptions` from `jsrepo/config`. Add `RemoteDependencyResolverOptions` to the exports in [api/config.ts](packages/jsrepo/src/api/config.ts) if not already present.

---

## Optional: Shared Core

If the workspace resolution logic is similar between pnpm and bun, consider a small shared module or duplicated logic. Given the different config file shapes (pnpm-workspace.yaml vs package.json), some divergence is expected; start with clear separate implementations and refactor if needed.

---

## Out of Scope (for initial implementation)

- Catalog resolution in @jsrepo/bun
- `workspace:../path` for bun (if it differs from pnpm)
- Re-exports from main jsrepo package

