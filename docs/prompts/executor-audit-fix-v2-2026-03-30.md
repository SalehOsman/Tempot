# Project-Wide Compliance & Documentation Fix — Verified Audit Resolution (v2)

**Severity:** P1 (high) — blocks further Phase 1 development
**Scope:** 8 packages, infrastructure configs, documentation accuracy
**Audit Reference:** `docs/issues/project-audit-2026-03-30.md`
**Supersedes:** `docs/prompts/executor-audit-fix-2026-03-30.md` (v1)

---

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md` — especially Rules I, VII, IX, XI, XXXIX, LXXIV, LXXVII, LXXVIII
- Package Checklist: `docs/developer/package-creation-checklist.md`
- Audit Report: `docs/issues/project-audit-2026-03-30.md`
- Workflow: `docs/developer/workflow-guide.md`

## Toolchain

### Superpowers (Required Skills)

| Skill                            | Purpose                           | When to use                                         |
| -------------------------------- | --------------------------------- | --------------------------------------------------- |
| `using-git-worktrees`            | Isolated feature branch           | Phase 0: before any file changes                    |
| `dispatching-parallel-agents`    | Concurrent independent subagents  | Phase 1: dispatch 5 subagents in parallel           |
| `test-driven-development`        | RED → GREEN → REFACTOR            | Phase 1: for any fix that changes behavior          |
| `verification-before-completion` | Evidence-based final check        | Phase 3: run ALL tests + build, paste actual output |
| `requesting-code-review`         | Review fixes against constitution | Phase 3: review all changes against audit report    |

---

## Context

A comprehensive audit on 2026-03-30 found violations across 8 packages. Every
finding below was **verified against actual source files** (not documentation).
A prior executor prompt (v1) may have already fixed some issues. Each agent
below MUST verify the current state before applying any fix — if already fixed,
skip and report as "already resolved."

### Verified Findings Summary

| #   | Category                      | Severity | Count | Packages                                          |
| --- | ----------------------------- | -------- | ----- | ------------------------------------------------- |
| F1  | Phantom dependencies          | CRITICAL | 9     | logger, database, session-manager, storage-engine |
| F2  | Vitest config inconsistency   | HIGH     | 4     | auth-core, session-manager, i18n-core, logger     |
| F3  | Orphaned integration test     | HIGH     | 1     | logger                                            |
| F4  | Misplaced test file           | LOW      | 1     | session-manager                                   |
| F5  | Missing tsconfig exclude      | HIGH     | 1     | i18n-core                                         |
| F6  | Hardcoded English strings     | MEDIUM   | 2     | event-bus (orchestrator.ts only)                  |
| F7  | `any` type + `eslint-disable` | HIGH     | 1     | database (base.repository.ts only)                |
| F8  | Missing `.js` in test imports | HIGH     | 13    | logger (4), auth-core (9)                         |
| F9  | grammy version mismatch       | LOW      | 1     | bot-server                                        |
| F10 | Unpinned Docker image         | LOW      | 1     | docker-compose.yml                                |
| F11 | CI audit non-blocking         | LOW      | 1     | ci.yml                                            |
| F12 | Documentation inaccuracies    | MEDIUM   | 5     | OPEN.md, RESOLVED.md, ROADMAP.md                  |

### What Was NOT Found (audit report was wrong about these)

These were listed in the original audit but verified as **already resolved**:

| Original Claim                                         | Actual Status (from source files)                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| ISSUE-004: `any` types in logger + event-bus           | **RESOLVED** — zero `any`/`eslint-disable` in logger & event-bus `src/`       |
| ISSUE-005: Direct PrismaClient in AuditLogger          | **RESOLVED** — `audit.logger.ts` imports `AuditLogRepository`                 |
| Hardcoded strings in `local.bus.ts` and `redis.bus.ts` | **FALSE** — both use proper `AppError('event_bus.invalid_name', ...)` pattern |

---

## Execute

### Phase 0: Setup

**Activate `using-git-worktrees`** — create an isolated branch:
`fix/audit-v2-2026-03-30`

After the worktree is created, read the full audit report at
`docs/issues/project-audit-2026-03-30.md` to understand all findings.

---

### Phase 1: Parallel Agent Execution

**Activate `dispatching-parallel-agents`** — dispatch 5 subagents simultaneously.
Each agent owns a distinct set of files with **zero overlap**. No agent may
touch files owned by another agent.

#### File Ownership Map (No Overlap Guarantee)

| Agent | Owned Files                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | `packages/{logger,database,session-manager,storage-engine}/package.json`                                                                                        |
| B     | `packages/{auth-core,session-manager,i18n-core,logger}/vitest.config.ts`, `packages/i18n-core/tsconfig.json`, `packages/session-manager/tests/provider.test.ts` |
| C     | `packages/logger/tests/unit/*.test.ts`, `packages/auth-core/tests/unit/*.test.ts`                                                                               |
| D     | `packages/event-bus/src/orchestrator.ts`, `packages/database/src/base/base.repository.ts`                                                                       |
| E     | `apps/bot-server/package.json`, `docker-compose.yml`, `.github/workflows/ci.yml`                                                                                |

---

#### Agent A: Remove Phantom Dependencies (F1 — CRITICAL)

**Scope:** 4 packages, `package.json` files only.

**Principle:** If a dependency is declared in `package.json` but never
imported in `src/`, remove it. Do NOT add imports to justify keeping it.

**Before each removal:** Search `src/` for `import ... from 'PACKAGE_NAME'`
(not comments, not test files). If an import IS found, do NOT remove — report
the discrepancy.

**Verified phantom dependencies:**

| Package         | Dependency                | Action                     | Evidence                                                                                                                                                                         |
| --------------- | ------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| logger          | `pino-pretty`             | Remove from `dependencies` | Zero imports in `src/`. CLI formatting tool only.                                                                                                                                |
| database        | `@casl/prisma`            | Remove from `dependencies` | Zero imports in `src/`.                                                                                                                                                          |
| database        | `pgvector`                | Remove from `dependencies` | Zero imports in `src/`. Drizzle provides pgvector support via `drizzle-orm`, not this npm package. Verify: `grep -r "from 'pgvector'" packages/database/src/` must return empty. |
| database        | `glob`                    | Move to `devDependencies`  | Only imported in `scripts/merge-schemas.ts`, not `src/`.                                                                                                                         |
| session-manager | `cache-manager`           | Remove from `dependencies` | Zero imports in `src/`. `CacheAdapter` defined locally.                                                                                                                          |
| session-manager | `@tempot/event-bus`       | Remove from `dependencies` | Zero imports in `src/`. `EventBusAdapter` defined locally.                                                                                                                       |
| storage-engine  | `@tempot/event-bus`       | Remove from `dependencies` | Zero imports in `src/`. Referenced only in comments.                                                                                                                             |
| storage-engine  | `@tempot/session-manager` | Remove from `dependencies` | Zero imports in `src/`.                                                                                                                                                          |
| storage-engine  | `@tempot/logger`          | Remove from `dependencies` | Zero imports in `src/`. Referenced only in comments.                                                                                                                             |

**After all removals:** Run `pnpm install` to update the lockfile.

**Test:** Run tests for all 4 affected packages:

```
pnpm --filter @tempot/logger test
pnpm --filter @tempot/database test
pnpm --filter @tempot/session-manager test
pnpm --filter @tempot/storage-engine test
```

**Return:** Table of what was removed, test results (pass/fail), any discrepancies.

---

#### Agent B: Standardize Configs (F2, F3, F4, F5 — HIGH)

**Scope:** vitest.config.ts in 4 packages + i18n-core/tsconfig.json + move 1 test file.

**Reference implementation:** `packages/regional-engine/vitest.config.ts` and
`packages/regional-engine/tsconfig.json` — study these first as the gold standard.

##### B1: Vitest Config Standardization

Convert all flat configs to the project-based `defineProject` pattern:

1. **`packages/auth-core/vitest.config.ts`** — Replace flat config with project-based.
   Define single `unit` project including `tests/unit/**/*.test.ts`.
   Remove `globals: true`. Verify all 4 test files still pass.

2. **`packages/session-manager/vitest.config.ts`** — Replace flat config with project-based.
   Define TWO projects: `unit` (`tests/unit/**/*.test.ts`) and `integration`
   (`tests/integration/**/*.test.ts`).
   Remove `globals: true`.
   **Also move:** `tests/provider.test.ts` → `tests/unit/provider.test.ts`.

3. **`packages/i18n-core/vitest.config.ts`** — Replace flat config with project-based.
   Single `unit` project. Remove `globals: true`. Remove the custom `exclude`
   for `*.js` files (unnecessary).

4. **`packages/logger/vitest.config.ts`** — Add an `integration` project alongside
   the existing `unit` project:
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

##### B2: TSConfig Fix

5. **`packages/i18n-core/tsconfig.json`** — Add the missing `exclude` array:
   ```json
   "exclude": ["node_modules", "dist", "tests"]
   ```
   Match the style used by `packages/regional-engine/tsconfig.json`.

**Test:** Run tests and build for all 4 packages:

```
pnpm --filter @tempot/auth-core test
pnpm --filter @tempot/session-manager test
pnpm --filter @tempot/i18n-core test
pnpm --filter @tempot/logger test
pnpm --filter @tempot/i18n-core build
```

**Return:** What configs were changed, test results, any `globals: true` removal
requiring test file changes (vitest imports).

---

#### Agent C: Fix ESM Import Compliance (F8 — HIGH)

**Scope:** Test files only in logger and auth-core. Source files are NOT touched.

**Context:** Post-methodology packages (regional-engine, storage-engine, ux-helpers)
consistently include `.js` extensions on relative imports. Pre-methodology packages
(logger, auth-core) do not. This is a `moduleResolution: node16` compliance issue.

**Before fixing:** Run `pnpm --filter @tempot/logger test` and
`pnpm --filter @tempot/auth-core test` to confirm whether tests pass currently
despite the LSP errors (Vitest has its own module resolution).

**Fixes for `packages/logger/tests/unit/` (4 imports in 3 files):**

| File                     | Import Path                      | Fix To                              |
| ------------------------ | -------------------------------- | ----------------------------------- |
| `pino-logger.test.ts:3`  | `../../src/technical/serializer` | `../../src/technical/serializer.js` |
| `pino-logger.test.ts:4`  | `../../src/config`               | `../../src/config.js`               |
| `serializer.test.ts:2`   | `../../src/technical/serializer` | `../../src/technical/serializer.js` |
| `audit-logger.test.ts:2` | `../../src/audit/audit.logger`   | `../../src/audit/audit.logger.js`   |

**Note:** `tests/integration/audit-logger.test.ts` already has `.js` extensions — do NOT touch it.

**Fixes for `packages/auth-core/tests/unit/` (9 imports in 4 files):**

| File                        | Import Path                         | Fix To                                 |
| --------------------------- | ----------------------------------- | -------------------------------------- |
| `ability.factory.test.ts:2` | `../../src/factory/ability.factory` | `../../src/factory/ability.factory.js` |
| `ability.factory.test.ts:3` | `../../src/contracts/session-user`  | `../../src/contracts/session-user.js`  |
| `ability.factory.test.ts:5` | `../../src/contracts/roles`         | `../../src/contracts/roles.js`         |
| `guard.test.ts:2`           | `../../src/guards/guard`            | `../../src/guards/guard.js`            |
| `guard.test.ts:4`           | `../../src/contracts/actions`       | `../../src/contracts/actions.js`       |
| `guard.test.ts:5`           | `../../src/contracts/subjects`      | `../../src/contracts/subjects.js`      |
| `auth.errors.test.ts:2`     | `../../src/errors/auth.errors`      | `../../src/errors/auth.errors.js`      |
| `contracts.test.ts:2`       | `../../src/contracts/roles`         | `../../src/contracts/roles.js`         |
| `contracts.test.ts:3`       | `../../src/contracts/actions`       | `../../src/contracts/actions.js`       |

**Before adding `.js`:** Verify each source file exists at the referenced path.
If a file was renamed or restructured, fix the path, not just the extension.

**Test:** Run tests for both packages after all import fixes:

```
pnpm --filter @tempot/logger test
pnpm --filter @tempot/auth-core test
```

**Return:** Table of imports fixed, before/after test results.

---

#### Agent D: Source Code Fixes (F6, F7 — MEDIUM/HIGH)

**Scope:** 2 files in 2 packages. No other files may be touched.

##### D1: Event-bus Hardcoded Strings (F6)

**File:** `packages/event-bus/src/orchestrator.ts`

**Verified hardcoded strings (only 2, NOT 4 as original audit claimed):**

- **Line 40:** `message: 'CRITICAL: Redis Event Bus unavailable. Falling back to Local Mode.'`
- **Line 44:** `this.logger.info('Redis Event Bus restored. Distributed messaging active.')`

**Important:** `local.bus.ts` and `redis.bus.ts` already use proper
`AppError('event_bus.invalid_name', ...)` error code pattern. Do NOT touch them.

**Fix:** Replace the two hardcoded log messages with structured log objects:

```typescript
// Line 40 — replace the string message with:
this.logger.error({ code: 'event_bus.redis_unavailable', fallback: 'local' });

