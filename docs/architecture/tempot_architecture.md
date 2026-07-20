# Tempot Architecture Specification

Version: 12.0
Status: Active source of truth
Last reviewed: 2026-07-18

Tempot means Template x Bot. It is an enterprise TypeScript framework for
building production-grade Telegram bots. The current product track is Tempot
Core: a single-bot starter framework that is easy to install, configure,
extend, test, and deploy. Tempot Cloud remains a future product track and must
not drive current implementation ahead of the single-bot template experience.

This document replaces the legacy Arabic/mojibake architecture document with an
English, RAG-safe, methodology-aligned source of truth. Historical material is
retained under `docs/archive/` and is not authoritative for new work.

## Source Of Truth Order

When documents conflict, use this order:

| Rank | Artifact | Purpose |
| ---: | --- | --- |
| 1 | `.specify/memory/constitution.md` | Non-negotiable engineering rules |
| 2 | `.specify/memory/roles.md` | Project role and authority model |
| 3 | `docs/ROADMAP.md` | Current product and delivery status |
| 4 | `docs/architecture/adr/` | Accepted architectural decisions |
| 5 | This file | Consolidated architecture specification |
| 6 | `docs/developer/workflow-guide.md` | Practical workflow guidance |
| 7 | `specs/{NNN}-{feature}/` | Feature-level source of truth |

## Section Compatibility Map

Some older documents cite section numbers from the legacy architecture file.
The numbers below are intentionally retained for compatibility.

| Section | Current topic |
| ---: | --- |
| 20 | Security and observability |
| 26 | Operations, health, monitoring, and runtime evidence |
| 29 | Documentation platform |
| 31 | Privacy and protected data |
| 35 | Licensing and dependency governance |

## 1. Product Identity

Tempot is a reusable Telegram bot framework, not a hosted SaaS product today.
The active product goal is a maintainable single-bot template with enterprise
quality: clear module boundaries, strict TypeScript, testable services,
operational evidence, and AI/RAG foundations that can be activated safely.

Current strategic priority order:

1. Make the single Telegram bot template easy to install, configure, extend,
   test, and deploy.
2. Keep packages, modules, settings, audit metadata, and runtime boundaries
   ready for eventual multi-bot operation.
3. Defer hosted SaaS features, billing, dashboards, and managed bot fleet
   operations until a Product Manager decision activates that track.

## 2. Locked Technical Stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 22.12+ |
| Package manager | pnpm 10.33.3 |
| Language | TypeScript 5.9.3 strict mode |
| Bot engine | grammY 1.41.x |
| Web server | Hono 4.x |
| Database | PostgreSQL 16 + pgvector |
| ORM | Prisma 7.x and Drizzle for pgvector |
| Cache | cache-manager + Keyv adapters |
| Queue | BullMQ through the shared queue factory |
| AI | Vercel AI SDK 6.x |
| Authorization | CASL 6.x |
| Error handling | neverthrow 8.2.0 |
| Testing | Vitest 4.1.0 + Testcontainers |
| i18n | i18next 25.x |
| Logging | Pino 9.x |
| Documentation | Astro 6 + Starlight + starlight-typedoc |

Substituting a locked technology requires an ADR before implementation.

## 3. Architecture Pattern

Tempot uses a strict modular monolith with Clean Architecture boundaries. The
repository is organized by deployment surface, shared packages, business
modules, specifications, and documentation.

| Layer | Directory | Responsibility |
| --- | --- | --- |
| Interface | `apps/` | Telegram bot server, documentation app, future dashboard and mini apps |
| Services | `packages/` | Reusable infrastructure and application services |
| Core | `modules/` | Business modules and domain workflows |
| Specification | `specs/` | SpecKit feature artifacts |
| Documentation | `docs/` | Architecture, developer, operations, product, and archive docs |

Dependencies flow inward through stable contracts. Modules do not import each
other directly. Cross-module behavior goes through the Event Bus.

## 4. Repository Structure

| Path | Meaning |
| --- | --- |
| `apps/bot-server/` | Hono and grammY runtime, webhook/polling entry points, startup orchestration |
| `apps/docs/` | Starlight documentation site, TypeDoc generation, docs ingestion tooling |
| `packages/` | Shared package layer used by apps and modules |
| `modules/` | Business modules with manifests, abilities, handlers, services, repositories, locales |
| `specs/` | SpecKit source artifacts by feature number |
| `docs/architecture/` | Active architecture and ADRs |
| `docs/developer/` | Developer workflow, module catalog, branch hygiene, knowledge graph |
| `docs/operations/` | Runbooks, evidence, risk, scaling, disaster recovery |
| `docs/project-analysis/` | Dated analysis packages and remediation reports |
| `docs/archive/` | Historical material retained for traceability only |

## 5. Authorization

Authorization is CASL-based. The role hierarchy is:

| Role | Level | Purpose |
| --- | ---: | --- |
| `GUEST` | 1 | Minimal access before membership approval |
| `USER` | 2 | Standard user capabilities |
| `ADMIN` | 3 | Module administration |
| `SUPER_ADMIN` | 4 | System-wide management through explicit bootstrap configuration |

