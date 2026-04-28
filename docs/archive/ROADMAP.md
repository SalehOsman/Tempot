# Tempot — Roadmap

> **The single source of truth** for project status. Updated after every merge. (Rule LXXXIX)
> Last updated: 2026-04-28 (Started spec #026 execution with Tempot Doctor quick mode)

## Phase 0 — Workspace ✅ Done

Monorepo, TypeScript Strict, ESLint, Prettier, Husky, Constitution v2.0.0, Architecture Spec document v11.0.

## Current Technical Baseline

| Area | Baseline | Notes |
| ---- | -------- | ----- |
| Runtime | Node.js 22.12+ | Required by Astro 6 and used by CI through Node 24 |
| Package manager | pnpm 10+ | CI pins pnpm 10 |
| Documentation | Astro 6 + Starlight 0.38 | Security-maintained docs runtime |

## Current Strategic Track

**Active workstream:** Spec #026 — Architecture Isolation and SaaS Readiness.

This track runs before the next business module. Its purpose is to raise Tempot from a working bot framework into a stricter professional foundation where packages, modules, apps, and future SaaS layers have explicit boundaries.

Scope:

1. Document and audit current architecture boundaries.
2. Define a staged remediation plan for boundary drift before adding more business modules.
3. Keep Tempot Core as the current product while documenting a future Tempot Cloud SaaS path.
4. Treat Telegram Managed Bots as a positive optional capability, isolated behind a future adapter/service boundary.
5. Improve template usability through module checklists, onboarding guidance, and documentation cleanup.
6. Define explicit DX tooling targets: official CLI, governed module generator, local developer doctor, quick path, and internal template marketplace.
7. Define explicit security and operations targets: blocking audit policy, secret scanning, dependency review, token rotation guidance, and observability dashboard scope.

Artifacts:

- SpecKit: `specs/026-architecture-isolation-and-saas-readiness/`
- Superpowers plan: `docs/archive/superpowers/plans/2026-04-28-architecture-isolation-and-saas-readiness.md`

Execution artifacts created in the architecture hardening branch:

- Boundary governance: `docs/archive/architecture/boundaries/`
- Strategic ADRs: `docs/archive/architecture/adr/ADR-040-tempot-core-cloud-boundary.md`, `docs/archive/architecture/adr/ADR-041-telegram-managed-bots-strategy.md`
- SaaS readiness: `docs/archive/architecture/saas-readiness.md`, `docs/archive/architecture/saas-migration-map.md`
- Telegram Managed Bots: `docs/archive/architecture/telegram-managed-bots-assessment.md`, `docs/archive/architecture/telegram-managed-bots-integration-boundary.md`
- Developer experience: `docs/archive/developer/template-usability-roadmap.md`, `docs/archive/developer/module-generator-plan.md`, `docs/archive/developer/local-developer-doctor.md`, `docs/archive/developer/quick-path-first-module.md`
- Agent guidance: `docs/archive/developer/agent-skills-guide.md`
- Security and operations: `docs/archive/security/security-baseline.md`, `docs/archive/architecture/observability-dashboard.md`

Initial execution artifacts:

- Developer doctor quick mode: `pnpm tempot doctor --quick`
- Implementation plan: `docs/archive/superpowers/plans/2026-04-28-tempot-doctor-quick.md`
- Tests: `scripts/tempot/tests/unit/doctor.test.ts`

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
| 3   | database        | ✅   | ⚠️      | ✅   | ❌      | ❌    | ❌     | ❌       | ✅        | ✅\*    | ✅     | ✅    | ✅ Complete                             |
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
2. ~~Phase 2B: bot-server reconstruction~~ — ✅ Complete (131 tests, merged to main)
3. ~~Phase 2C: Application wiring~~ — ✅ Complete (deps.factory.ts, all stubs replaced, merged 2026-04-06)
4. ~~Phase 2D: Integration testing~~ — ✅ Complete (Validate module-registry + bot-server work together end-to-end)
5. ~~Phase 3: First business module~~ — ✅ `user-management` implemented (spec #025)
6. Phase 3A: Architecture isolation and SaaS readiness — Active (spec #026; first DX tool slice implemented with `pnpm tempot doctor --quick`)
7. Phase 3B: Next business module — Starts after spec #026 review and boundary hardening decisions

## Phase 2 — Module Infrastructure

**Status:** In progress. module-registry merged to main.

Planned scope:

1. **module-registry** (spec #019) — ✅ Merged to main, 98 tests passing
2. **bot-server reconstruction** (spec #020) — ✅ Merged to main, 131 tests passing
3. **bot-server wiring** (spec #020 Phase B) — ✅ Merged 2026-04-06: `deps.factory.ts` wires all 10 `@tempot/*` packages; all 7 stubs replaced; `index.ts` ≤30 lines; 25 new unit tests (W1/W2/W3)
4. **DevOps: Local development setup** — ✅ Complete (Cloudflare Tunnel (`cloudflared`) for local webhook testing)
5. **Integration testing** — Validate module-registry + bot-server work together end-to-end

## Phase 3 — Business Modules

Started. The first business module has been implemented on main.

| #   | Module          | Spec | Status                                      |
| --- | --------------- | ---- | ------------------------------------------- |
| 1   | user-management | #025 | ✅ Implemented; governance hardening active |

Next Phase 3 focus: complete spec #026 architecture isolation and SaaS readiness before starting the next business module. User-management stabilization remains part of the boundary hardening audit.

## Phase 4 — Additional Frontends

Not started. Depends on Phase 3.

| #   | App       | Technology        | Description                                                        |
| --- | --------- | ----------------- | ------------------------------------------------------------------ |
| 1   | dashboard | Next.js           | Comprehensive admin panel with auto-discovered module plugin pages |
| 2   | mini-apps | Next.js           | User-facing mini applications with secure `initData` binding       |
| 3   | docs      | Starlight (Astro) | Engineering documentation platform — ADR-038                       |

> Design details: `docs/archive/tempot_v11_final.md` (Architecture Spec document v11, Section 12)

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
