# Comprehensive Project Audit Report

**Date:** 2026-03-30
**Auditor:** Technical Advisor (AI)
**Scope:** All 10 implemented packages, spec pipeline, infrastructure, methodology compliance
**Authority:** Constitution v2.2.0, Roles v1.1.0

---

## Executive Summary

Deep audit of the Tempot project covering all 10 implemented packages, 17 spec
directories, CI/CD pipeline, Docker setup, ESLint config, and git workflow compliance.

**Key Metrics:**

| Metric                     | Value                  |
| -------------------------- | ---------------------- |
| Total commits              | 185                    |
| Implemented packages       | 10/17 (+1 placeholder) |
| Specs passing handoff gate | 5/17                   |
| Total violations found     | 24                     |
| CRITICAL violations        | 8                      |
| HIGH violations            | 7                      |
| MEDIUM violations          | 5                      |
| LOW/MINOR violations       | 4                      |

**Overall Assessment:** The post-methodology packages (regional-engine, storage-engine,
ux-helpers) are high quality. Pre-methodology packages (logger, event-bus, auth-core,
database) carry technical debt. Phantom dependencies are the most widespread issue.

---

## Section 1: Package-by-Package Violations

### 1.1 @tempot/shared — Grade: A

**Violations: 0 | Warnings: 1**

| #   | Severity | Rule   | Location                              | Description                                                              |
| --- | -------- | ------ | ------------------------------------- | ------------------------------------------------------------------------ |
| —   | MINOR    | XXXVII | `tests/unit/queue.factory.test.ts:28` | Shared mutable `activeQueues` array between tests — latent coupling risk |

**Verdict:** Cleanest package. No action required.

---

### 1.2 @tempot/logger — Grade: B

**Violations: 2 | Warnings: 2**

| #    | Severity | Rule   | Location           | Description                                                                                  |
| ---- | -------- | ------ | ------------------ | -------------------------------------------------------------------------------------------- |
| V-01 | CRITICAL | LXXVII | `package.json`     | **Phantom dependency:** `pino-pretty` (^13.0.0) declared but never imported in `src/`        |
| V-02 | HIGH     | Config | `vitest.config.ts` | Integration test project missing — `tests/integration/audit-logger.test.ts` never runs       |
| W-01 | WARN     | —      | tests              | No dedicated test for `SENSITIVE_KEYS` export                                                |
| W-02 | WARN     | —      | OPEN.md            | ISSUE-004 (any types) and ISSUE-005 (direct PrismaClient) from prior review still unresolved |

**Prior unresolved issues:** ISSUE-004 (Rule I — any types in audit.logger.ts), ISSUE-005 (Rule XIV — direct PrismaClient injection).

---

### 1.3 @tempot/event-bus — Grade: B+

**Violations: 4 | Warnings: 3**

| #    | Severity | Rule  | Location                          | Description                                                             |
| ---- | -------- | ----- | --------------------------------- | ----------------------------------------------------------------------- |
| V-03 | MEDIUM   | XXXIX | `src/orchestrator.ts:40`          | Hardcoded English: `'CRITICAL: Redis Event Bus unavailable...'`         |
| V-04 | MEDIUM   | XXXIX | `src/orchestrator.ts:44`          | Hardcoded English: `'Redis Event Bus restored...'`                      |
| V-05 | MEDIUM   | XXXIX | `src/local/local.bus.ts:16`       | Hardcoded English in AppError: `` `Invalid event name: ${eventName}` `` |
| V-06 | MEDIUM   | XXXIX | `src/distributed/redis.bus.ts:30` | Hardcoded English in AppError: `` `Invalid event name: ${eventName}` `` |
| W-03 | WARN     | —     | tests                             | `validateEventName` not directly tested                                 |
| W-04 | WARN     | —     | tests                             | Orchestrator lifecycle methods (`init`, `dispose`) not tested           |
| W-05 | WARN     | —     | tests                             | `TempotEvents` interface untested                                       |

**Note on V-03/V-04:** These are log messages (developer-facing), not user-facing UI
text. Rule XXXIX says "user-facing text" but the Constitution's intent is zero
hardcoded strings. Flagged for Project Manager decision.

---

### 1.4 @tempot/auth-core — Grade: B+

**Violations: 1 | Warnings: 5**

