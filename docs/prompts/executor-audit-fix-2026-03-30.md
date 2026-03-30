# Project-Wide Compliance Fix — Audit Report Resolution

**Severity:** P1 (high) — blocks further Phase 1 development
**Scope:** 8 packages, infrastructure configs
**Audit Reference:** `docs/issues/project-audit-2026-03-30.md`

---

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md` — especially Rules I, VII, LXXIV, LXXVII, LXXVIII
- Package Checklist: `docs/developer/package-creation-checklist.md`
- Audit Report: `docs/issues/project-audit-2026-03-30.md`
- Open Issues: `docs/issues/OPEN.md`
- Workflow: `docs/developer/workflow-guide.md`

## Toolchain

### Superpowers (Required Skills)

| Skill                            | Purpose                           | When to use                                          |
| -------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `using-git-worktrees`            | Isolated feature branch           | Phase 0: before any file changes                     |
| `systematic-debugging`           | Verify each finding before fixing | Phase 1: confirm each violation exists before fixing |
| `test-driven-development`        | RED → GREEN → REFACTOR            | Phase 2: for any fix that changes behavior           |
| `verification-before-completion` | Evidence-based final check        | Phase 3: run ALL tests + build, paste actual output  |
| `requesting-code-review`         | Review fixes against constitution | Phase 3: review all changes against audit report     |

---

## Context

A comprehensive audit on 2026-03-30 found 24 violations across 8 packages.
This prompt addresses all actionable fixes grouped into 8 tasks. Each task
targets a specific violation category. Tasks are ordered by dependency —
complete them sequentially.

The 3 clean packages (`shared`, `regional-engine`, `ux-helpers`) require NO changes.

---

## Execute

### Phase 0: Setup

**Activate `using-git-worktrees`** — create an isolated branch:
`fix/audit-2026-03-30-compliance`

After the worktree is created, read the full audit report at
`docs/issues/project-audit-2026-03-30.md` to understand all findings.

---

### Phase 1: Fix All Violations (7 Tasks — Sequential)

For each task: verify the violation exists first, apply the minimum fix,
run the affected package's tests after each change. If any fix requires
changing behavior (not just config), apply TDD (write failing test first).

---

#### Task 1: Remove Phantom Dependencies (CRITICAL — Rule LXXVII)

**Principle:** If a dependency is declared in `package.json` but never
imported in `src/`, remove it. Do NOT add unnecessary imports to justify
keeping it.

**Before each removal:** Run `grep -r "from 'PACKAGE_NAME'" packages/{name}/src/`
to confirm zero imports exist. If an import IS found, do NOT remove — report
the discrepancy with the audit.

**Fixes:**

| Package                    | File           | Action                                                                                                         |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `packages/logger`          | `package.json` | Remove `pino-pretty` from `dependencies`. It is a CLI formatting tool, not a runtime import.                   |
| `packages/database`        | `package.json` | Remove `@casl/prisma` from `dependencies` — not imported in `src/`.                                            |
| `packages/database`        | `package.json` | Remove `pgvector` from `dependencies` — not imported in `src/`.                                                |
| `packages/database`        | `package.json` | Move `glob` from `dependencies` to `devDependencies` — only used in `scripts/merge-schemas.ts`, not in `src/`. |
| `packages/session-manager` | `package.json` | Remove `cache-manager` from `dependencies` — `CacheAdapter` interface is defined locally.                      |
| `packages/session-manager` | `package.json` | Remove `@tempot/event-bus` from `dependencies` — `EventBusAdapter` interface is defined locally.               |
| `packages/storage-engine`  | `package.json` | Remove `@tempot/event-bus` from `dependencies` — not imported in `src/`.                                       |
| `packages/storage-engine`  | `package.json` | Remove `@tempot/session-manager` from `dependencies` — not imported in `src/`.                                 |
| `packages/storage-engine`  | `package.json` | Remove `@tempot/logger` from `dependencies` — not imported in `src/`.                                          |

**After all removals:** Run `pnpm install` to update the lockfile, then run
tests for ALL 4 affected packages:

```
pnpm --filter @tempot/logger test
pnpm --filter @tempot/database test
pnpm --filter @tempot/session-manager test
pnpm --filter @tempot/storage-engine test
```

**Commit:** `fix: remove 9 phantom dependencies across 4 packages`

**CHECKPOINT 1:** Paste the test output for all 4 packages. All must pass.
If any test fails after removing a dependency, STOP — that dependency is
actually needed. Report which one and why.

---

#### Task 2: Standardize Vitest Configs (HIGH — Convention)

**Principle:** All packages must use the project-based `defineProject` pattern.
The reference implementation is `packages/regional-engine/vitest.config.ts`.

**Fixes:**

1. **`packages/auth-core/vitest.config.ts`** — Replace flat config with:

   ```typescript
   import { defineConfig } from 'vitest/config';
   import { defineProject } from 'vitest/config';

   export default defineConfig({
     test: {
       projects: [
         defineProject({
           test: {
             name: 'unit',
             include: ['tests/unit/**/*.test.ts'],
             environment: 'node',
           },
         }),
       ],
     },
   });
   ```

   Remove `globals: true`. Verify all 4 test files in `tests/unit/` still pass.

2. **`packages/session-manager/vitest.config.ts`** — Replace flat config with
   project-based pattern. Define TWO projects: `unit` (for `tests/unit/`) and
   `integration` (for `tests/integration/`). Also move `tests/provider.test.ts`
   to `tests/unit/provider.test.ts` to follow convention.

3. **`packages/i18n-core/vitest.config.ts`** — Replace flat config with
   project-based pattern. Single `unit` project. Remove `globals: true`.
   Remove the custom `exclude` for `*.js` files (unnecessary if workspace
   is clean per Rule LXXVIII).

4. **`packages/logger/vitest.config.ts`** — Add an `integration` project
   alongside the existing `unit` project:
   ```typescript
   defineProject({
     test: {
       name: 'integration',
       include: ['tests/integration/**/*.test.ts'],
       environment: 'node',
       testTimeout: 120_000,
       hookTimeout: 120_000,
     },
   }),
   ```
   This ensures `tests/integration/audit-logger.test.ts` actually runs.

**After all changes:** Run tests for all 4 packages:

```
pnpm --filter @tempot/auth-core test
pnpm --filter @tempot/session-manager test
pnpm --filter @tempot/i18n-core test
pnpm --filter @tempot/logger test
```

**Commit:** `fix: standardize vitest configs to project-based pattern across 4 packages`

**CHECKPOINT 2:** Paste test output for all 4 packages. All must pass.

---

#### Task 3: Fix i18n-core tsconfig.json (HIGH — Config)

**File:** `packages/i18n-core/tsconfig.json`

**Fix:** Add the missing `exclude` array. The final tsconfig.json should
include:

```json
"exclude": ["node_modules", "dist", "tests"]
```

Match the style used by `packages/regional-engine/tsconfig.json` as reference.

**Verify:** Run `pnpm --filter @tempot/i18n-core build` to confirm TypeScript
compilation still succeeds and does NOT compile test files into `dist/`.

**Commit:** `fix(i18n-core): add missing exclude to tsconfig.json`

**CHECKPOINT 3:** Paste build output.

---

#### Task 4: Fix Event-Bus Hardcoded Strings (MEDIUM — Rule XXXIX)

**Principle:** Replace hardcoded English strings with structured error codes.
For log messages, use error code identifiers. For AppError details, use
dot-notation error codes consistent with the project's `module.error_name`
convention (Rule XXII).

**Fixes:**

1. **`packages/event-bus/src/orchestrator.ts:40`**
   Replace: `message: 'CRITICAL: Redis Event Bus unavailable. Falling back to Local Mode.'`
   With: A structured log call using an error code, e.g.:
   `this.logger.error({ code: 'event_bus.redis.unavailable', mode: 'local_fallback' })`

2. **`packages/event-bus/src/orchestrator.ts:44`**
   Replace: `this.logger.info('Redis Event Bus restored. Distributed messaging active.')`
   With: `this.logger.info({ code: 'event_bus.redis.restored', mode: 'distributed' })`

3. **`packages/event-bus/src/local/local.bus.ts:16`**
   Replace: `` `Invalid event name: ${eventName}` ``
   With: An AppError using a structured code:
   `AppError('event_bus.invalid_event_name', { eventName })`

4. **`packages/event-bus/src/distributed/redis.bus.ts:30`**
   Same pattern as local.bus.ts above.

**Important:** Study the existing error patterns in `@tempot/shared/src/errors/`
and other packages to follow the established convention. Do NOT invent a new
pattern.

**TDD Required:** The existing tests for `local.bus.ts` and `redis.bus.ts`
test invalid event names. After changing the error messages, update the test
assertions to match the new error codes. Follow RED → GREEN → REFACTOR:

1. Change the error format in source
2. Run tests — they should FAIL because assertions check old strings
3. Update test assertions to match new error codes
4. Run tests — they should PASS

**Commit:** `fix(event-bus): replace hardcoded strings with structured error codes`

**CHECKPOINT 4:** Paste test output for event-bus.

---

#### Task 5: Fix database `any` Type (HIGH — Rule I)

**File:** `packages/database/src/base/base.repository.ts:32-33`

**Context:** Lines 22-31 contain a comment explaining this is a Prisma
boundary issue. The current code uses `eslint-disable` + `Record<string, any>`.

**Fix:** Replace `Record<string, any>` with `Record<string, unknown>`.
Remove the `eslint-disable-next-line` comment. The comment explaining the
Prisma boundary (lines 22-31) can stay as documentation, but the actual
type must be safe.

**Important:** After changing to `Record<string, unknown>`, if TypeScript
compilation fails because Prisma's delegate type requires `any`, try these
approaches in order:

1. Use `Record<string, unknown>` and add explicit type assertions only at
   the Prisma call boundary (not on the class generic)
2. If that fails, use a branded type pattern to constrain the generic
3. If both fail, STOP and report the exact TypeScript error. Do NOT
   re-add `any` or `eslint-disable`.

**Verify:** Run `pnpm --filter @tempot/database build` and
`pnpm --filter @tempot/database test`

**Commit:** `fix(database): remove any type and eslint-disable from base.repository`

**CHECKPOINT 5:** Paste build + test output. If the fix is not possible
without `any`, report the exact error and stop this task.

---

#### Task 6: Fix Test Import Resolution Errors (HIGH — Rule I)

**Context:** TypeScript LSP reports module resolution errors in test files
for `logger` and `auth-core`. These are documented in
`docs/issues/project-audit-2026-03-30.md` Section 9.

**Principle:** Test files must compile cleanly under `moduleResolution: node16`.
Relative imports require explicit `.js` extensions in ESM projects.

**Diagnostic — Verify first:** Before fixing, run `pnpm --filter @tempot/logger test`
and `pnpm --filter @tempot/auth-core test` to determine if Vitest handles
these despite the LSP errors (Vitest has its own module resolution). Document
whether tests pass or fail.

**If tests pass despite LSP errors:** Fix the imports anyway for strict
compliance. Add `.js` extensions to all relative imports in test files.

**If tests fail:** Fix is mandatory. Add `.js` extensions to all relative
imports.

**Fixes for `packages/logger/tests/`:**

| File                                | Line                             | Fix                                                                                                                                                               |
| ----------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/pino-logger.test.ts:3`  | `../../src/technical/serializer` | → `../../src/technical/serializer.js`                                                                                                                             |
| `tests/unit/pino-logger.test.ts:4`  | `../../src/config`               | → `../../src/config.js`                                                                                                                                           |
| `tests/unit/serializer.test.ts:2`   | `../../src/technical/serializer` | → `../../src/technical/serializer.js`                                                                                                                             |
| `tests/unit/audit-logger.test.ts:2` | `../../src/audit/audit.logger`   | Verify the module path is correct. If `audit.logger.ts` exists at that path, add `.js` extension. If the file was moved/renamed, update the import path to match. |