// Line 44 — replace the string message with:
this.logger.info({ code: 'event_bus.redis_restored', mode: 'distributed' });
```

Study the existing log patterns in other packages first. Match the established
convention. Do not invent a new pattern.

**TDD:** If existing tests assert on these log messages, update the test
assertions to match the new format. Follow RED → GREEN → REFACTOR.

##### D2: Database `any` Type (F7)

**File:** `packages/database/src/base/base.repository.ts`

**Verified issue at lines 32-33:**

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrismaModelDelegate = Record<string, any>;
```

This is the ONLY `any` in the entire `database/src/` directory (verified by grep).

**Fix:** Replace `Record<string, any>` with `Record<string, unknown>`.
Remove the `eslint-disable-next-line` comment. The explanatory comment block
(lines 20-31) documenting the Prisma boundary can stay.

**After changing to `Record<string, unknown>`:** If TypeScript compilation
fails because Prisma's delegate type requires `any`, try these approaches
in order:

1. Use `Record<string, unknown>` and add explicit type assertions only at
   the Prisma call boundary (not on the type definition)
2. If that fails, use a branded type pattern to constrain the generic
3. If both fail, STOP and report the exact TypeScript error. Do NOT
   re-add `any` or `eslint-disable`.

**Test:**

```
pnpm --filter @tempot/event-bus test
pnpm --filter @tempot/database build
pnpm --filter @tempot/database test
```

