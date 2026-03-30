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

## ISSUE-004: Strict Type Safety Violations (Rule I)

**Severity:** CRITICAL
**Packages:** `logger`, `event-bus`, `database`
**Discovered:** 2026-03-24 (during compliance review)
**Resolved:** 2026-03-30 by Claude Code (branch `fix/audit-v2-2026-03-30`)

**Problem:**
Widespread usage of `as any` and `/* eslint-disable @typescript-eslint/no-explicit-any */` across legacy Phase 0 packages, specifically in `audit.logger.ts`, `orchestrator.ts`, `local.bus.ts`, `transaction.manager.ts`, and `base.repository.ts`.

**Fix:** Removed `any` type and `eslint-disable` from `base.repository.ts` (database). Changed `PrismaModelDelegate` type from `Record<string, any>` to `object`, with internal `PrismaDelegateMethods` interface for type-safe method access. Replaced hardcoded log strings in `orchestrator.ts` (event-bus) with structured error codes. Logger and event-bus were already clean from prior hotfix (`ISSUE-006`, `ISSUE-007` below).

---

## ISSUE-005: Repository Pattern Violation (Rule XIV)

**Severity:** HIGH
**Package:** logger
**File:** `packages/logger/src/audit/audit.logger.ts`
**Discovered:** 2026-03-24 (during compliance review)
**Resolved:** 2026-03-30 — verified clean (branch `fix/audit-v2-2026-03-30`)

**Problem:**
Direct injection and use of `PrismaClient` in `AuditLogger` service.

**Fix:** Already resolved by prior work (ISSUE-007 hotfix created `AuditLogRepository`). `AuditLogger` now uses `AuditLogRepository` — no direct `PrismaClient` reference. Verified from source and moved to resolved.

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

---

## ISSUE-008: session-manager subpath export ./context

**Severity:** HIGH
**Package:** session-manager
**Discovered:** 2026-03-24
**Resolved:** 2026-03-24
**Fix:** Added subpath export `./context` to session-manager package.json to eliminate deep import in database.

_(Note: This issue was tracked in ROADMAP.md Critical Blockers table only, now added here for completeness.)_

---

## ISSUE-009: Phantom Dependencies Across 4 Packages (Rule LXXVII)

**Severity:** CRITICAL
**Packages:** `logger`, `database`, `session-manager`, `storage-engine`
**Discovered:** 2026-03-30 (comprehensive audit)
**Resolved:** 2026-03-30 by Claude Code (branch `fix/audit-v2-2026-03-30`, commit `a6e952c`)

**Problem:**
9 phantom dependencies found across 4 packages — declared in `package.json` but never imported in `src/`:

| Package         | Phantom Dependency                                               |
| --------------- | ---------------------------------------------------------------- |
| logger          | `pino-pretty`                                                    |
| database        | `@casl/prisma`, `pgvector`, `glob` (moved to devDeps)           |
| session-manager | `cache-manager`, `@tempot/event-bus`                             |
| storage-engine  | `@tempot/event-bus`, `@tempot/session-manager`, `@tempot/logger` |

**Fix:** Removed 8 phantom dependencies from `package.json` files, moved `glob` to devDependencies in database. Verified no runtime imports existed for any.

---

## ISSUE-010: Vitest Config Inconsistency (3 Packages)

**Severity:** HIGH
**Packages:** `auth-core`, `session-manager`, `i18n-core`, `logger`
**Discovered:** 2026-03-30 (comprehensive audit)
**Resolved:** 2026-03-30 by Claude Code (branch `fix/audit-v2-2026-03-30`, commit `59760ac`)

**Problem:**
Three packages used flat vitest config with `globals: true` instead of the project-based `defineProject` pattern. Logger was missing integration test project.

**Fix:** Standardized all 4 vitest configs to `defineProject` pattern matching `regional-engine` gold standard. Moved `session-manager/tests/provider.test.ts` into `tests/unit/`. Updated import paths for new directory structure.

---

## ISSUE-011: i18n-core tsconfig Missing Exclude

**Severity:** HIGH
**Package:** `i18n-core`
**File:** `packages/i18n-core/tsconfig.json`
**Discovered:** 2026-03-30 (comprehensive audit)
**Resolved:** 2026-03-30 by Claude Code (branch `fix/audit-v2-2026-03-30`, commit `59760ac`)

**Problem:**
Only package of 10 without an explicit `"exclude"` array in tsconfig.json.

**Fix:** Added `"exclude": ["node_modules", "dist", "tests"]` to match all other packages.

---

_Resolved issues are moved here from `docs/issues/OPEN.md` with the resolution date._
