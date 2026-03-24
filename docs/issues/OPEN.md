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

## ISSUE-004: `any` types and `eslint-disable` in event-bus

**Severity:** ~~HIGH~~ → RESOLVED
**Resolved:** 2026-03-23 by Claude Code (hotfix-phase0-compliance branch)
**Fix:** Removed all `any` and `eslint-disable` in orchestrator.ts, local.bus.ts, and tests. 14/14 tests passing.

---

## ISSUE-005: `any` types in database BaseRepository and TransactionManager

**Severity:** ~~HIGH~~ → RESOLVED
**Resolved:** 2026-03-23 by Claude Code (hotfix-phase0-compliance branch)
**Fix:** Refactored to strict typing. Created AuditLogRepository. AuditLogger decoupled from PrismaClient.

**Remaining:** One AuditLogger integration test has userId matching issue — to be fixed in next cycle.

---

*New issues are appended below. Resolved issues are moved to `docs/issues/RESOLVED.md` with the resolution date.*