**Return:** Exact changes made, build/test results, whether the `unknown`
fix succeeded or needed a workaround.

---

#### Agent E: Infrastructure Fixes (F9, F10, F11 — LOW)

**Scope:** 3 files, all in different locations.

##### E1: grammy Version (F9)

**File:** `apps/bot-server/package.json`
**Current:** `"grammy": "^1.0.0"`
**Fix:** Change to `"grammy": "^1.41.1"` to match the tech stack in
`docs/tempot_v11_final.md` Section 2.

##### E2: Docker pgvector Image (F10)

**File:** `docker-compose.yml`
**Current:** `image: ankane/pgvector:latest`
**Fix:** Pin to a specific version. Check Docker Hub for the latest stable
release of `ankane/pgvector` that supports PostgreSQL 16. Use that version
(e.g., `ankane/pgvector:v0.8.0`). If you cannot verify the latest version,
use `pgvector/pgvector:pg16` as an alternative.

##### E3: CI Audit Enforcement (F11)

**File:** `.github/workflows/ci.yml`
**Current:** `continue-on-error: true` on the audit job (line ~119)
**Fix:** Change to `continue-on-error: false` so security audit failures
block the pipeline.

**After all changes:** Run `pnpm install` to verify grammy resolves.

**Return:** What was changed in each file, pnpm install result.