| #    | Severity | Rule       | Location                          | Description                                                                        |
| ---- | -------- | ---------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| V-07 | HIGH     | Convention | `vitest.config.ts`                | Flat config with `globals: true` instead of project-based `defineProject` pattern  |
| W-06 | WARN     | I          | `src/contracts/session-user.ts:6` | `[key: string]: unknown` index signature weakens type safety                       |
| W-07 | WARN     | —          | tests                             | `SessionUser`, `AppSubjects` types have no test coverage                           |
| W-08 | WARN     | —          | `tests/unit/contracts.test.ts:11` | Trivial test: `it('should allow AppAction assignment')` asserts nothing meaningful |
| W-09 | WARN     | —          | `tsconfig.json`                   | Style inconsistency: `"./dist"` vs `"dist"`, `"src/**/*"` vs `"src"`               |
| W-10 | WARN     | —          | `vitest.config.ts`                | `globals: true` inconsistent with other packages                                   |

---

### 1.5 @tempot/database — Grade: B-

**Violations: 4 | Warnings: 2**

| #    | Severity | Rule   | Location                            | Description                                                                                              |
| ---- | -------- | ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| V-08 | CRITICAL | LXXVII | `package.json`                      | **Phantom dependency:** `@casl/prisma` (^1.6.1) — not imported in `src/`                                 |
| V-09 | CRITICAL | LXXVII | `package.json`                      | **Phantom dependency:** `pgvector` (^0.2.1) — not imported in `src/`                                     |
| V-10 | CRITICAL | LXXVII | `package.json`                      | **Phantom dependency:** `glob` (^11.1.0) — only used in `scripts/`, should be devDependency              |
| V-11 | HIGH     | I      | `src/base/base.repository.ts:32-33` | `eslint-disable` + `Record<string, any>` — documented Prisma boundary issue but still a Rule I violation |
| W-11 | WARN     | —      | tests                               | `AuditLogRepository` has no unit tests (only schema integration)                                         |
| W-12 | WARN     | —      | tests                               | `DB_CONFIG` export has no test coverage                                                                  |

**Note on V-11:** Line 22-31 contains a detailed comment explaining this is a Prisma
boundary compromise with a GitHub issue link. This is the ONLY `any` in the package.
The Project Manager should decide if this documented exception is acceptable or if a
branded generic workaround should be pursued.

---

### 1.6 @tempot/session-manager — Grade: B

**Violations: 3 | Warnings: 3**

| #    | Severity | Rule       | Location                 | Description                                                                                                       |
| ---- | -------- | ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| V-12 | CRITICAL | LXXVII     | `package.json`           | **Phantom dependency:** `cache-manager` (^6.0.0) — `CacheAdapter` interface defined manually without importing    |
| V-13 | CRITICAL | LXXVII     | `package.json`           | **Phantom dependency:** `@tempot/event-bus` (workspace:\*) — `EventBusAdapter` defined manually without importing |
| V-14 | HIGH     | Convention | `vitest.config.ts`       | Flat config with `globals: true` — inconsistent with project pattern                                              |
| W-13 | WARN     | Convention | `tests/provider.test.ts` | Test file in `tests/` root instead of `tests/unit/`                                                               |
| W-14 | WARN     | —          | tests                    | `createSessionWorker` / `SESSION_SYNC_QUEUE` (worker.ts) — zero test coverage                                     |
| W-15 | WARN     | —          | tests                    | `SessionRepository` has no direct unit test                                                                       |

---

### 1.7 @tempot/i18n-core — Grade: A-

**Violations: 2 | Warnings: 0**

| #    | Severity | Rule       | Location           | Description                                                                      |
| ---- | -------- | ---------- | ------------------ | -------------------------------------------------------------------------------- |
| V-15 | HIGH     | Convention | `vitest.config.ts` | Flat config with `globals: true` instead of project-based pattern                |
| V-16 | HIGH     | Config     | `tsconfig.json`    | Missing `"exclude": ["node_modules", "dist", "tests"]` — only package without it |

---

### 1.8 @tempot/regional-engine — Grade: A

**Violations: 0 | Warnings: 1**

| #   | Severity | Rule   | Location                            | Description                                                                           |
| --- | -------- | ------ | ----------------------------------- | ------------------------------------------------------------------------------------- |
| —   | MINOR    | XXXVII | `tests/unit/geo-service.test.ts:11` | Shared `GeoService` instance with mutable `GEO_REGISTRY` cache — latent test coupling |

**Verdict:** Clean. First package built with full methodology. No action required.

---

### 1.9 @tempot/storage-engine — Grade: A-