Authorization must be enforced at module boundaries and repository boundaries.
No module may rely only on UI hiding or callback naming for protection.

## 6. User And Membership Model

`user-management` owns user profiles and profile editing. `membership-management`
owns access-mode behavior, membership requests, review, approval, and rejection.
Private bot mode must restrict unknown visitors to the membership request flow.
Public bot mode may expose approved public navigation entries.

## 7. Session And Input Runtime

`session-manager` provides Redis-backed session handling with database-backed
durability where required. `input-engine` owns governed multi-step input flows.
Conversation behavior must preserve inline-first UX and must not bypass module
authorization checks.

## 8. Internationalization And CMS

`i18n-core` owns translation lookup. `cms-engine` owns dynamic translation
overrides and AI-assisted draft review ports. User-facing text belongs in
locale files. Developer-facing code, comments, tests, and documentation must be
English.

## 9. Notifications

`notifier` owns notification request contracts, queue production, delivery
processing, Telegram delivery adapters, and rate policy. Notification workflows
must publish completion or failure events and must preserve audit traceability.

## 10. Logging And Audit

Pino is the structured logging engine. Audit events must record state-changing
operations with enough context to trace actor, action, target, status, and
timestamp. Sensitive fields must be redacted before logs or external monitoring
receive them.

## 11. Settings And Regional Defaults

`settings` owns static and dynamic configuration contracts. `regional-engine`
owns regional defaults, timezone and date handling, country and state data, and
Egypt-specific defaults. All dates are stored as UTC and localized only at the
presentation boundary.

## 12. Interaction Surfaces

Current interaction surface is Telegram through `apps/bot-server`. Future
dashboard and mini app surfaces remain planned. New surfaces must consume the
same package and module contracts instead of duplicating business logic.

## 13. UX Rules

Telegram UX follows the constitution:

| Rule | Requirement |
| --- | --- |
| Message update | Edit existing messages for button-driven flows |
| Status patterns | Loading, success, error, warning |
| Buttons | Clear action labels, constrained rows, confirmation and cancel together |
| Lists | Count in title, pagination after five items |
| Errors | User errors explain the problem and next action; system errors include a reference code |

## 14. Event Bus

Modules communicate through the Event Bus only. Event names use
`{module}.{entity}.{action}`. Event contracts must be typed, documented, and
covered by tests when they drive business behavior.

## 15. Module System

Every active module has a manifest and a module config. Business modules own
their handlers, services, repositories, abilities, locale files, tests, and
flow maps where applicable. A module may be disabled only through supported
pluggable configuration, not by deleting imports at runtime.

## 16. Module Tooling

The Tempot CLI provides module creation and module doctor workflows. Generated
modules must follow the package and module creation checklists. Generated code
is a starting point, not an exemption from constitution rules.

## 17. AI And RAG

`@tempot/ai-core` provides provider abstraction, tool registry contracts,
content ingestion, embeddings, retrieval planning, grounded answer contracts,
and RAG runtime wiring. Current AI/RAG status is foundation-ready, not fully
activated in the Telegram bot runtime.

RAG retrieval must apply:

1. Content-type filtering.
2. Access filtering before context assembly.
3. Corpus metadata including language, corpus segment, source priority, and
   source-of-truth state.
4. Reranking that prevents generated API reference from dominating governed
   documentation when scores are close.
5. No-context and leakage tests before production activation.

Runtime activation must follow
`docs/architecture/ai-rag-runtime-activation-plan.md`.

## 18. Backup And Recovery

Backups must be encrypted when they contain protected data. Production cutover
requires target backup rehearsal, restore evidence, and rollback or forward-fix
evidence. Local rehearsal evidence does not replace target environment evidence.

## 19. Storage, Documents, And Import

`storage-engine` owns attachment storage provider contracts and lifecycle
tracking. `document-engine` owns PDF and spreadsheet export contracts.
`import-engine` owns CSV/spreadsheet parsing, schema validation, valid-row
events, invalid-row report requests, and completion or failure events.

## 20. Security And Observability

Security is default-on:

| Area | Required architecture |
| --- | --- |
| Input | Sanitize user input before business logic |
| Rate limiting | Telegram, application-level, and HTTP layers |
| Authorization | CASL checks before mutations and protected reads |
| Validation | Zod at input boundaries |
| Audit | State-changing operations recorded |
| Secrets | No tracked `.env`; no fallback production secrets |
| Supply chain | High-severity audit gate and blocking secret scan |

Observability must preserve trace IDs, error references, structured logs, and
protected-data redaction.

## 21. Code Quality

Code quality is enforced through strict TypeScript, ESLint limits, file naming
rules, no `any`, no `@ts-ignore`, no `@ts-expect-error`, no `eslint-disable`,
no production `console.*`, no zombie code, and small scoped diffs.

## 22. Methodology

Tempot uses SpecKit for specification artifacts and Superpowers for execution.
The project does not use `/speckit.implement` for production execution.

Implementation requires:

1. Valid spec artifacts where applicable.
2. Handoff gate with no critical analysis issues.
3. TDD for production behavior changes.
4. Review gate with zero critical findings.
5. Verification gate with fresh command evidence.
6. Documentation sync.

## 23. Language Policy

Developer-facing text is English. User-facing text is delivered through i18n.
Arabic product documentation under approved paths may exist while the dedicated
translation remediation track remains active, but active developer governance
documents must be English and RAG-safe.

## 24. Testing

The test pyramid is unit, integration, and end-to-end coverage. Vitest is the
test runner. Testcontainers covers integration paths that require PostgreSQL,
Redis, or other external services. Critical behavior must have regression tests.

## 25. Deployment Strategy

The production bot server is delivered as a minimal runtime image. Runtime
manifests define the source and package inventory available in the image. Docker
publishing must include vulnerability scanning, signing, and verification of the
immutable digest.

Production release is blocked until staging smoke, monitoring, rollback, backup
or restore, and review gates are complete for the selected latest signed main
digest.

## 26. Operations, Health, And Runtime Evidence

`GET /live` is the minimal liveness endpoint. Restricted readiness must validate
configured dependencies without exposing sensitive data. Operational evidence
must cite exact commands, dates, environment type, image digest when applicable,
and results.

Required production evidence:

| Evidence | Required before production |
| --- | --- |
| Staging deployment | Yes |
| Telegram webhook command smoke | Yes |
| Monitoring and alert proof | Yes |
| Backup and restore rehearsal | Yes |
| Rollback or forward-fix rehearsal | Yes |
| Final go/no-go review | Yes |

## 27. Versioning And Releases

Conventional Commits and Changesets govern versioning. Changelogs must reflect
release-impacting changes. Documentation-only changes must still preserve
code-documentation parity.

## 28. Advanced Security

Protected-data handling uses versioned encryption and redaction controls.
Secrets are never hardcoded. Webhook secrets must be explicit for webhook setup.
Security findings are prioritized by exploitability, data exposure, and release
impact.

## 29. Documentation Platform

Documentation is delivered through Astro, Starlight, and starlight-typedoc.
Generated API reference is useful but must not be treated as higher authority
than source-of-truth architecture, roadmap, operations, ADR, and product docs.

Documentation quality gates include freshness checks, frontmatter validation,
documentation-claims audit, methodology lint, and RAG ingestion dry-runs where
relevant.

## 30. Pluggable Architecture

Optional packages and modules must be guarded by environment-driven toggles.
Disabled packages must fail closed or degrade gracefully according to their
documented mode. Runtime code must not assume every optional module is active.

## 31. Privacy And Protected Data

Protected user data must be minimized, encrypted where required, redacted from
logs, and excluded from external monitoring payloads. Privacy behavior is part
of the architecture, not a presentation-layer concern.

## 32. Payments And Subscriptions

Payments and subscriptions are future capabilities. They must not be introduced
without a dedicated specification, ADRs for provider decisions, PCI-aware data
boundaries, audit coverage, and operational rollback planning.

## 33. Roadmap Alignment

`docs/ROADMAP.md` is the current status authority. Any architecture claim about
completed packages, active phases, production readiness, deferred work, or
future product tracks must match the roadmap.

## 34. Glossary

| Term | Meaning |
| --- | --- |
| Tempot Core | Current single-bot framework product track |
| Tempot Cloud | Future hosted SaaS product track |
| RAG | Retrieval augmented generation |
| Source of truth | Documentation artifact that governs implementation decisions |
| Runtime manifest | Build-time inventory used by the production bot image |
| Module | Business capability under `modules/` |
| Package | Reusable service or infrastructure unit under `packages/` |

## 35. Licensing And Dependency Governance

Dependencies must meet the constitutional dependency rule unless an ADR approves
an exception. License and vulnerability audits are part of release readiness.
High-severity audit failures block production unless an approved, time-boxed
exception exists.

## 36. Active Architecture References

| Topic | Reference |
| --- | --- |
| ADR index | `docs/architecture/adr/README.md` |
| RAG methodology | `docs/architecture/ai-rag-methodology.md` |
| RAG runtime activation | `docs/architecture/ai-rag-runtime-activation-plan.md` |
| SaaS readiness | `docs/architecture/saas-readiness.md` |
| SaaS migration map | `docs/architecture/saas-migration-map.md` |
| Telegram managed bots | `docs/architecture/telegram-managed-bots-assessment.md` |
| Template marketplace | `docs/architecture/template-marketplace.md` |
| Boundary audits | `docs/architecture/boundaries/` |
| Developer workflow | `docs/developer/workflow-guide.md` |
| Module catalog | `docs/developer/module-development-catalog.md` |
| Project knowledge graph | `docs/developer/project-knowledge-graph.md` |

## 37. Current Production Decision

Tempot is architecturally strong and actively hardened, but it is not cleared
for production until the remaining staging, monitoring, backup or restore,
rollback, and final review evidence is complete. The correct decision today is
continue stabilization and RAG/documentation hardening, not a rebuild.