---

### Phase 2: Integration & Commits

After ALL 5 agents complete and return their results:

1. **Verify no file conflicts** — confirm agents only touched their owned files.

2. **Create one commit per logical fix** (Rule IX — single responsibility):

   | Commit Message                                                           | Agent | Files                                |
   | ------------------------------------------------------------------------ | ----- | ------------------------------------ |
   | `fix: remove 9 phantom dependencies across 4 packages`                   | A     | 4 package.json files                 |
   | `fix: standardize vitest configs to project-based pattern`               | B     | 4 vitest.config.ts + 1 tsconfig.json |
   | `fix(session-manager): move provider.test.ts to tests/unit/`             | B     | 1 test file moved                    |
   | `fix(logger,auth-core): add .js extensions to test imports for ESM`      | C     | 7 test files                         |
   | `fix(event-bus): replace hardcoded log strings with structured codes`    | D     | orchestrator.ts                      |
   | `fix(database): remove any type and eslint-disable from base.repository` | D     | base.repository.ts                   |
   | `fix: pin grammy version, pgvector image, and enforce CI audit`          | E     | 3 infra files                        |

3. **Run `pnpm install`** to resolve any lockfile changes from dependency updates.

---

### Phase 3: Documentation Accuracy Fix (F12)

**This phase fixes documentation that does not reflect the actual state
of the project.** All corrections below were verified against source files.