**Violations: 4 | Warnings: 1**

| #    | Severity | Rule   | Location                             | Description                                                                   |
| ---- | -------- | ------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| V-17 | CRITICAL | LXXVII | `package.json`                       | **Phantom dependency:** `@tempot/event-bus` — not imported in `src/`          |
| V-18 | CRITICAL | LXXVII | `package.json`                       | **Phantom dependency:** `@tempot/session-manager` — not imported in `src/`    |
| V-19 | CRITICAL | LXXVII | `package.json`                       | **Phantom dependency:** `@tempot/logger` — not imported in `src/`             |
| V-20 | LOW      | II     | `tests/unit/storage-service.test.ts` | 270 lines (exceeds 200-line limit, though ESLint relaxes this for test files) |
| W-16 | WARN     | —      | tests                                | `createTelegramProvider()` factory exported but has no dedicated test         |

**Note on V-20:** ESLint config explicitly relaxes `max-lines` for test files. This is
by design but worth noting for consistency.

---

### 1.10 @tempot/ux-helpers — Grade: A+

**Violations: 0 | Warnings: 0**

**Verdict:** Cleanest and most thoroughly tested package. 156 tests with 1:1
module-to-test coverage. Full project-based vitest config. No violations found.

---

## Section 2: Spec Pipeline Status

### 2.1 Handoff Gate Compliance (Rule LXXXII)

Handoff gate requires: `spec.md` (no NEEDS CLARIFICATION) + `plan.md` + `tasks.md`.

| Spec                | Package Status | spec.md | plan.md | tasks.md | Gate |
| ------------------- | -------------- | ------- | ------- | -------- | ---- |
| 001-database        | Implemented    | YES     | YES     | **NO**   | FAIL |
| 002-shared          | Implemented    | YES     | YES     | **NO**   | FAIL |
| 003-auth-core       | Implemented    | YES     | YES     | **NO**   | FAIL |
| 004-session-manager | Implemented    | YES     | YES     | YES      | PASS |
| 005-logger          | Implemented    | YES     | YES     | **NO**   | FAIL |
| 006-event-bus       | Implemented    | YES     | YES     | **NO**   | FAIL |
| 007-i18n-core       | Implemented    | YES     | YES     | YES      | PASS |
| 008-cms-engine      | Not started    | YES     | YES     | **NO**   | FAIL |
| 009-regional-engine | Implemented    | YES     | YES     | YES      | PASS |
| 010-storage-engine  | Implemented    | YES     | YES     | YES      | PASS |
| 011-input-engine    | Not started    | YES     | YES     | **NO**   | FAIL |
| 012-ux-helpers      | Implemented    | YES     | YES     | YES      | PASS |
| 013-notifier        | Not started    | YES     | YES     | **NO**   | FAIL |
| 014-search-engine   | Not started    | YES     | YES     | **NO**   | FAIL |
| 015-ai-core         | Not started    | YES     | YES     | **NO**   | FAIL |
| 016-document-engine | Not started    | YES     | YES     | **NO**   | FAIL |
| 017-import-engine   | Not started    | YES     | YES     | **NO**   | FAIL |

**Result:** 5/17 pass the handoff gate (29%). 12/17 missing `tasks.md`.

**Note:** Zero `[NEEDS CLARIFICATION]` markers found across all spec.md files.

### 2.2 Missing Spec

`module-registry` has no spec directory in `specs/`. It exists as a placeholder
package (README only) in `packages/`.

---

## Section 3: Git Workflow Compliance (Rule LXXXV)

### 3.1 Branch Status

Only `main` branch exists. No active feature branches or worktrees.

### 3.2 Direct-to-Main Violations

| Era                                          | Commits on main                            | Assessment                                    |
| -------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| Pre-methodology (database through i18n-core) | ~30 feat/fix commits                       | Expected — methodology not yet established    |
| Post-methodology (regional onward)           | Proper feature branches with merge commits | Compliant                                     |
| Fix/chore commits (post-methodology)         | 6+ fix/chore commits directly on main      | Grey area — rule says "NEVER develop on main" |

**Specific post-methodology violations:**

- `3b39478` — `chore: final audit cleanup` — directly on main
- `535f077` — `fix(i18n-core): declare @tempot/shared as explicit dependency` — directly on main
- `9c35b9c` — `chore: fix 12 audit findings` — directly on main
- `8c60189` — `refactor: move TestDB to @tempot/database/testing` — directly on main
- `6d990c9` — `fix: resolve post-cleanup integration test timeouts` — directly on main
- TelegramProvider docs commits after merge — directly on main