**Fixes for `packages/auth-core/tests/`:**

| File                                   | Line                                | Fix                                                                      |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `tests/unit/ability.factory.test.ts:2` | `../../src/factory/ability.factory` | Verify path. If file exists, add `.js` extension. If moved, update path. |
| `tests/unit/ability.factory.test.ts:3` | `../../src/contracts/session-user`  | → `../../src/contracts/session-user.js`                                  |
| `tests/unit/ability.factory.test.ts:5` | `../../src/contracts/roles`         | → `../../src/contracts/roles.js`                                         |
| `tests/unit/guard.test.ts:2`           | `../../src/guards/guard`            | → `../../src/guards/guard.js`                                            |
| `tests/unit/guard.test.ts:4`           | `../../src/contracts/actions`       | → `../../src/contracts/actions.js`                                       |
| `tests/unit/guard.test.ts:5`           | `../../src/contracts/subjects`      | → `../../src/contracts/subjects.js`                                      |

**Important:** Before adding `.js` extensions, verify each source file
actually exists at the referenced path. If a file was renamed or restructured,
fix the path, not just the extension. Use `ls` to confirm.

**After fixes:** Run tests for both packages:

```
pnpm --filter @tempot/logger test
pnpm --filter @tempot/auth-core test
```

**Commit:** `fix(logger,auth-core): fix test import paths for ESM module resolution`

