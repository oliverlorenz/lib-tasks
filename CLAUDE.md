# CLAUDE.md

TypeScript library template. Published as `@oliverlorenz/<REPO_NAME>` to the GitHub npm registry.

## Commands

```bash
npm test              # build + jest with coverage (also runs on pre-commit)
npm run test:watch    # jest watch mode with HTML coverage
npm run build         # tsc compile → dist/
npm run lint:eslint   # ESLint (also runs on pre-push)
npm run lint:prettier # Prettier format check (also runs on pre-push)
npm run lint:types    # tsc --noEmit + tsc-strict plugin
npm run lint:knip     # knip — unused exports, files, dependencies
npm run lint:md       # markdownlint — markdown syntax in all *.md files
npm run lint:readme   # check README.md has required sections (Installation, Usage)
npm run lint:links    # check all links in README.md are reachable (local only, not in CI)
npm run lint:publint  # publint — package.json exports/main/types correctly configured
npm run lint:attw     # are-the-types-wrong — TypeScript types correctly exported (needs dist/)
npm run lint:audit    # audit-ci — fail on high-severity dependency vulnerabilities
npm run check:all     # run all git hooks locally
```

Git hooks: pre-commit runs `test`; pre-push runs `lint:eslint && lint:prettier && test`.

**Before every commit:** run `npm run lint:eslint && npm run lint:prettier` and fix all issues first. The pre-push hook will catch failures anyway, but fixing them before commit avoids a broken commit history.

## Release & versioning

Releases are fully automated via `semantic-release`. No manual steps required after merging.

**The PR title is the release signal.** Because all PRs are squash-merged, the PR title becomes the commit message on `main`. `semantic-release` reads these commits to determine the version bump, generate `CHANGELOG.md`, create the GitHub Release, and publish to GitHub Packages.

| PR title prefix | Version bump | In release notes |
| --- | --- | --- |
| `feat: …` | minor (1.**x**.0) | ✅ Features |
| `fix: …` | patch (1.x.**x**) | ✅ Bug Fixes |
| `perf: …` / `revert: …` | patch (1.x.**x**) | ✅ |
| `feat!: …` or `BREAKING CHANGE:` in body | major (**x**.0.0) | ✅ Breaking |
| `refactor: …` / `docs: …` / `chore: …` / `ci: …` / `test: …` / `build: …` | no release | — |

**When writing PR titles:**

- Use imperative, lowercase: `feat: add group search` not `feat: Added group search`
- Scope is optional: `feat(groups): add search` is fine
- Breaking change via `!` suffix: `feat!: change constructor signature`
- For breaking changes, also fill in the "Breaking changes" section of the PR template with migration instructions

**Do not:**

- Create `chore(release): …` commits manually — those are written back by `semantic-release`
- Bump the version in `package.json` manually — `semantic-release` owns the version
- Edit `CHANGELOG.md` manually — it is auto-generated

## Domain structure

Each domain lives in its own folder and is self-contained:

```text
src/
  <domain>/
    <domain>.service.ts        - Service class (business logic)
    <domain>.service.test.ts   - Service unit tests
    <domain>.mapper.ts         - Mapper class (optional, when API↔domain mapping needed)
    <domain>.mapper.test.ts    - Mapper unit tests
    <domain>.types.ts          - Domain types (plain `type`, no classes)
    <domain>.mocks.ts          - Shared test fixtures and mock instances
    index.ts                   - Barrel re-exports all public symbols
  index.ts                     - Re-exports every domain barrel
```

Every domain folder exposes a barrel `index.ts` that re-exports all public symbols. Imports between domains must go through the barrel, never directly into another domain's files.

## Naming conventions

- `XxxService` — class, accepts dependencies via constructor, executes operations
- `XxxMapper` — class, maps between API response types and domain types (not every domain needs one)
- `xxx.types.ts` — domain model types and enums (plain TypeScript `type`, never a class)
- `xxx.mocks.ts` — shared test fixtures and mock instances
- File names: kebab-case (e.g., `group.service.ts`, `group.mapper.ts`)
- Class/interface/enum/type names: PascalCase
- Variable/property names: camelCase
- Function names: verb-heavy and explicit about intent, e.g. `findUserById`, `deactivateUserAndRevokeSessions`

## Coding principles

- **Single Responsibility:** each function/class/module does one thing well
- **Stateless services:** no shared mutable state, no internal caches — pass all needed data as parameters or inject as dependencies
- **OrFail pattern:** for every operation provide two variants:
  - Base: returns `T | undefined` (never `null`)
  - Strict: calls the base and throws a descriptive `Error` if the result is `undefined` — suffix `OrFail`
  - Do not mix return-based and exception-based flows in one function
- **Dependency injection:** all configuration and collaborators are passed in via constructor or parameters — no hidden state, no static dependencies
- **Domain-Driven Design:** organize code by domain concept, not by technical layer; core business logic is isolated from frameworks
- Use classes for **Services** and **Mappers**; use plain `type` for domain data structures — never a class for types

