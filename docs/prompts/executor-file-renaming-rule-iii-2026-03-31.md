# Cross-Package File Renaming — Constitution Rule III Compliance

**Severity:** P2 (medium) — naming convention violations across all 10 packages
**Scope:** shared, database, logger, event-bus, auth-core, session-manager, i18n-core, regional-engine, storage-engine, ux-helpers
**Date:** 2026-03-31
**Prerequisite:** Execute AFTER `executor-spec-sync-and-fixes-2026-03-31.md` is merged to main.

---

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md` — especially Rule III (File Naming)
- Workflow: `docs/developer/workflow-guide.md`

## Rule III Definition

From Constitution line 19:

> Files: `{Feature}.{type}.ts` (e.g. `user.service.ts`, `invoice.handler.ts`)

Every `.ts` source file (excluding `index.ts` barrels) MUST have at least two dot-separated segments before the `.ts` extension. The first segment is the feature/domain name, the second is the file type/role.

---

## Toolchain

### Superpowers (Required Skills)

| Skill                            | Purpose                          | When to use                                         |
| -------------------------------- | -------------------------------- | --------------------------------------------------- |
| `using-git-worktrees`            | Isolated feature branch          | Phase 0: before any file changes                    |
| `dispatching-parallel-agents`    | Concurrent independent subagents | Phase 1: dispatch 4 subagents (package groups)      |
| `verification-before-completion` | Evidence-based final check       | Phase 2: run ALL tests + build, paste actual output |

---

## Context

A comprehensive audit of all 10 packages found **37 source files** and **13 test files** violating Rule III. Files have single-segment names like `errors.ts`, `config.ts`, `types.ts` instead of the required `{Feature}.{type}.ts` pattern.

This prompt handles ONLY file renaming and import updates. No behavioral code changes. No test logic changes. No spec updates.

---

## Phase 0: Create Worktree

**Activate `using-git-worktrees`.** Branch: `refactor/rule-iii-file-renaming`

---

## Phase 1: Execute Renames

**Activate `dispatching-parallel-agents`.** Dispatch 4 subagents — one per package group.

**Critical instructions for ALL agents:**

1. **Use `git mv` for every rename** to preserve git history. Never delete+create.
2. **Update ALL imports** referencing the renamed file — both within the package AND in other packages that import it.
3. **Update `index.ts` barrel exports** if they reference the renamed file.
4. **Update `package.json` subpath exports** if they reference the renamed file's dist path.
5. **Update test files** — both rename the test file AND fix imports inside it.
6. **Do NOT update spec artifacts** (`spec.md`, `plan.md`, `tasks.md`) — spec updates referencing new filenames will be handled separately if needed.
7. **Do NOT change any code logic.** Only rename files and update import paths.
8. **Verify each package compiles** after all renames: `pnpm --filter @tempot/{package} build`
9. **Verify each package's tests pass** after all renames: `pnpm --filter @tempot/{package} test`
10. All import paths must include `.js` extension (ESM compliance).

### How to update imports

When renaming `src/types.ts` to `src/session.types.ts`:

```bash
# Step 1: Rename the file
git mv src/types.ts src/session.types.ts

