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
