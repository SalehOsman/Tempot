# Resolved Issues

> Issues that have been fixed. Moved here from `OPEN.md` with resolution date.

---

## ISSUE-001: Test describe blocks reference constitution rule numbers

**Severity:** LOW
**Package:** session-manager
**File:** `packages/session-manager/tests/provider.test.ts`
**Discovered:** 2026-03-23
**Resolved:** 2026-03-24 by Gemini CLI
**Fix:** Test descriptions updated to describe behavior; Rule numbers moved to code comments.

---

## ISSUE-002: `eslint-disable` usage in session-manager

**Resolved:** 2026-03-23 by Claude Code (commit c76f6c0)
**Fix:** AuditLogger interface defined, eslint-disable removed from repository.ts

---

## ISSUE-003: `as any` casts in test files

**Severity:** LOW
**Package:** session-manager
**File:** `packages/session-manager/tests/provider.test.ts`
**Discovered:** 2026-03-23
**Resolved:** 2026-03-24 by Claude Code / Gemini CLI
**Fix:** Removed `as any` by implementing `SessionProviderDeps` parameters object and `as unknown as SessionRepository`.

---

## ISSUE-006: `any` types and `eslint-disable` in event-bus

**Severity:** HIGH
**Package:** event-bus
**Discovered:** 2026-03-23
**Resolved:** 2026-03-23 by Claude Code (hotfix-phase0-compliance branch)
**Fix:** Removed all `any` and `eslint-disable` in orchestrator.ts, local.bus.ts, and tests. 14/14 tests passing.

---

## ISSUE-007: `any` types in database BaseRepository and TransactionManager

**Severity:** HIGH
**Package:** database
**Discovered:** 2026-03-23
**Resolved:** 2026-03-23 by Claude Code (hotfix-phase0-compliance branch)
**Fix:** Refactored to strict typing. Created AuditLogRepository. AuditLogger decoupled from PrismaClient.

**Remaining:** One AuditLogger integration test has userId matching issue — to be fixed in next cycle.
