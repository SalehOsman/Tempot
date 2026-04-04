# Tempot — Roadmap

> **The single source of truth** for project status. Updated after every merge. (Rule LXXXIX)
> Last updated: 2026-04-04 (Phase 1A documentation cleanup — project readiness plan)

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

| #   | Package         | spec | clarify | plan | analyze | tasks | design | worktree | exec-plan | execute | review | merge | Status                                       |
| --- | --------------- | ---- | ------- | ---- | ------- | ----- | ------ | -------- | --------- | ------- | ------ | ----- | -------------------------------------------- |
| 1   | shared          | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps (pre-methodology)                |
| 2   | logger          | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps                                  |
| 3   | database        | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ✅\*    | ✅     | ✅    | ✅ Complete (PENDING-DOCKER int. tests)      |
| 4   | event-bus       | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps                                  |
| 5   | auth-core       | ✅   | ⚠️      | ✅   | ❌      | ❌    | ✅     | ❌       | ✅        | ✅\*    | ❌     | ✅\*  | Built, gaps                                  |
| 6   | session-manager | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                                  |
| 7   | i18n-core       | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                                  |
| 8   | regional-engine | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                                  |
| 9   | cms-engine      | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                                  |
| 10  | storage-engine  | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                                  |
| 11  | input-engine    | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete (Phase 1 + Phase 2 merged)       |
| 12  | ux-helpers      | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                                  |
| 13  | sentry          | —    | —       | —    | —       | —     | —      | —        | —         | ✅\*    | —      | ✅\*  | Built (infra, pre-methodology)               |
| 14  | notifier        | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                                  |
| 15  | search-engine   | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                                  |
| 16  | ai-core         | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete (Phase 2 merged)                 |
| 17  | document-engine | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                                  |
| 18  | import-engine   | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                                  |
| 19  | settings        | ❌   | ❌      | ❌   | ❌      | ❌    | ❌     | ❌       | ❌        | ❌      | ❌     | ❌    | Not started (identified in audit 2026-04-04) |
| —   | module-registry | —    | —       | —    | —       | —     | —      | —        | —         | —       | —      | —     | Placeholder only (README, no impl)           |

✅\* = Built but skipped workflow steps (pre-methodology)

### Critical Blockers

| ID           | Issue                                                                               | Package                                           | Status      |
| ------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------- | ----------- |
| CRITICAL-001 | session-manager is a hollow stub                                                    | session-manager                                   | ✅ RESOLVED |
| CRITICAL-002 | Silent failure in getPrismaClient                                                   | database                                          | ✅ RESOLVED |
| CRITICAL-003 | eslint-disable any in 7 files                                                       | database, event-bus, logger                       | ✅ RESOLVED |
| ISSUE-004    | Strict type safety violations (any / eslint-disable)                                | database, event-bus, logger                       | ✅ RESOLVED |
| ISSUE-005    | Repository Pattern violation in AuditLogger                                         | logger                                            | ✅ RESOLVED |
| ISSUE-006    | bot-server build broken (@types/node missing)                                       | bot-server                                        | ✅ RESOLVED |
| ISSUE-008    | session-manager needs subpath export ./context to eliminate deep import in database | session-manager                                   | ✅ RESOLVED |
| ISSUE-009    | Phantom dependencies across 4 packages                                              | logger, database, session-manager, storage-engine | ✅ RESOLVED |
| ISSUE-010    | Vitest config inconsistency (3 packages)                                            | auth-core, session-manager, i18n-core, logger     | ✅ RESOLVED |
| ISSUE-011    | i18n-core tsconfig missing exclude                                                  | i18n-core                                         | ✅ RESOLVED |

### Next Action

**Project readiness plan created** — see `docs/superpowers/specs/2026-04-04-project-readiness-plan.md` for full details.

**Phase 1 status:** 13 packages built and merged (shared, logger, database, event-bus, auth-core, session-manager, i18n-core, regional-engine, storage-engine, ux-helpers, input-engine, ai-core, sentry). 6 packages remaining (settings, cms-engine, notifier, search-engine, document-engine, import-engine).

**Next steps (in order):**

1. Phase 1A: Documentation cleanup (current session)
2. Phase 1B: Complete SpecKit artifacts for 6 remaining packages (Gemini CLI)
3. Phase 1C: Build 6 packages sequentially (Claude Code)
4. Phase 2: Module infrastructure (module-registry, bot-server reconstruction)
5. Phase 3: Test module (person-registration)

## Phase 2 — Module Infrastructure

Not started. Depends on Phase 1 completion (all 19 packages built and merged).

Planned scope:

1. **module-registry** — Full SpecKit + Superpowers cycle (currently README placeholder only)
2. **bot-server reconstruction** — Replace 72-line prototype with production assembly
3. **Bot-server integration testing** — Validate module-registry + bot-server work together end-to-end

## Phase 3 — Business Modules

Not started. Depends on Phase 2.

## Phase 4 — Additional Frontends

Not started. Depends on Phase 3.
