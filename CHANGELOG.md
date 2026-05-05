# Changelog

All notable changes to Tempot will be documented in this file.

This changelog is automatically generated from [Conventional Commits](https://www.conventionalcommits.org/) using [Changesets](https://github.com/changesets/changesets).

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Phase 1 — Service Packages (2026-03-21 – 2026-04-02)

### Added

- **@tempot/shared** — Core utilities shared across all packages: cache wrapper, queue factory, AppError hierarchy, and Result pattern
- **@tempot/logger** — Pino-based structured logging with PII redaction, session-aware context, and audit logging
- **@tempot/database** — Prisma client wrapper, BaseRepository with Result pattern, soft delete extension, health check
- **@tempot/event-bus** — Three-level event system (Local/Internal/External) with typed publish contracts (TempotEvents registry)
- **@tempot/auth-core** — CASL-based RBAC (4 roles: Guest/User/Admin/SuperAdmin), ability factory, permission guards
- **@tempot/session-manager** — grammY session adapter with Redis primary + PostgreSQL fallback, sliding TTL
- **@tempot/i18n-core** — i18next integration, language detection, namespace management, Arabic primary + English
- **@tempot/regional-engine** — Locale management, RTL support, date/number formatting (dayjs), geographic data
- **@tempot/storage-engine** — Multi-provider storage (Google Drive, S3, Telegram, Local) with unified interface
- **@tempot/ux-helpers** — Telegram message builder, keyboard utilities, pagination, status patterns
- **@tempot/sentry** — Optional Sentry error monitoring with toggle guard and reference code tagging

### Infrastructure

- eslint-plugin-boundaries for package import boundary enforcement
- Development methodology established: SpecKit + Superpowers toolchains
- 36 Architecture Decision Records (ADR-001 through ADR-036)
- Constitution v2.2.0 ratified (87 rules)
- CI pipeline: lint, typecheck, unit tests, integration tests, security audit

---

## [Unreleased]

### Added

- **@tempot/ai-core** (Spec #032) - Test-only RAG evaluation fixtures and
  scoring helpers for retrieval hit, citation coverage, unauthorized-source
  leakage, and no-context correctness. The slice adds no CLI, evaluator service,
  provider call, schema change, or runtime public API.

- **@tempot/ai-core** (Spec #031) - Runtime wiring for retrieval plans:
  - `RAGPipeline.retrieveWithPlan` validates `RetrievalRequest`, builds the
    default vector/access-filter/context-assembly plan, executes retrieval, and
    returns a stage-timed `RetrievalOutcome`.
  - `buildAnswerState` converts retrieval outcomes into `answered`,
    `no-context`, or `degraded` `RAGAnswerState` values with citation and
    i18n message-key guarantees.
  - Optional `rag_search` audit logging is supported through `RAGPipelineDeps`;
    audit failure does not propagate to callers.
  - The legacy `retrieve(RetrieveOptions)` API remains backward compatible.

- **@tempot/ai-core** (Spec #030) — Public retrieval planning and grounded answer
  state contracts with validation helpers:
  - `RetrievalRequest`, `RetrievalPlan`, `RetrievalStep`, `RetrievalOutcome`
    types with Zod validation.
  - `RAGAnswerState` supporting `answered`, `no-context`, `degraded`, and
    `refused` states.
  - `answered` state enforces at least one citation; non-answered states require
    an i18n message key.
  - All fallible validation helpers return `Result<T, AppError>`.
  - Unit tests cover valid plans, missing access filter rejection, valid answer
    states, and invalid grounded answer rejection.

- **@tempot/notifier** (Spec #013) — Centralized notification package activated
  from Rule XC deferred status on 2026-04-29 and completed 2026-04-30:
  - `NotifierService` with `sendToUser`, `sendToUsers`, `sendToRole`,
    `broadcast`, and `schedule` methods.
  - Queue producer backed by `@tempot/shared` QueueFactory.
  - Telegram delivery adapter with injected port boundaries.
  - Rate policy enforcing Telegram's 30 messages per second limit.
  - Worker factory with configurable BullMQ limiter.
  - Delivery processor with audit recording and event publishing
    (`notification.delivery.succeeded`, `notification.delivery.failed`,
    `notification.user.blocked`, `notification.broadcast.queued`).
  - All public fallible APIs return `Result<T, AppError>`.
  - Full unit test coverage for service validation, queueing, rate offsets,
    processor success and failure paths, and Telegram adapter mapping.
  - Package is optional; safely disabled through `TEMPOT_NOTIFIER=false`.

- Minimal `bot-server` for connection testing (grammY only, no DB required)
- `docker-compose.yml` with PostgreSQL (pgvector) + Redis and health checks
- `.env.example` with all v11 Spec variables across 7 sections
- `.gitattributes` for consistent LF line endings across platforms
- `CONTRIBUTING.md` — mandatory 11-step contribution workflow
- `SECURITY.md` — vulnerability reporting and security architecture
- `CHANGELOG.md` — this file
- `docs/architecture/` — ADR directory structure (ADR-001 through ADR-025)
- `docs/architecture/ARCHITECTURE-DIAGRAMS.md` — 11 Mermaid diagrams
- `docs/architecture/DASHBOARD-MINIAPP-DESIGN.md` — Dashboard and Mini App architecture
- `docs/architecture/AI-REINDEXING-STRATEGY.md` — Zero-downtime embedding reindexing
- `docs/guides/DUAL-ORM-GUIDE.md` — Prisma + Drizzle usage patterns
- `docs/guides/RTL-GUIDELINES.md` — Arabic RTL implementation guide
- `docs/guides/TESTING-STRATEGY-EXTENDED.md` — Extended testing patterns
- `docs/operations/DISASTER-RECOVERY.md` — RTO/RPO and 6 failure scenarios
- `docs/operations/PERFORMANCE-SCALING.md` — Scaling strategies
- `docs/operations/RISK-REGISTRY.md` — 24 risks with mitigation plans
- `docs/security/SECURITY-OPERATIONS.md` — Operational security procedures
- `docs/deployment/CLOUD-DEPLOYMENT-GUIDES/` — Railway, Render, Fly.io, DigitalOcean, AWS, VPS
- `docs/legal/LICENSE-AUDIT.md` — Library license compliance
- `docs/legal/LOCAL-REGULATIONS.md` — GDPR, Egypt, Saudi Arabia, UAE regulations
- `docs/QUICK-START.md` — 10-minute getting started guide
- README placeholder files for all 17 packages

### Fixed

- **Documentation**: Fixed documentation drift between README.md, CLAUDE.md, and ROADMAP.md
  - Updated Vercel AI SDK version from 4.x to 6.x in README.md
  - Updated neverthrow version to 8.2.0 in README.md
  - Updated Vitest version to 4.1.0 in README.md
  - Updated package statuses to match ROADMAP.md
    - ux-helpers: Building → Stable
    - ai-core: Planned → Stable
    - module-registry: Planned → Stable
    - bot-server: Planned → Stable
    - docs: Planned → Stable
    - input-engine: Planned → Stable
  - Removed non-existent apps from README.md
    - dashboard: Removed (not implemented)
    - mini-app: Removed (not implemented)
  - Added README.md to apps/docs/
  - Completed test-module spec artifacts (plan.md, tasks.md, data-model.md, research.md)
  - Removed @ts-expect-error from session.provider.test.ts

Fixes: Rule L (Code-Documentation Parity) violations
Fixes: Rule LX (Package README Requirement) violation
Fixes: Rules LXXIX–LXXXII (Spec-Driven Development) violations
Fixes: Rule I / LXX (TypeScript Strict Mode) violations

### Changed

- Upgraded ESLint 8 → 10 with Flat Config (`eslint.config.js`)
- Upgraded Husky 8 → 9
- Upgraded Vitest 1 → 4.1.0
- Upgraded Vite to 8.0.1 (peer dependency for Vitest 4)
- Added `type: module` to root `package.json`
- Added `pnpm.onlyBuiltDependencies` for `esbuild`
- All `specs/*/plan.md` files now point to `docs/superpowers/plans/` as single source of truth

### Infrastructure

- Phase 0 workspace setup complete
- `main` branch established with clean commit history
- GitHub repository initialized at `https://github.com/SalehOsman/Tempot`

---

> **Note:** Tempot is currently in `v0.x.x` pre-release phase. The "v11" in `tempot_v11_final.md` refers to the 11th iteration of the Architecture Specification Document, not the software version.

---

## How to Add a Changelog Entry

Do not edit this file manually. Use Changesets:

```bash
# Create a new changeset
pnpm changeset

# Select the type of change (patch/minor/major)
# Write a summary of the change
# Commit the generated changeset file

# On release:
pnpm release
```

See [Changesets documentation](https://github.com/changesets/changesets) for more details.
