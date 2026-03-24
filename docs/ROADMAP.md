# Tempot — Roadmap

> **المرجع الوحيد** لحالة المشروع. يُحدّث بعد كل دمج. (Rule LX)
> آخر تحديث: 2026-03-23

## Phase 0 — Workspace ✅ Done

Monorepo, TypeScript Strict, ESLint, Prettier, Husky, Constitution v2.0.0, Spec v11.0.

## Phase 1 — Core Bedrock Packages

### Status Key

| Symbol | SpecKit | Superpowers |
|--------|---------|-------------|
| ✅ | Artifact exists and reviewed | Skill completed |
| ⚠️ | Exists but needs review | Partially done |
| ❌ | Not done | Not done |
| — | Not applicable | Not applicable |

### Package Progress

| # | Package | spec | clarify | plan | analyze | tasks | design | worktree | exec-plan | execute | review | merge | Status |
|---|---------|------|---------|------|---------|-------|--------|----------|-----------|---------|--------|-------|--------|
| 1 | shared | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅* | ❌ | ✅* | Built, gaps |
| 2 | logger | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅* | ❌ | ✅* | Built, gaps |
| 3 | database | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅* | ❌ | ✅* | Built, 3 criticals |
| 4 | event-bus | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅* | ❌ | ✅* | Built, gaps |
| 5 | auth-core | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅* | ❌ | ✅* | Built, gaps |
| 6 | session-manager | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | Built — pending review + merge |
| 7 | i18n-core | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 8 | regional-engine | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 9 | cms-engine | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 10 | storage-engine | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 11 | input-engine | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 12 | ux-helpers | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 13 | notifier | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 14 | search-engine | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 15 | ai-core | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 16 | document-engine | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |
| 17 | import-engine | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Not started |

✅* = Built but skipped workflow steps (pre-methodology)

### Critical Blockers

| ID | Issue | Package | Status |
|----|-------|---------|--------|
| CRITICAL-001 | session-manager is a hollow stub | session-manager | ✅ RESOLVED |
| CRITICAL-002 | Silent failure in getPrismaClient | database | Pending verification |
| CRITICAL-003 | eslint-disable any in 7 files | database, event-bus, logger | ✅ RESOLVED |

### Next Action

**session-manager** — Built, pending code review + merge.
**i18n-core** — Next package to start SpecKit workflow.

## Phase 2 — Bot Server Reconstruction

Not started. Depends on Phase 1 completion.

## Phase 3 — Business Modules

Not started. Depends on Phase 2.

## Phase 4 — Additional Frontends

Not started. Depends on Phase 3.
