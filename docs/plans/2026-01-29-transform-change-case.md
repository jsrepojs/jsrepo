# Transform Change Case Package

Introduce a new transform package `@jsrepo/transform-change-case` that transforms file name cases based on user configuration. Supports multiple case formats: kebab-case, camelCase, snake_case, and PascalCase.

## Context

- Files involved: new package at `packages/transform-change-case/`
- Related patterns: follows transform-javascript and transform-oxfmt patterns
- Dependencies: `change-case` npm package for case transformations

## Implementation Notes

- **Testing approach**: TDD (write tests first)
- Complete each task fully before moving to the next
- Follow existing transform package structure from transform-javascript
- **CRITICAL: every task MUST include new/updated tests**
- **CRITICAL: all tests must pass before starting next task**

## Task 1: Create package structure

**Files:**
- Create: `packages/transform-change-case/package.json`
- Create: `packages/transform-change-case/tsconfig.json`
- Create: `packages/transform-change-case/tsdown.config.ts`
- Create: `packages/transform-change-case/biome.json`

Steps:
- [x] create package.json following transform-javascript pattern with:
  - name: `@jsrepo/transform-change-case`
  - peer dependency on `jsrepo` workspace
  - dependency on `change-case` package
  - dev dependencies: vitest, typescript, tsdown, @types/node (from catalog)
  - scripts: build, dev, check, test
- [x] create tsconfig.json matching transform-javascript
- [x] create tsdown.config.ts matching transform-javascript
- [x] create biome.json matching transform-javascript
- [x] run `pnpm install` to update lockfile

## Task 2: Implement core transform with tests (TDD)

**Files:**
- Create: `packages/transform-change-case/tests/change-case.test.ts`
- Create: `packages/transform-change-case/src/index.ts`

Steps:
- [ ] write tests for the transform covering:
  - converting kebab-case filename to camelCase
  - converting camelCase filename to kebab-case
  - converting to snake_case
  - converting to PascalCase
  - preserving file extension during conversion
  - handling filenames with directories (e.g., `components/my-component.ts`)
  - no transformation when case matches target
  - handling edge cases (single word, already correct case)
- [ ] implement the transform function that:
  - accepts options with target case type: `kebab`, `camel`, `snake`, `pascal`
  - returns Transform with transform method
  - extracts filename from path, transforms case, reconstructs path
  - returns `{ code, fileName }` with transformed filename
  - code passes through unchanged (this transform only modifies filenames)
- [ ] run `pnpm test` in package - must pass before task 3

## Task 3: Register as official plugin

**Files:**
- Modify: `packages/jsrepo/src/utils/config/mods/add-plugins.ts`

Steps:
- [ ] add entry to OFFICIAL_PLUGINS array:
  - shorthand: `change-case`
  - name: `@jsrepo/transform-change-case`
- [ ] run `pnpm build` in jsrepo package
- [ ] verify no type errors with `pnpm check`

## Task 4: Add documentation

**Files:**
- Create: `apps/docs/content/docs/transforms/change-case.mdx`

Steps:
- [ ] create documentation page following javascript.mdx pattern with:
  - title and description
  - BadgeGroup with SourceBadge, OfficialBadge, NpmBadge
  - installation section showing `jsrepo config transform change-case`
  - configuration example showing options
  - before/after examples for each case type
  - supported case types table

## Task 5: Add changeset

**Files:**
- Create: `.changeset/<generated-name>.md`

Steps:
- [ ] run `pnpm changeset` to generate changeset
- [ ] set package `@jsrepo/transform-change-case` as minor (new feature)
- [ ] write description: "feat: Add transform-change-case package for filename case transformations"

## Verification

- [ ] manual test: configure transform in a test project and verify filename case changes
- [ ] run full test suite: `pnpm test` from root
- [ ] run linter: `pnpm check` from root
- [ ] run build: `pnpm build` from root
- [ ] verify package exports work correctly

## Documentation Updates

- [ ] move this plan to `docs/plans/completed/`