### 3.3 Commit Message Issues

- `1267550` (session-manager merge) — contains raw git template text (`# Please
enter a commit message...`). This is a hygiene issue.

---

## Section 4: Infrastructure Audit

### 4.1 CI/CD Pipeline (`.github/workflows/ci.yml`)

| Aspect              | Status     | Notes                                                         |
| ------------------- | ---------- | ------------------------------------------------------------- |
| Job pipeline        | GOOD       | lint → typecheck → test-unit → test-integration → audit       |
| Service containers  | GOOD       | PostgreSQL (pgvector) + Redis 7 for integration tests         |
| Concurrency control | GOOD       | cancel-in-progress enabled                                    |
| Security audit      | WARN       | `continue-on-error: true` — audit failures won't block builds |
| Coverage reporting  | MISSING    | No Codecov/Coveralls upload                                   |
| Build caching       | MISSING    | Only pnpm cache, no build artifact cache between jobs         |
| `typecheck` job     | SUBOPTIMAL | Runs `pnpm build` instead of lighter `tsc --noEmit`           |

### 4.2 Docker Configuration

| Aspect                | Status      | Notes                                              |
| --------------------- | ----------- | -------------------------------------------------- |
| PostgreSQL service    | GOOD        | pgvector with health checks                        |
| Redis service         | GOOD        | Redis 7 Alpine with persistence                    |
| bot-server service    | PLACEHOLDER | Entirely commented out (Phase 5)                   |
| PostgreSQL version    | WARN        | Uses `latest` tag — should pin for reproducibility |
| bot-server Dockerfile | PLACEHOLDER | 39 lines of comments, zero executable instructions |

### 4.3 ESLint Configuration

**Rules correctly mapped to Constitution:**

- `no-explicit-any` → Rule I
- `ban-ts-comment` → Rule I
- `max-lines: 200` → Rule II
- `max-lines-per-function: 50` → Rule II
- `max-params: 3` → Rule II
- `no-console` → Rule LXXIV
- `filename-blocklist` → Rule III
- `no-empty` → Rule X

**Gaps:**

- No `import/no-extraneous-dependencies` — phantom deps are manual checks only
- No `@typescript-eslint/no-floating-promises` — significant gap for async code
- `check-file/filename-blocklist` blocks `*helpers*` — may false-positive on
  `ux-helpers` package files
- `no-warning-comments` is `warn` not `error` — TODOs won't fail builds

### 4.4 Bot Server (`apps/bot-server`)

**Status:** Self-documented prototype (72 lines). Header explicitly states it
violates constitutional rules and "will not enter production."

**Known violations (self-documented):**

- Rule XXXIX: Hardcoded English strings
- Rule XXV: No CASL, no rate limiting, no Zod validation
- Rule XXI: No Result pattern
- Rule XV: No Event Bus integration

**package.json issue:** `grammy: "^1.0.0"` — tech stack specifies `^1.41.1`.
This range could resolve to grammy 1.0.0 (years old).

---

## Section 5: Cross-Cutting Issues

### 5.1 Phantom Dependencies (Rule LXXVII) — Most Widespread Issue

| Package         | Phantom Dependency        | In dependencies?       |
| --------------- | ------------------------- | ---------------------- |
| logger          | `pino-pretty`             | Yes (runtime)          |
| database        | `@casl/prisma`            | Yes (runtime)          |
| database        | `pgvector`                | Yes (runtime)          |
| database        | `glob`                    | Yes (should be devDep) |
| session-manager | `cache-manager`           | Yes (runtime)          |
| session-manager | `@tempot/event-bus`       | Yes (runtime)          |
| storage-engine  | `@tempot/event-bus`       | Yes (runtime)          |
| storage-engine  | `@tempot/session-manager` | Yes (runtime)          |
| storage-engine  | `@tempot/logger`          | Yes (runtime)          |

**Total: 9 phantom dependencies across 4 packages.**

### 5.2 Vitest Config Inconsistency

Three different vitest config patterns are in use:

| Pattern                         | Packages                                                                         | Count |
| ------------------------------- | -------------------------------------------------------------------------------- | ----- |
| Project-based (`defineProject`) | shared, database, logger, event-bus, regional-engine, storage-engine, ux-helpers | 7     |
| Flat with `globals: true`       | auth-core, session-manager, i18n-core                                            | 3     |