**CHECKPOINT 6:** Paste test output for both packages.

---

#### Task 7: Fix Bot Server grammy Version (LOW — Tech Stack)

> Note: This is Task 7 of 8.

**File:** `apps/bot-server/package.json`

**Fix:** Change `"grammy": "^1.0.0"` to `"grammy": "^1.41.1"` to match
the tech stack specified in `docs/tempot_v11_final.md` Section 2.

**Verify:** Run `pnpm install` to confirm resolution succeeds.

**Commit:** `fix(bot-server): pin grammy version to ^1.41.1 per tech stack`

---

#### Task 8: Fix Docker + CI Config Issues (LOW — Infrastructure)

1. **`docker-compose.yml`** — Replace `ankane/pgvector:latest` with a
   pinned version: `ankane/pgvector:v0.8.0` (or the latest stable release
   at time of execution — verify on Docker Hub first).

2. **`.github/workflows/ci.yml`** — In the `audit` job, change
   `continue-on-error: true` to `continue-on-error: false` so security
   audit failures block the pipeline.

**Commit:** `fix: pin pgvector docker version and enforce CI security audit`

---

### Phase 2: Update Issue Tracker

After all tasks are complete:

1. **`docs/issues/OPEN.md`** — For each resolved issue (ISSUE-004 partial,
   ISSUE-006, ISSUE-007, ISSUE-008), move the entry to `docs/issues/RESOLVED.md`
   with the resolution date and commit reference.

