# Open Issues — Requiring Resolution

> Issues discovered during development or code review.
> Each issue has an ID, severity, and must be resolved before the affected package is marked "complete".
> Updated: 2026-03-24

---

## ISSUE-004: Strict Type Safety Violations (Rule I)

**Severity:** CRITICAL
**Package:** Phase 0 legacy packages (`logger`, `event-bus`, `database`)
**Discovered:** 2026-03-24 (during compliance review)

**Problem:**
Widespread usage of `as any` and `/* eslint-disable @typescript-eslint/no-explicit-any */` across legacy Phase 0 packages, specifically in `audit.logger.ts`, `orchestrator.ts`, `local.bus.ts`, `transaction.manager.ts`, and `base.repository.ts`.

**Constitution Reference:** Rule I — `strict: true` is mandatory. No `any` types. STRICTLY PROHIBITED: Using `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` to bypass type or lint errors.

**Required Fix:**
Refactor these files to use proper generic types, `unknown`, or `Record<string, unknown>`.

---

## ISSUE-005: Repository Pattern Violation (Rule XIV)

**Severity:** HIGH
**Package:** logger
**File:** `packages/logger/src/audit/audit.logger.ts`
**Discovered:** 2026-03-24 (during compliance review)

**Problem:**
Direct injection and use of `PrismaClient` in `AuditLogger` service.

**Constitution Reference:** Rule XIV — All database access via `BaseRepository` only. No direct Prisma calls in services or handlers.

**Required Fix:**
Create an `AuditLogRepository` in the `database` package inheriting from `BaseRepository`, and inject that into `AuditLogger` to decouple the logger from Prisma directly.

---

## ISSUE-006: Phantom Dependencies Across 4 Packages (Rule LXXVII)

**Severity:** CRITICAL
**Packages:** `logger`, `database`, `session-manager`, `storage-engine`
**Discovered:** 2026-03-30 (comprehensive audit)
**Full Report:** `docs/issues/project-audit-2026-03-30.md` — Section 5.1

**Problem:**
9 phantom dependencies found across 4 packages. Dependencies declared in
`package.json` but never imported in `src/`:

| Package         | Phantom Dependency                                               |
| --------------- | ---------------------------------------------------------------- |
| logger          | `pino-pretty`                                                    |
| database        | `@casl/prisma`, `pgvector`, `glob` (should be devDep)            |
| session-manager | `cache-manager`, `@tempot/event-bus`                             |
| storage-engine  | `@tempot/event-bus`, `@tempot/session-manager`, `@tempot/logger` |

**Constitution Reference:** Rule LXXVII — Every dependency declared in `package.json`
MUST have at least one import from it in `src/`. Phantom dependencies are a CRITICAL
finding at code review and block merge.

**Required Fix:** Remove each phantom dependency from `package.json`, or add an actual
import in `src/` if the dependency is genuinely needed.

---

## ISSUE-007: Vitest Config Inconsistency (3 Packages)

**Severity:** HIGH
**Packages:** `auth-core`, `session-manager`, `i18n-core`
**Discovered:** 2026-03-30 (comprehensive audit)

**Problem:**
Three packages use flat vitest config with `globals: true` instead of the project-based
`defineProject` pattern used by the other 7 packages. Additionally, logger's vitest
config is missing an integration test project, causing `tests/integration/audit-logger.test.ts`
to never run.

**Required Fix:** Standardize all packages to the project-based pattern.

---

## ISSUE-008: i18n-core tsconfig Missing Exclude

**Severity:** HIGH
**Package:** `i18n-core`
**File:** `packages/i18n-core/tsconfig.json`
**Discovered:** 2026-03-30 (comprehensive audit)

**Problem:**
Only package of 10 without an explicit `"exclude"` array in tsconfig.json. Without it,
TypeScript may compile test files during `tsc` build.

**Required Fix:** Add `"exclude": ["node_modules", "dist", "tests"]`.

---

_New issues are appended below. Resolved issues are moved to `docs/issues/RESOLVED.md` with the resolution date._