**Recommendation:** Standardize all 10 packages to the project-based pattern.

### 5.3 Prior Unresolved Issues (from OPEN.md)

| Issue                                         | Severity | Package                     | Status                                                                                                             |
| --------------------------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| ISSUE-004: `any` types + `eslint-disable`     | CRITICAL | logger, event-bus, database | **Still open** — partially resolved (event-bus, database cleaned up) but logger `audit.logger.ts` still has issues |
| ISSUE-005: Direct PrismaClient in AuditLogger | HIGH     | logger                      | **Still open**                                                                                                     |

---

## Section 6: Violation Summary Matrix

### By Severity

| Severity  | Count | Description                                                                                                                                 |
| --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CRITICAL  | 8     | 8 phantom dependencies (V-01, V-08–V-10, V-12–V-13, V-17–V-19)                                                                              |
| HIGH      | 7     | 1 any type (V-11), 4 vitest config inconsistencies (V-07, V-14–V-15), 1 missing tsconfig exclude (V-16), 1 orphaned integration test (V-02) |
| MEDIUM    | 5     | 4 hardcoded strings (V-03–V-06), 1 as yet uncharacterized                                                                                   |
| LOW/MINOR | 4     | Test file placement, test size, style inconsistencies                                                                                       |

### By Package

| Package         | CRITICAL | HIGH | MEDIUM | LOW | Total | Grade |
| --------------- | -------- | ---- | ------ | --- | ----- | ----- |
| shared          | 0        | 0    | 0      | 0   | 0     | A     |
| ux-helpers      | 0        | 0    | 0      | 0   | 0     | A+    |
| regional-engine | 0        | 0    | 0      | 0   | 0     | A     |
| i18n-core       | 0        | 2    | 0      | 0   | 2     | A-    |
| storage-engine  | 3        | 0    | 0      | 1   | 4     | A-    |
| auth-core       | 0        | 1    | 0      | 0   | 1     | B+    |
| event-bus       | 0        | 0    | 4      | 0   | 4     | B+    |
| session-manager | 2        | 1    | 0      | 0   | 3     | B     |
| logger          | 1        | 1    | 0      | 0   | 2     | B     |
| database        | 3        | 1    | 0      | 0   | 4     | B-    |

### By Rule

| Rule                       | Violations | Packages Affected                                 |
| -------------------------- | ---------- | ------------------------------------------------- |
| LXXVII (Phantom deps)      | 9          | logger, database, session-manager, storage-engine |
| XXXIX (Hardcoded strings)  | 4          | event-bus                                         |
| Convention (vitest config) | 4          | auth-core, session-manager, i18n-core, logger     |
| I (any/eslint-disable)     | 1          | database                                          |
| Config (tsconfig exclude)  | 1          | i18n-core                                         |

---

## Section 7: Recommended Action Plan

### Priority 1 — CRITICAL Fixes (Block further development)

**Action: Remove phantom dependencies from 4 packages**

These are Rule LXXVII violations that block merge per Constitution. For each phantom
dependency, decide: (a) remove from package.json, or (b) add an actual import in src/.