# Step 2: Find all imports of the old path
# Search for: from './types' or from '../types' or from '../../src/types'
# Replace with the new path using the new filename (without .ts, with .js)
```

For cross-package imports (e.g., `@tempot/shared` re-exports), the barrel `index.ts` handles the mapping — update the barrel's internal import path.

---

### Agent 1: Foundation Packages (shared, database, logger)

**Packages:** `packages/shared`, `packages/database`, `packages/logger`
**Priority:** HIGH — these are depended on by all other packages.

#### 1A. @tempot/shared (2 source renames)

| #   | Current Path    | New Path               | Type   |
| --- | --------------- | ---------------------- | ------ |
| 1   | `src/errors.ts` | `src/shared.errors.ts` | source |
| 2   | `src/result.ts` | `src/shared.result.ts` | source |

**Import update scope:**

- `packages/shared/src/index.ts` — update barrel exports
- Search ALL 9 other packages for direct imports from `@tempot/shared` that might use subpath imports. Most will import from `@tempot/shared` (barrel) so no changes needed — but verify.

#### 1B. @tempot/database (4 source + 1 test rename)

| #   | Current Path                | New Path                           | Type   |
| --- | --------------------------- | ---------------------------------- | ------ |
| 1   | `src/config.ts`             | `src/database.config.ts`           | source |
| 2   | `src/drizzle/schema.ts`     | `src/drizzle/drizzle.schema.ts`    | source |
| 3   | `src/prisma/client.ts`      | `src/prisma/prisma.client.ts`      | source |
| 4   | `src/testing/test-db.ts`    | `src/testing/database.helper.ts`   | source |
| 5   | `tests/unit/client.test.ts` | `tests/unit/prisma.client.test.ts` | test   |

**CRITICAL — Subpath export update:**
In `packages/database/package.json`, the `"./testing"` export points to `./dist/testing/test-db.js`. After renaming `test-db.ts` to `database.helper.ts`, update:

```json
"./testing": {
  "import": "./dist/testing/database.helper.js",
  "types": "./dist/testing/database.helper.d.ts"
}
```

**Import update scope:**

- `packages/database/src/index.ts` — update barrel
- `packages/database/src/testing/index.ts` — update if exists
- All internal imports within `packages/database/src/` and `packages/database/tests/`
- Search other packages for `from '@tempot/database/testing'` — these use the subpath export and don't need source changes (the package.json update handles it), but verify they still work after the rename.

#### 1C. @tempot/logger (2 source + 1 test rename)

| #   | Current Path                    | New Path                              | Type   |
| --- | ------------------------------- | ------------------------------------- | ------ |
| 1   | `src/config.ts`                 | `src/logger.config.ts`                | source |
| 2   | `src/technical/serializer.ts`   | `src/technical/error.serializer.ts`   | source |
| 3   | `tests/unit/serializer.test.ts` | `tests/unit/error.serializer.test.ts` | test   |

**Import update scope:**

- `packages/logger/src/index.ts` — update barrel
- All internal imports within `packages/logger/src/` and `packages/logger/tests/`

**After completing all 3 packages, run:**

```bash
pnpm --filter @tempot/shared build
pnpm --filter @tempot/shared test
pnpm --filter @tempot/database build
pnpm --filter @tempot/database test
pnpm --filter @tempot/logger build
pnpm --filter @tempot/logger test
```

---

### Agent 2: Infrastructure Packages (event-bus, auth-core)

**Packages:** `packages/event-bus`, `packages/auth-core`

#### 2A. @tempot/event-bus (3 source renames, no test renames)

| #   | Current Path          | New Path                        | Type   |
| --- | --------------------- | ------------------------------- | ------ |
| 1   | `src/orchestrator.ts` | `src/event-bus.orchestrator.ts` | source |
| 2   | `src/events.ts`       | `src/event-bus.events.ts`       | source |
| 3   | `src/contracts.ts`    | `src/event-bus.contracts.ts`    | source |

**Note:** No matching test files exist for these source files (tests use different naming). Only rename source files and update imports.

**Import update scope:**

- `packages/event-bus/src/index.ts` — update barrel
- All internal imports within `packages/event-bus/src/` and `packages/event-bus/tests/`
- Search other packages importing from `@tempot/event-bus` — most use the barrel, but verify.

#### 2B. @tempot/auth-core (5 source + 1 test rename)

| #   | Current Path                    | New Path                         | Type   |
| --- | ------------------------------- | -------------------------------- | ------ |
| 1   | `src/guards/guard.ts`           | `src/guards/auth.guard.ts`       | source |
| 2   | `src/contracts/session-user.ts` | `src/contracts/session.types.ts` | source |
| 3   | `src/contracts/subjects.ts`     | `src/contracts/auth.subjects.ts` | source |
| 4   | `src/contracts/roles.ts`        | `src/contracts/auth.roles.ts`    | source |
| 5   | `src/contracts/actions.ts`      | `src/contracts/auth.actions.ts`  | source |
| 6   | `tests/unit/guard.test.ts`      | `tests/unit/auth.guard.test.ts`  | test   |

**Note:** No test files exist for `subjects`, `roles`, or `actions`. Only rename the files listed above.

**Import update scope:**

- `packages/auth-core/src/index.ts` — update barrel
- `packages/auth-core/src/contracts/index.ts` — update if exists
- `packages/auth-core/src/guards/index.ts` — update if exists
- All internal imports within `packages/auth-core/src/` and `packages/auth-core/tests/`

**After completing both packages, run:**

```bash
pnpm --filter @tempot/event-bus build
pnpm --filter @tempot/event-bus test
pnpm --filter @tempot/auth-core build
pnpm --filter @tempot/auth-core test
```

---

### Agent 3: Session & i18n Packages (session-manager, i18n-core)

**Packages:** `packages/session-manager`, `packages/i18n-core`

#### 3A. @tempot/session-manager (7 source + 4 test renames)

| #   | Current Path                                    | New Path                                        | Type   |
| --- | ----------------------------------------------- | ----------------------------------------------- | ------ |
| 1   | `src/types.ts`                                  | `src/session.types.ts`                          | source |
| 2   | `src/provider.ts`                               | `src/session.provider.ts`                       | source |
| 3   | `src/repository.ts`                             | `src/session.repository.ts`                     | source |
| 4   | `src/migrator.ts`                               | `src/session.migrator.ts`                       | source |
| 5   | `src/context.ts`                                | `src/session.context.ts`                        | source |
| 6   | `src/worker.ts`                                 | `src/session.worker.ts`                         | source |
| 7   | `src/constants.ts`                              | `src/session.constants.ts`                      | source |
| 8   | `tests/unit/provider.test.ts`                   | `tests/unit/session.provider.test.ts`           | test   |
| 9   | `tests/unit/context.test.ts`                    | `tests/unit/session.context.test.ts`            | test   |
| 10  | `tests/unit/migration.test.ts`                  | `tests/unit/session.migrator.test.ts`           | test   |
| 11  | `tests/integration/session-integration.test.ts` | `tests/integration/session.integration.test.ts` | test   |

**CRITICAL — Subpath export update:**
In `packages/session-manager/package.json`, the `"./context"` export points to `./dist/context.js`. After renaming `context.ts` to `session.context.ts`, update:

```json
"./context": {
  "import": "./dist/session.context.js",
  "types": "./dist/session.context.d.ts"
}
```

**Import update scope:**

- `packages/session-manager/src/index.ts` — update barrel
- All internal imports within `packages/session-manager/src/` and `packages/session-manager/tests/`
- Search other packages for `from '@tempot/session-manager/context'` — these use the subpath export (package.json update handles it), but verify they still resolve.
- `packages/i18n-core` imports from `@tempot/session-manager` — verify.

#### 3B. @tempot/i18n-core (5 source + 3 test renames)

| #   | Current Path                     | New Path                              | Type   |
| --- | -------------------------------- | ------------------------------------- | ------ |
| 1   | `src/t.ts`                       | `src/i18n.translator.ts`              | source |
| 2   | `src/schema.ts`                  | `src/i18n.schema.ts`                  | source |
| 3   | `src/sanitizer.ts`               | `src/i18n.sanitizer.ts`               | source |
| 4   | `src/locale-info.ts`             | `src/i18n.locale-info.ts`             | source |
| 5   | `src/loader.ts`                  | `src/i18n.loader.ts`                  | source |
| 6   | `tests/unit/t.test.ts`           | `tests/unit/i18n.translator.test.ts`  | test   |
| 7   | `tests/unit/sanitizer.test.ts`   | `tests/unit/i18n.sanitizer.test.ts`   | test   |
| 8   | `tests/unit/locale-info.test.ts` | `tests/unit/i18n.locale-info.test.ts` | test   |

**Import update scope:**

- `packages/i18n-core/src/index.ts` — update barrel
- All internal imports within `packages/i18n-core/src/` and `packages/i18n-core/tests/`
- Search other packages importing from `@tempot/i18n-core` — most use the barrel, but verify.

**After completing both packages, run:**

```bash
pnpm --filter @tempot/session-manager build
pnpm --filter @tempot/session-manager test
pnpm --filter @tempot/i18n-core build
pnpm --filter @tempot/i18n-core test
```

---

### Agent 4: Domain Packages (regional-engine, storage-engine, ux-helpers)

**Packages:** `packages/regional-engine`, `packages/storage-engine`, `packages/ux-helpers`

#### 4A. @tempot/regional-engine (1 source + 1 test rename)

| #   | Current Path               | New Path                            | Type   |
| --- | -------------------------- | ----------------------------------- | ------ |
| 1   | `src/types.ts`             | `src/regional.types.ts`             | source |
| 2   | `tests/unit/types.test.ts` | `tests/unit/regional.types.test.ts` | test   |

**Import update scope:**

- `packages/regional-engine/src/index.ts` — update barrel
- All internal imports within `packages/regional-engine/src/` and `packages/regional-engine/tests/`

#### 4B. @tempot/storage-engine (3 source + 1 test rename)

| #   | Current Path               | New Path                           | Type   |
| --- | -------------------------- | ---------------------------------- | ------ |
| 1   | `src/types.ts`             | `src/storage.types.ts`             | source |
| 2   | `src/contracts.ts`         | `src/storage.contracts.ts`         | source |
| 3   | `src/errors.ts`            | `src/storage.errors.ts`            | source |
| 4   | `tests/unit/types.test.ts` | `tests/unit/storage.types.test.ts` | test   |

**Import update scope:**

- `packages/storage-engine/src/index.ts` — update barrel
- All internal imports within `packages/storage-engine/src/` and `packages/storage-engine/tests/`

#### 4C. @tempot/ux-helpers (5 source + 2 test renames)

| #   | Current Path                         | New Path                              | Type   |
| --- | ------------------------------------ | ------------------------------------- | ------ |
| 1   | `src/types.ts`                       | `src/ux.types.ts`                     | source |
| 2   | `src/errors.ts`                      | `src/ux.errors.ts`                    | source |
| 3   | `src/constants.ts`                   | `src/ux.constants.ts`                 | source |
| 4   | `src/lists/emoji-number.ts`          | `src/lists/emoji.formatter.ts`        | source |
| 5   | `src/helpers/answer-callback.ts`     | `src/helpers/callback.handler.ts`     | source |
| 6   | `tests/unit/emoji-number.test.ts`    | `tests/unit/emoji.formatter.test.ts`  | test   |
| 7   | `tests/unit/answer-callback.test.ts` | `tests/unit/callback.handler.test.ts` | test   |

**Import update scope:**

- `packages/ux-helpers/src/index.ts` — update barrel
- All internal imports within `packages/ux-helpers/src/` and `packages/ux-helpers/tests/`
- `packages/ux-helpers/src/lists/index.ts` — update if exists
- `packages/ux-helpers/src/helpers/index.ts` — update if exists

**After completing all 3 packages, run:**

```bash
pnpm --filter @tempot/regional-engine build
pnpm --filter @tempot/regional-engine test
pnpm --filter @tempot/storage-engine build
pnpm --filter @tempot/storage-engine test
pnpm --filter @tempot/ux-helpers build
pnpm --filter @tempot/ux-helpers test
```

---

## Phase 2: Verification

**Activate `verification-before-completion`.**

### Step 1: Full Build

Run from the monorepo root:

```bash
pnpm build
```

Paste the full output as evidence. The pre-existing `TS2322` error in `storage-engine/src/providers/s3.provider.ts` is a known issue — it is acceptable if this is the only build error.

### Step 2: Full Test Suite

```bash
pnpm test
```

Paste the full output. ALL tests must pass. Zero regressions.

### Step 3: Verify No Broken Imports

Run a grep across the entire codebase for any remaining references to old filenames:

```bash
# Check for old import paths that should have been updated
# Run from monorepo root — check each old filename pattern:
rg "from ['\"]\..*/(errors|result|config|test-db|serializer|orchestrator|contracts|guard|session-user|subjects|roles|actions|provider|repository|migrator|context|worker|constants|sanitizer|locale-info|loader|emoji-number|answer-callback)(\\.js)?['\"]" packages/ --include "*.ts" -l

