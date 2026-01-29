# Add `@jsrepo/transform-oxfmt` package

Add a new transform package that formats code using oxfmt (the Oxc formatter). This follows the same pattern as the existing `transform-prettier` and `transform-biome` packages. oxfmt provides a programmatic `format` function from the `oxfmt` npm package with a simple async API: `format(filename, code, options)`.

## Context

- Files involved: New package at `packages/transform-oxfmt/`
- Related patterns: `packages/transform-prettier/` (closest analog - both are formatters with options)
- Dependencies: `oxfmt` (peer dependency), `jsrepo` (peer dependency via workspace)

## Approach

- **Testing approach**: Regular (code first, then tests)
- Follow the exact same package structure as `transform-prettier`
- oxfmt's `format` function is async and accepts `(filename, code, options)` returning `{ code }`
- The transform accepts `FormatOptions` from oxfmt so users can pass formatting preferences
- Errors during formatting are caught and return `undefined` (same pattern as other transforms)
- **CRITICAL: every task MUST include new/updated tests**
- **CRITICAL: all tests must pass before starting next task**

## Task 1: Create package scaffolding

**Files:**
- Create: `packages/transform-oxfmt/package.json`
- Create: `packages/transform-oxfmt/tsconfig.json`
- Create: `packages/transform-oxfmt/tsdown.config.ts`
- Create: `packages/transform-oxfmt/biome.json`

- [x] Create `packages/transform-oxfmt/package.json` following `transform-prettier` pattern:
  - Name: `@jsrepo/transform-oxfmt`
  - Description: "A transform plugin for jsrepo to format code with oxfmt."
  - Peer dependencies: `jsrepo: "workspace:*"`, `oxfmt: "0.x"`
  - Keywords: `jsrepo`, `transform`, `oxfmt`, `plugin`
  - Same exports, scripts, files, devDependencies pattern
- [x] Create `packages/transform-oxfmt/tsconfig.json` (copy from transform-prettier)
- [x] Create `packages/transform-oxfmt/tsdown.config.ts` (copy from transform-prettier)
- [x] Create `packages/transform-oxfmt/biome.json` (copy from transform-prettier)
- [x] Run `pnpm install` to link the new workspace package

## Task 2: Implement the transform

**Files:**
- Create: `packages/transform-oxfmt/src/index.ts`

- [x] Create `packages/transform-oxfmt/src/index.ts` implementing the transform:
  - Export default function accepting optional `FormatOptions` from oxfmt
  - Return a `Transform` object with async `transform` method
  - Use `format(fileName, code, options)` from `oxfmt`
  - Wrap in try/catch returning `undefined` on failure (matching existing pattern)
- [x] Run `pnpm check` in the package to verify types

## Task 3: Write tests

**Files:**
- Create: `packages/transform-oxfmt/tests/format.test.ts`

- [x] Create `packages/transform-oxfmt/tests/format.test.ts` with test cases:
  - Formats JavaScript code
  - Formats TypeScript code
  - Respects formatting options (e.g. `semi: false`)
  - Returns original code unchanged on unsupported file types (graceful failure)
- [x] Run `pnpm test` to verify all tests pass

## Task 4: Build and verify

- [x] Run `pnpm build` in the transform-oxfmt package
- [x] Run `pnpm check` across the monorepo
- [x] Run `pnpm test` across the monorepo

## Verification

- [ ] Run full test suite: `pnpm test`
- [ ] Run linter: `pnpm lint`
- [ ] Run type check: `pnpm check`
- [ ] Build the package: `pnpm --filter @jsrepo/transform-oxfmt build`

## Cleanup

- [ ] Move this plan to `docs/plans/completed/`