#### 3.1: Fix Issue ID Collision

**Problem:** `RESOLVED.md` contains ISSUE-006 (event-bus any types) and
ISSUE-007 (database any types) from 2026-03-23. `OPEN.md` later reused
the same IDs for completely different issues (ISSUE-006 = phantom deps,
ISSUE-007 = vitest config, ISSUE-008 = i18n tsconfig). This makes
cross-referencing unreliable.

**Fix:** Renumber the OPEN.md issues to avoid collision:

| Old ID (OPEN.md) | New ID    | Issue                              |
| ---------------- | --------- | ---------------------------------- |
| ISSUE-006        | ISSUE-009 | Phantom Dependencies               |
| ISSUE-007        | ISSUE-010 | Vitest Config Inconsistency        |
| ISSUE-008        | ISSUE-011 | i18n-core tsconfig missing exclude |

Update all references to these IDs in `OPEN.md` and `docs/issues/project-audit-2026-03-30.md`.

#### 3.2: Move ISSUE-005 to RESOLVED.md

**Problem:** `OPEN.md` lists ISSUE-005 (Direct PrismaClient in AuditLogger)
as open. **Actual state:** `audit.logger.ts` line 2 imports `AuditLogRepository`
from `@tempot/database`, line 25 uses `constructor(private readonly repository: AuditLogRepository)`.
No PrismaClient anywhere in the file. This is fully resolved.

**Fix:** Move ISSUE-005 from `OPEN.md` to `RESOLVED.md` with:

```
## ISSUE-005: Repository Pattern Violation (Resolved 2026-03-26)
**Resolution:** AuditLogger refactored to use AuditLogRepository instead of
direct PrismaClient injection. Verified from source: audit.logger.ts imports
AuditLogRepository and uses it via constructor injection.
```

#### 3.3: Update ISSUE-004 in OPEN.md

**Problem:** ISSUE-004 claims "widespread" `any` types across logger,
event-bus, and database. **Actual state:** logger and event-bus have ZERO
`any`/`eslint-disable` in their `src/` directories. Only database has 1
remaining instance at `base.repository.ts:32-33`.

**Fix:** Update ISSUE-004 in `OPEN.md` to reflect reality:

- Remove logger and event-bus from the affected packages
- Narrow scope to: database `base.repository.ts` only
- Note: "logger and event-bus were resolved in prior fixes (2026-03-23)"
- If Agent D (Phase 1) fixed the database `any` type, move ISSUE-004
  to RESOLVED.md entirely

#### 3.4: Move Newly Resolved Issues

