<!-- PR title = squash-merge commit message → drives automated versioning.
     Format:   type: short description          (e.g. feat: add contact search)
     Breaking: feat!: short description         (→ major release)
     No release: chore: / ci: / test: / build:

     Allowed types: feat · fix · perf · refactor · docs · chore · ci · test · build -->

## What changed and why

<!-- Briefly describe what this PR does and the motivation behind it. Link the related issue. -->

Closes #

## Breaking changes

<!-- Required when the PR title uses ! (e.g. feat!:) or the body contains BREAKING CHANGE:.
     Describe exactly what breaks and how consumers need to migrate. -->

N/A

## Checklist

### Code quality
- [ ] Every function has an explicit return type (`explicit-function-return-type`)
- [ ] Every class member has an explicit access modifier (`explicit-member-accessibility`)
- [ ] No non-null assertions (`!`) outside of `*.test.ts` files
- [ ] No floating promises (every `Promise` is awaited or explicitly handled)
- [ ] No `any` types (`no-explicit-any`)
- [ ] Type-only imports use `import type` (`consistent-type-imports`)
- [ ] No implicit boolean coercions — use strict comparisons (`strict-boolean-expressions`)
- [ ] `async` functions contain at least one `await` (`require-await`)
- [ ] No Promises in `forEach` / `if` conditions (`no-misused-promises`)
- [ ] All `switch` statements over union types are exhaustive (`switch-exhaustiveness-check`)

### Tests
- [ ] New functionality is covered by unit tests (colocated `*.test.ts`)
- [ ] `npm test` passes locally (build + jest + 80% coverage)
- [ ] No `test.only` or `describe.only` left in test files

### Linting
- [ ] `npm run lint:eslint` passes
- [ ] `npm run lint:prettier` passes
- [ ] `npm run lint:types` passes
- [ ] `npm run lint:knip` passes (no unused exports or files)
- [ ] `npm run lint:md` passes (markdown syntax)
- [ ] `npm run lint:publint` passes (package exports correctly configured)

### Documentation
- [ ] README.md updated if public API changed (`## Installation` and `## Usage` sections present)

### Release
- [ ] PR title follows conventional commits format