2. **`docs/issues/RESOLVED.md`** — Add resolved entries with format:
   ```
   ## ISSUE-006: Phantom Dependencies (Resolved 2026-03-30)
   **Resolution:** Removed 9 phantom deps. Commit: {hash}
   ```

**Commit:** `docs: update issue tracker after audit compliance fixes`

---

### Phase 3: Verification

**Activate `verification-before-completion`** — no claims without evidence.

Run these commands and paste the FULL output of each:

```bash
# 1. Full workspace build
pnpm build

# 2. Full unit test suite
pnpm test:unit

# 3. Full lint check
pnpm lint

# 4. Verify no stale artifacts in any src/
find packages/*/src -name "*.js" -o -name "*.d.ts" 2>/dev/null

# 5. Verify phantom deps are gone (spot check)
grep -r "pino-pretty" packages/logger/package.json
grep -r "@casl/prisma" packages/database/package.json
grep -r "cache-manager" packages/session-manager/package.json
```

**CHECKPOINT FINAL:** All commands must succeed. If ANY test fails or build
breaks, fix it before proceeding. Do not skip this phase.

**Activate `requesting-code-review`** — review all changes against:

- Constitution Rules I, VII, XXXIX, LXXIV, LXXVII, LXXVIII
- Package Creation Checklist (10-point)
- Audit report findings (all 24 violations)

---

## Constraints

- **Single responsibility per commit.** Each task = one commit. Do NOT
  combine fixes from different tasks into one commit (Rule IX).
- **No `@ts-ignore`, no `eslint-disable`, no `any` types** — these are the
  violations we are fixing. Do not introduce new ones (Rule I).
- **Fix at source** — do not add wrappers, workarounds, or defensive code
  around broken patterns (Rule VII + LXX).
- **Clean diff** — only touch files listed in this prompt. Do not reformat,
  reorganize, or "improve" files not specified here (Rule XI).
- **If any fix causes cascading failures or ambiguity:** STOP. Report the
  exact failure, your analysis, and wait for instructions. Do NOT guess.
- **If you discover additional violations** not in the audit report: note
  them in the final report but do NOT fix them. Only fix what is specified
  in this prompt.

---

## Final Report

When ALL phases complete, report:

1. **Task completion matrix:**
   | Task | Status | Commit Hash | Notes |
   |------|--------|-------------|-------|

2. **Test evidence:** Full output of `pnpm test:unit` and `pnpm build`

3. **Issues resolved:** List of ISSUE-xxx entries moved to RESOLVED.md

4. **Remaining issues:** Any violations from the audit that could NOT be
   fixed (with explanation)

5. **New findings:** Any additional violations discovered during execution
   (documented only, not fixed)

6. **Branch status:** Ready for merge? Any blockers?
