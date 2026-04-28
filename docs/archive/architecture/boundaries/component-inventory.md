# Tempot Boundary Component Inventory

**Status**: Draft execution artifact for spec #026
**Last reviewed**: 2026-04-28
**Scope**: Active apps, packages, modules, deferred packages, infrastructure, documentation, and agent tooling.

## Boundary Model

Tempot uses three executable layers plus governance surfaces:

| Layer | Path | Responsibility | Allowed dependencies |
| --- | --- | --- | --- |
| Interface | `apps/` | Runtime entrypoints, HTTP/Bot adapters, docs app, future dashboards | Packages through public exports; modules through module-registry contracts |
| Service | `packages/` | Reusable infrastructure and domain-agnostic services | Lower-level packages through public exports; no module imports |
| Core module | `modules/` | Business capabilities and domain rules | Packages through public exports; no direct module-to-module imports |
| Specification | `specs/` | SpecKit source of truth for features | Docs and repository paths as references only |
| Governance docs | `docs/archive/` | ADRs, roadmap, developer workflow, architecture decisions | None at runtime |
| Agent tooling | `.agents/skills/` | Project-specific agent operating instructions | None at runtime |

## Applications

| Component | Responsibility | Classification | Boundary notes |
| --- | --- | --- | --- |
| `apps/bot-server` | Telegram bot runtime, Hono server, startup orchestration, module loading | Active interface app | May compose packages and load module configs; must not own business rules that belong in modules |
| `apps/docs` | Starlight documentation platform and documentation ingestion tooling | Active interface app | May use `@tempot/ai-core` for docs ingestion scripts; no runtime business dependency |

## Active Packages

| Component | Responsibility | Classification | Public API expectation |
| --- | --- | --- | --- |
| `packages/shared` | Common Result types, AppError, shutdown, cache wrapper, queue factory, toggle guard | Foundational service package | Public exports only; avoid becoming a domain dump |
| `packages/database` | Prisma/Drizzle access, BaseRepository, transactions, soft delete, vector repository | Foundational service package | Repositories and database contracts only; services should not bypass repositories |
| `packages/logger` | Pino logging, audit logger, error serialization | Foundational service package | Logging APIs only; no user-facing messages |
| `packages/event-bus` | Local and Redis event bus orchestration | Foundational service package | Event contracts and bus APIs only |
| `packages/auth-core` | CASL roles, ability factory, guards | Foundational service package | Authorization contracts and guards only |
| `packages/session-manager` | Session provider, repository, context bridge, Redis cache | Foundational service package | Session APIs; no bot command logic |
| `packages/i18n-core` | i18next setup, translation loading, CMS checks | Foundational service package | Translation APIs; user text must remain in locale files |
| `packages/regional-engine` | Regional formatting, time zones, geo selection | Active service package | Region APIs; no module-specific workflows |
| `packages/storage-engine` | Storage providers, attachments, purge jobs | Active service package | Storage abstractions; no module-specific ownership rules |
| `packages/input-engine` | Dynamic form execution and field processing | Active service package | Input contracts and runner APIs |
| `packages/ux-helpers` | Telegram UX primitives, keyboards, callbacks, messages | Active service package | UI helper APIs using i18n keys |
| `packages/ai-core` | AI provider abstraction, tools, RAG, confirmations | Active service package | Provider-agnostic APIs using Vercel AI SDK |
| `packages/settings` | Static and dynamic settings, maintenance mode | Active service package | Settings APIs with scope-ready model |
| `packages/module-registry` | Module discovery, validation, registration contracts | Active service package | Module contracts and discovery only |
| `packages/sentry` | Sentry initialization and error reporting | Infrastructure package | Error monitoring only |
| `packages/national-id-parser` | Egyptian national ID parsing and validation keys | Domain utility package | Pure parsing/validation; no bot or module runtime |

## Deferred Packages

Deferred packages are visible in the repository but not active implementation targets until a business module requires them.

| Component | Planned responsibility | Current status | Boundary expectation |
| --- | --- | --- | --- |
| `packages/cms-engine` | Dynamic translation CMS backend | Deferred | Must depend on i18n-core/cache/database contracts when activated |
| `packages/notifier` | Notification scheduling and delivery | Deferred | Must use queue factory and event bus when activated |
| `packages/search-engine` | Search/filter UX and semantic search | Deferred | Must use package APIs; no module coupling |
| `packages/document-engine` | PDF/Excel/document generation | Deferred | Must use queue factory and storage abstractions |
| `packages/import-engine` | CSV/Excel import workflows | Deferred | Must publish events and avoid direct module calls |

## Modules

| Component | Responsibility | Classification | Boundary notes |
| --- | --- | --- | --- |
| `modules/user-management` | User profile, role, registration, and profile editing flows | Active business module | May depend on service packages; must not be imported by other modules |
| `modules/test-module` | Module-registry validation fixture | Test/support module | Should remain isolated from production flows |

## Governance Surfaces

| Surface | Responsibility | Boundary rule |
| --- | --- | --- |
| `specs/` | Feature truth and acceptance criteria | Must be updated before implementation work changes scope |
| `docs/archive/ROADMAP.md` | Project status source of truth | Must be updated after merge-impacting work |
| `docs/archive/architecture/adr/` | Accepted architectural decisions | Required before architectural implementation |
| `.github/workflows/ci.yml` | Merge quality gates | Must enforce spec, i18n, tests, audit, and whitespace checks |
| `.agents/skills/` | Agent operating knowledge | Must stay operational, not replace human docs |

## Inventory Findings

- Active implementation currently covers two apps, sixteen active packages including `national-id-parser`, one infrastructure package, one active business module, one test module, and five deferred packages.
- `packages/national-id-parser` is active in code but is not yet prominently represented in older architecture narratives; keep it in future inventories.
- Worktree dependency installation creates nested `node_modules` copies; audit tooling must scan tracked files only.
- The next enforcement step should convert this inventory into machine-readable component metadata before hard-blocking CI.