## Patterns

### Service class

Accepts dependencies directly via constructor. Has a `static createInstance(...)` factory:

```ts
export class GroupService {
  constructor(private readonly axios: AxiosInstance) {}

  public static createInstance(axios: AxiosInstance): GroupService {
    return new GroupService(axios);
  }

  public async getGroups(): Promise<Group[] | undefined> {
    const response = await this.axios.get<Group[]>('/groups');
    return response.data;
  }

  public async getGroupsOrFail(): Promise<Group[]> {
    const result = await this.getGroups();
    if (!result) throw new Error('Failed to get groups: No response');
    return result;
  }
}
```

### Domain model types

Plain TypeScript `type`, no classes. Use `CamelCasedPropertiesDeep` from `type-fest` to map snake_case API responses to camelCase:

```ts
import { CamelCasedPropertiesDeep } from 'type-fest';

export type Group = CamelCasedPropertiesDeep<{
  group_id: string;
  group_name: string;
}>;
```

### Mapper class

Maps between raw API responses and domain types:

```ts
export class GroupMapper {
  public static fromApiResponse(raw: RawGroup): Group {
    return {
      groupId: raw.group_id,
      groupName: raw.group_name,
    };
  }
}
```

### Mocks file

Shared fixtures and mock instances for tests, colocated with the domain:

```ts
import { mock } from 'jest-mock-extended';
import type { GroupService } from './group.service';
import type { Group } from './group.types';

export const mockGroupService = mock<GroupService>();
export const mockGroup: Group = { groupId: '1', groupName: 'Test' };
```

## TypeScript rules

Strict mode is fully enabled. The ESLint config enforces:

- `@typescript-eslint/explicit-function-return-type: error` — every function needs an explicit return type
- `@typescript-eslint/explicit-member-accessibility: error` — every class member needs `public`/`private`/`protected` (constructors excluded)
- `@typescript-eslint/no-non-null-assertion: error` — no `!` operator (disabled in `*.test.ts`)
- `@typescript-eslint/no-floating-promises: error` — all promises must be awaited or explicitly handled
- `@typescript-eslint/no-unused-vars: error` — underscore prefix `_foo` exempts from the rule
- `check-file/filename-naming-convention: error` — all `.ts` files in `src/` must use KEBAB_CASE
- `@typescript-eslint/naming-convention: error` — classes/interfaces/enums/typeAliases must be PascalCase
- `@typescript-eslint/consistent-type-imports: error` — type-only imports must use `import type`
- `@typescript-eslint/strict-boolean-expressions: error` — no implicit boolean coercions (`if (str)` → `if (str !== '')`)
- `@typescript-eslint/prefer-nullish-coalescing: error` — use `??` instead of `||` for null/undefined fallbacks
- `@typescript-eslint/no-unnecessary-condition: error` — no always-true or always-false conditions
- `@typescript-eslint/member-ordering: error` — class member order: static fields → static methods → constructor → instance fields → public methods → private methods
- `no-only-tests/no-only-tests: error` — no `test.only` or `describe.only` in test files
- `@typescript-eslint/require-await: error` — `async` functions must contain at least one `await`
- `@typescript-eslint/no-misused-promises: error` — no Promises in `forEach`, `if()` conditions etc.
- `@typescript-eslint/switch-exhaustiveness-check: error` — switch over union types must cover all cases
- No comments describing what code does — prefer self-documenting names

## Testing

- Test files colocated with source: `group.service.test.ts` next to `group.service.ts`
- Use `jest-mock-extended` (`mock<T>()`) to mock dependencies
- Coverage threshold: 80% branches, functions, lines, statements
- Tests must be deterministic and stateless — no reliance on external systems
- Follow Arrange-Act-Assert (AAA) pattern; each test covers exactly one behavior
- Use descriptive test names that explain the scenario and expected outcome
- Do not write tests for `*.types.ts` files
- Create mocks in `*.mocks.ts` files, not inline
- Cover both variants: the base (returns `undefined`) and the `OrFail` (throws)

## README

Every code change that adds, removes, or alters public API behaviour must also update `README.md`. This includes new methods, changed signatures, new types, and changed constructor parameters. The README is the primary documentation for library consumers.

## Workflow

**Every change starts with a GitHub Issue.**
Before any implementation begins, the requirements must be defined and captured in a GitHub Issue. Do not write any code, create branches, or open PRs until an Issue exists and the requirements are clear. Refuse to proceed without one.

**All changes land via Pull Request.**
No direct commits to `main`. Every change goes through a feature branch and a PR.

**At the start of every session:**
Run `git branch` and `git status` to confirm you are on `main` and the working tree is clean before starting new work.

## Requirements

- Node >= 22.0.0
- Publish target: `https://npm.pkg.github.com`
