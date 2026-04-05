# Tempot — Roadmap

> **The single source of truth** for project status. Updated after every merge. (Rule LXXXIX)
> Last updated: 2026-04-05 (added Phase 4-6 scope from Architecture Spec)

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
| 11  | input-engine    | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete (Phase 1 + Phase 2 merged)  |
| 12  | ux-helpers      | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |
| 13  | sentry          | —    | —       | —    | —       | —     | —      | —        | —         | ✅\*    | —      | ✅\*  | Built (infra, pre-methodology)          |
| 14  | notifier        | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 15  | search-engine   | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 16  | ai-core         | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete (Phase 2 merged)            |
| 17  | document-engine | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| 18  | settings        | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |
| 19  | import-engine   | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ❌      | ❌     | ❌    | Not started                             |
| —   | module-registry | ✅   | ✅      | ✅   | ✅      | ✅    | ✅     | ✅       | ✅        | ✅      | ✅     | ✅    | ✅ Complete                             |

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

**Phase 1 status:** 14 packages built and merged (shared, logger, database, event-bus, auth-core, session-manager, i18n-core, regional-engine, storage-engine, ux-helpers, input-engine, ai-core, sentry, settings). 5 packages remaining but **deferred** (cms-engine, notifier, search-engine, document-engine, import-engine) — these are optional packages that will be built only when a business module needs them.

**Next steps (in order):**

1. ~~Phase 2A: module-registry~~ — ✅ Complete (spec #019, merged to main)
2. Phase 2B: bot-server reconstruction — Full SpecKit + Superpowers cycle (spec #020)
3. Phase 2C: Integration testing — Validate module-registry + bot-server work together
4. Phase 3: First test module (person-registration)

## Phase 2 — Module Infrastructure

**Status:** In progress. module-registry merged to main.

Planned scope:

1. **module-registry** (spec #019) — ✅ Merged to main, 98 tests passing
2. **bot-server reconstruction** (spec #020) — Replace 72-line prototype with production assembly
3. **DevOps: Local development setup** — Cloudflare Tunnel (`cloudflared`) for local webhook testing (Architecture Spec Section 25.4)
4. **Integration testing** — Validate module-registry + bot-server work together end-to-end

## Phase 3 — Business Modules

Not started. Depends on Phase 2.

## Phase 4 — Additional Frontends

Not started. Depends on Phase 3.

| #   | App       | Technology | Description                                                        |
| --- | --------- | ---------- | ------------------------------------------------------------------ |
| 1   | dashboard | Next.js    | Comprehensive admin panel with auto-discovered module plugin pages |
| 2   | mini-apps | Next.js    | User-facing mini applications with secure `initData` binding       |
| 3   | docs      | Docusaurus | Engineering documentation platform                                 |

> Design details: `docs/architecture/DASHBOARD-MINIAPP-DESIGN.md` (Architecture Spec Section 12)

## Phase 5 — Enterprise Infrastructure

Not started. Depends on Phase 3.

| #   | Package        | Toggle Env       | Description                                                                  |
| --- | -------------- | ---------------- | ---------------------------------------------------------------------------- |
| 1   | backup-engine  | `TEMPOT_BACKUP`  | Automatic backups via queue factory + storage-engine                         |
| 2   | privacy-module | `TEMPOT_PRIVACY` | GDPR-style consent management, data retention, right to erasure (Section 31) |
| 3   | payment-core   | `TEMPOT_PAYMENT` | Telegram Payments + Stripe + PayPal, subscription plans (Section 32)         |
| 4   | audit-log      | `TEMPOT_AUDIT`   | Unified audit log with 90-day lifecycle and SUPER_ADMIN alerts (Section 10)  |

> `audit-log` is the single reference for all audit structure (Sections 8.5.5, 10.2, 19, 20, 31 defer to it).

## Phase 6 — Observability & Developer Experience

Not started. Depends on Phase 4.

| #   | Item                 | Version Target | Description                                                |
| --- | -------------------- | -------------- | ---------------------------------------------------------- |
| 1   | OpenTelemetry        | v1.4           | Distributed tracing and metrics collection                 |
| 2   | Prometheus + Grafana | v1.4           | Metrics storage and visualization dashboards               |
| 3   | DX Tooling           | v1.1           | Starter Templates + VS Code Extension + Module Marketplace |

## Version Mapping

Maps Architecture Spec version milestones (Section 33) to project development phases.

| Version | Name          | Scope                                               | Phase Mapping       | Status         |
| ------- | ------------- | --------------------------------------------------- | ------------------- | -------------- |
| v1.0    | MVP           | Complete infrastructure — everything in the spec    | Phase 0–3           | In development |
| v1.1    | DX            | Starter Templates + VS Code Extension + Marketplace | Phase 6 (partial)   | Planned        |
| v1.2    | AI            | RAG + Anomaly Detection + Smart Search              | Phase 3+ (AI layer) | Planned        |
| v1.3    | Mini Apps     | Starter Template + Component Library                | Phase 4 (partial)   | Planned        |
| v1.4    | Observability | OpenTelemetry + Prometheus + Grafana                | Phase 6 (partial)   | Planned        |
| v2.0    | Enterprise    | Multi-bot + Multi-tenant + SSO + Cross-platform     | Beyond Phase 6      | Future vision  |