# Special case: check for '/t' or '/t.js' imports (i18n-core's t.ts)
rg "from ['\"]\.*/t(\.js)?['\"]" packages/ --include "*.ts" -l

# Check for '/events' or '/events.js' imports (event-bus)
rg "from ['\"]\.*/events(\.js)?['\"]" packages/ --include "*.ts" -l

# Check for '/schema' or '/schema.js' imports
rg "from ['\"]\.*/schema(\.js)?['\"]" packages/ --include "*.ts" -l
```

This should return NO results (all old single-segment import paths should be updated). If it returns results, investigate — some may be false positives (e.g., a file named `provider` in a package where it's compliant). Use judgment.

### Step 4: Verify git history preservation

```bash
# Spot-check a few files to confirm history is preserved
git log --follow --oneline -3 packages/session-manager/src/session.provider.ts
git log --follow --oneline -3 packages/database/src/database.config.ts
git log --follow --oneline -3 packages/i18n-core/src/i18n.translator.ts
```

Each should show commit history from BEFORE the rename.

---

## Constraints

- **ONLY rename files and update imports.** No behavioral code changes. No logic changes. No test assertion changes.
- Do NOT add new tests. Do NOT modify test logic. Only rename test files and update their import paths.
- Do NOT update spec artifacts (`spec.md`, `plan.md`, `tasks.md`) in this prompt — spec updates referencing new filenames will be handled separately if needed.
- Use `git mv` for every rename. Never `rm` + `touch`.
- Every import path must use `.js` extension (ESM compliance).
- No `@ts-ignore`, no `eslint-disable`, no `any` types.
- If a file listed for renaming does not exist (may have been renamed by the spec-sync prompt or was already compliant), skip it and report as "file not found — skipped."
- If a rename breaks a cross-package dependency that cannot be fixed within the agent's scope, STOP and report. Do NOT attempt cross-agent coordination independently.

---

## Rename Summary

| Agent     | Packages                                    | Source Renames | Test Renames | Subpath Export Updates          |
| --------- | ------------------------------------------- | -------------- | ------------ | ------------------------------- |
| 1         | shared, database, logger                    | 8              | 2            | 1 (database `./testing`)        |
| 2         | event-bus, auth-core                        | 8              | 1            | 0                               |
| 3         | session-manager, i18n-core                  | 12             | 7            | 1 (session-manager `./context`) |
| 4         | regional-engine, storage-engine, ux-helpers | 9              | 3            | 0                               |
| **Total** | **10 packages**                             | **37**         | **13**       | **2**                           |

---

## Final Report

When all phases complete, report per agent:

- Files renamed (count, with old → new paths)
- Imports updated (count of files modified)
- Subpath exports updated (if any)
- Skipped items (file not found or already compliant)
- Build output (per-package and full monorepo)
- Test output (per-package and full monorepo)
- Broken import grep results (should be empty)
- Git history verification output