After Phase 1 code fixes are committed, move the following from `OPEN.md`
to `RESOLVED.md` (using the new renumbered IDs):

- ISSUE-009 (phantom deps) — if Agent A completed successfully
- ISSUE-010 (vitest config) — if Agent B completed successfully
- ISSUE-011 (i18n tsconfig) — if Agent B completed successfully

For each, include the resolution date and commit reference.

#### 3.5: Fix ROADMAP.md Cross-References

**Problem:** `ROADMAP.md` Critical Blockers table uses old issue IDs that
collide with OPEN.md:

- ISSUE-006 in ROADMAP = "bot-server build broken" (correct per RESOLVED.md)
- ISSUE-008 in ROADMAP = "session-manager subpath export" (never in OPEN/RESOLVED)

**Fix:** This is consistent with RESOLVED.md (not OPEN.md), so no change needed
to the existing entries. But verify no other cross-reference issues exist in
the file. If the Next Action section needs updating based on this session's
fixes, update it.

**Commit:** `docs: fix issue ID collisions and update issue tracker accuracy`

---

### Phase 4: Verification

**Activate `verification-before-completion`** — no claims without evidence.

Run these commands and paste the FULL output of each:

```bash
# 1. Full workspace build
pnpm build

# 2. Full unit test suite
pnpm test:unit

# 3. Full lint check
pnpm lint

# 4. Verify phantom deps are gone (spot check)
grep -r "pino-pretty" packages/logger/package.json
grep -r "@casl/prisma" packages/database/package.json
grep -r "cache-manager" packages/session-manager/package.json

# 5. Verify no any/eslint-disable in cleaned packages
grep -rn "eslint-disable" packages/logger/src/ packages/event-bus/src/
grep -rn "as any" packages/logger/src/ packages/event-bus/src/
```

**CHECKPOINT FINAL:** All commands must succeed. If ANY test fails or build
breaks, fix it before proceeding.

**Activate `requesting-code-review`** — review all changes against:

- Constitution Rules I, VII, IX, XXXIX, LXXIV, LXXVII, LXXVIII
- Package Creation Checklist (10-point)
- Audit report findings

---

## Constraints

- **Verify before fixing.** Every finding must be confirmed from actual source
  files before applying a fix. If a prior executor already fixed an issue,
  skip it and report as "already resolved."
- **Single responsibility per commit.** Each logical fix = one commit. Do NOT
  combine unrelated fixes (Rule IX).
- **No `@ts-ignore`, no `eslint-disable`, no `any` types** — these are the
  violations we are fixing. Do not introduce new ones (Rule I).
- **Fix at source** — do not add wrappers or defensive code (Rule VII + LXX).
- **Clean diff** — only touch files listed in the File Ownership Map. Do not
  reformat, reorganize, or "improve" unlisted files (Rule XI).
- **Agent isolation** — no agent may edit files owned by another agent. If an
  agent discovers it needs to change a file outside its scope, report it and
  STOP that sub-task.
- **If any fix causes cascading failures or ambiguity:** STOP. Report the
  exact failure and analysis. Do NOT guess.
- **If you discover additional violations** not in this prompt: note them in
  the final report but do NOT fix them.

---

## Final Report

When ALL phases complete, report:

1. **Agent completion matrix:**

   | Agent | Scope                  | Status | Files Changed | Notes |
   | ----- | ---------------------- | ------ | ------------- | ----- |
   | A     | Phantom deps           |        |               |       |
   | B     | Config standardization |        |               |       |
   | C     | ESM imports            |        |               |       |
   | D     | Source code fixes      |        |               |       |
   | E     | Infrastructure         |        |               |       |

2. **Commit log:** List all commits with hashes

3. **Test evidence:** Full output of `pnpm test:unit` and `pnpm build`

4. **Documentation changes:** List of issue tracker updates made

5. **Skipped items:** Issues that were already resolved by prior execution

6. **New findings:** Additional violations discovered during execution
   (documented only, not fixed)

7. **Branch status:** Ready for merge? Any blockers?
