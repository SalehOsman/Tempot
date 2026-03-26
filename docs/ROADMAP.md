# Tempot — Roadmap

> **المرجع الوحيد** لحالة المشروع. يُحدّث بعد كل دمج. (Rule LXXXIX)
> آخر تحديث: 2026-03-26 (ux-helpers ✅ complete)

## Phase 0 — Workspace ✅ Done

Monorepo, TypeScript Strict, ESLint, Prettier, Husky, Constitution v2.0.0, Spec v11.0.

## Phase 1 — Core Bedrock Packages

### Status Key

| Symbol | SpecKit                      | Superpowers     |
| ------ | ---------------------------- | --------------- |
| ✅     | Artifact exists and reviewed | Skill completed |
| ⚠️     | Exists but needs review      | Partially done  |
| ❌     | Not done                     | Not done        |
| —      | Not applicable               | Not applicable  |

### Package Progress

| #   | Package         | spec | clarify | plan | analyze | tasks | design | worktree | exec-plan | execute | review | merge | Status                                  |
| --- | --------------- | ---- | ------- | ---- | ------- | ----- | ------ | -------- | --------- | ------- | ------ | ----- | --------------------------------------- |
| 1   | shared          | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps (pre-methodology)           |
| 2   | logger          | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps                             |
| 3   | database        | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ✅\*    | ✅     | ✅    | ✅ Complete (PENDING-DOCKER int. tests) |
| 4   | event-bus       | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps                             |
| 5   | auth-core       | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps                             |
| 6   | session-manager | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |
| 7   | i18n-core       | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |
| 8   | regional-engine | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |
| 9   | cms-engine      | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 10  | storage-engine  | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |
| 11  | input-engine    | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 12  | ux-helpers      | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |
| 13  | notifier        | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 14  | search-engine   | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 15  | ai-core         | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 16  | document-engine | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 17  | import-engine   | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| —   | module-registry | —    | —       | —    | —       | —     | —      | —        | —         | —       | —      | —     | Placeholder only (README, no impl)      |

✅\* = Built but skipped workflow steps (pre-methodology)

### Critical Blockers

| ID           | Issue                                                                               | Package                     | Status      |
| ------------ | ----------------------------------------------------------------------------------- | --------------------------- | ----------- |
| CRITICAL-001 | session-manager is a hollow stub                                                    | session-manager             | ✅ RESOLVED |
| CRITICAL-002 | Silent failure in getPrismaClient                                                   | database                    | ✅ RESOLVED |
| CRITICAL-003 | eslint-disable any in 7 files                                                       | database, event-bus, logger | ✅ RESOLVED |
| ISSUE-004    | any types in event-bus                                                              | event-bus                   | ✅ RESOLVED |
| ISSUE-005    | any types + Repository Pattern in database/logger                                   | database, logger            | ✅ RESOLVED |
| ISSUE-006    | bot-server build broken (@types/node missing)                                       | bot-server                  | ✅ RESOLVED |
| ISSUE-008    | session-manager needs subpath export ./context to eliminate deep import in database | session-manager             | ✅ RESOLVED |

### Next Action

**All retroactive reviews complete** (auth-core `8402a71`, event-bus `7bbb4e1`, logger `d90e95c`)
**regional-engine complete** — first package built with full SpecKit + Superpowers methodology
**storage-engine complete** — 13 source files, 101 tests, 3 providers (Local/S3/Drive)
**ux-helpers complete** — 22 source files, 156 tests, 15 components across 6 categories
**Next:** choose next package to build (7 remaining: cms-engine, input-engine, notifier, search-engine, ai-core, document-engine, import-engine)

## Phase 2 — Bot Server Reconstruction

Not started. Depends on Phase 1 completion.

## Phase 3 — Business Modules

Not started. Depends on Phase 2.

## Phase 4 — Additional Frontends

Not started. Depends on Phase 3.