| Package         | Action                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| logger          | Remove `pino-pretty` from dependencies (it's a dev/CLI tool)             |
| database        | Remove `@casl/prisma`, `pgvector` from deps; move `glob` to devDeps      |
| session-manager | Remove `cache-manager`, `@tempot/event-bus` (interfaces defined locally) |
| storage-engine  | Remove `@tempot/event-bus`, `@tempot/session-manager`, `@tempot/logger`  |

### Priority 2 — HIGH Fixes (Should be resolved before next package)

1. **Logger: Add integration test project to vitest.config.ts** — currently
   `audit-logger.test.ts` never runs. This is untested code in production.

2. **Standardize vitest configs** — convert auth-core, session-manager, i18n-core
   to the project-based `defineProject` pattern used by 7 other packages.

3. **i18n-core: Add tsconfig exclude** — add `"exclude": ["node_modules", "dist", "tests"]`.

4. **Database: Document the `any` exception** — the Prisma boundary issue at
   `base.repository.ts:32-33` needs a formal ADR or constitution amendment if
   it is to be accepted. Currently it is a documented violation without formal approval.

### Priority 3 — MEDIUM Fixes (Address during next sprint)

1. **Event-bus hardcoded strings** — replace English strings in orchestrator.ts,
   local.bus.ts, redis.bus.ts with i18n keys or structured error codes.

2. **Resolve ISSUE-004 and ISSUE-005** — logger audit.logger.ts still has `any`
   types and direct PrismaClient usage from the 2026-03-24 compliance review.

### Priority 4 — Methodology Compliance (Before Phase 1 completion)

1. **Generate `tasks.md`** for the 5 implemented packages missing it:
   specs/001 (database), 002 (shared), 003 (auth-core), 005 (logger), 006 (event-bus).
   Required by Rule LXXXVIII (Retroactive Compliance).

2. **Generate `tasks.md`** for the 7 unimplemented packages before starting
   each one: 008-017. Required by Rule LXXXII (Handoff Gate).

### Priority 5 — Infrastructure Improvements

1. **Pin PostgreSQL version** in docker-compose.yml (replace `latest` tag).
2. **Fix grammy version** in bot-server package.json (`^1.0.0` → `^1.41.1`).
3. **Add `@typescript-eslint/no-floating-promises`** to ESLint config.
4. **Change CI audit job** to remove `continue-on-error: true` or add explicit
   failure notification.
5. **Review ESLint `*helpers*` blocklist** — verify it doesn't false-positive
   on `ux-helpers` package files.

---

## Section 8: Positive Findings

These represent genuine strengths of the project:

1. **Zero stale build artifacts** — no `.js` or `.d.ts` files found in any `src/`
   directory. The 172-artifact incident of 2026-03-24 is fully resolved.

2. **Exact version pinning** — `neverthrow: "8.2.0"`, `vitest: "4.1.0"`,
   `typescript: "5.9.3"` are exact across all 10 packages. No violations.

3. **Zero `console.*`** — all 10 packages use `process.stderr.write` where logger
   is unavailable. Complete compliance with Rule LXXIV.

4. **Result pattern adoption** — `Result<T, AppError>` via neverthrow is consistently
   used across all public APIs. This is the strongest architectural pattern in the
   codebase.

5. **Progressive quality improvement** — post-methodology packages (regional-engine,
   storage-engine, ux-helpers) have significantly fewer violations than pre-methodology
   packages. The methodology works.

6. **Comprehensive documentation** — 87-rule Constitution, per-package specs,
   ADRs, workflow guides, package creation checklist. Documentation quality is
   exceptional.

7. **CI pipeline exists and works** — 5-job pipeline with proper gating and
   service containers for integration tests.

8. **ux-helpers is exemplary** — 156 tests, 1:1 module-to-test coverage, zero
   violations. This should be the reference implementation for future packages.

---

## Section 9: LSP Diagnostic Findings (Discovered During Audit)

TypeScript LSP revealed additional errors in test files for two pre-methodology
packages. These indicate module resolution issues that may cause build failures:

### @tempot/logger — Test Import Errors

| File                                | Error                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `tests/unit/pino-logger.test.ts:3`  | Missing `.js` extension on relative import `../../src/technical/serializer`      |
| `tests/unit/pino-logger.test.ts:4`  | Missing `.js` extension on relative import `../../src/config`                    |
| `tests/unit/serializer.test.ts:2`   | Missing `.js` extension on relative import `../../src/technical/serializer`      |
| `tests/unit/audit-logger.test.ts:2` | Cannot find module `../../src/audit/audit.logger` — module path may be incorrect |

### @tempot/auth-core — Test Import Errors

| File                                   | Error                                                         |
| -------------------------------------- | ------------------------------------------------------------- |
| `tests/unit/ability.factory.test.ts:2` | Cannot find module `../../src/factory/ability.factory`        |
| `tests/unit/ability.factory.test.ts:3` | Missing `.js` extension on `../../src/contracts/session-user` |
| `tests/unit/ability.factory.test.ts:5` | Missing `.js` extension on `../../src/contracts/roles`        |
| `tests/unit/guard.test.ts:2`           | Missing `.js` extension on `../../src/guards/guard`           |
| `tests/unit/guard.test.ts:4`           | Missing `.js` extension on `../../src/contracts/actions`      |
| `tests/unit/guard.test.ts:5`           | Missing `.js` extension on `../../src/contracts/subjects`     |

**Note:** These are `moduleResolution: node16/nodenext` errors. Vitest may handle
them via its own resolution, but they indicate the test files are not fully
TypeScript-strict. These should be verified by running the actual tests.

---

**Report generated by Technical Advisor on 2026-03-30.**
**Next action: Awaiting Project Manager decision on priority order.**
