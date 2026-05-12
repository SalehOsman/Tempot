# Implementation Plan: Bot Management Module

**Branch**: `040-bot-management` | **Date**: 2026-05-12 | **Spec**: `specs/040-bot-management/spec.md`
**Input**: Feature specification from `specs/040-bot-management/spec.md`

## Summary

Implement `bot-management` as an operational platform module that records and
governs managed Telegram bot profiles. The module owns bot registry data,
lifecycle state, settings profiles, per-bot module enablement, template
provisioning attribution, health snapshots, import/export, and operational
events. It deliberately avoids runtime process orchestration and dashboard/SaaS
scope.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: `@tempot/database`, `@tempot/shared`,
`@tempot/auth-core`, `@tempot/event-bus`, `@tempot/settings`,
`@tempot/module-registry`, `@tempot/search-engine`, `@tempot/notifier`,
`@tempot/import-engine`, `@tempot/document-engine`, `@tempot/storage-engine`,
`@tempot/i18n-core`, `@tempot/ux-helpers`, `@tempot/logger`, `@tempot/sentry`
**Storage**: PostgreSQL 16 through Prisma 7.x module repositories
**Testing**: Vitest 4.1.0 with unit and integration tests; Testcontainers for
persistence flows
**Target Platform**: Node.js 22.12+ / Telegram bot interface
**Project Type**: Operational business module under `modules/`
**Performance Goals**: < 500ms for navigation and CRUD flows; < 1s search
across 1,000 managed bot records
**Constraints**: No direct Prisma in services, no cross-module imports, all
fallible public APIs return `Result<T, AppError>`, all user-facing text comes
from i18n keys, sensitive credentials are never exposed
**Scale/Scope**: Initial single-instance Tempot deployment with up to 1,000
managed bots

## Constitution Check

| Rule | Status |
| --- | --- |
| Rule XIII: Clean Architecture | Pass. Work belongs in `modules/bot-management`; no new shared package is introduced. |
| Rule XIV: Repository Pattern | Pass. Services use repositories; no service or handler uses Prisma directly. |
| Rule XV: Event-Driven Communication | Pass. Module publishes bot-management events and does not import other modules. |
| Rule XXI: Result Pattern | Pass. Public fallible APIs return `Result<T, AppError>`. |
| Rule XXXIX: i18n-Only Rule | Pass. Menus, errors, and status messages use locale keys. |
| Rule XLVI: Module Creation Gate | Pass. SpecKit artifacts are being created before module code. |
| Rule L: Code-Documentation Parity | Pass after all artifacts and gates are reconciled before merge. |
| Rule LXXXII: Handoff Gate | Pass. Required artifacts exist, SpecKit analysis found zero critical issues, and `pnpm spec:validate` passes. |

## Project Structure

### Documentation (this feature)

```text
specs/040-bot-management/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- tasks.md
|-- quickstart.md
|-- contracts/
|   `-- bot-management-contracts.md
`-- checklists/
    `-- requirements.md
```

### Source Code

```text
modules/bot-management/
|-- package.json
|-- tsconfig.json
|-- vitest.config.ts
|-- .gitignore
|-- README.md
|-- index.ts
|-- module.config.ts
|-- module.manifest.ts
|-- abilities.ts
|-- commands/
|   |-- bots.command.ts
|   `-- new-bot.command.ts
|-- handlers/
|   |-- callback.handler.ts
|   |-- text.handler.ts
|   `-- notification.handler.ts
|-- menus/
|   |-- bot-menu.factory.ts
|   |-- bot-detail.factory.ts
|   |-- lifecycle-menu.factory.ts
|   |-- settings-menu.factory.ts
|   |-- module-enablements-menu.factory.ts
|   |-- provisioning-menu.factory.ts
|   |-- health-menu.factory.ts
|   `-- export-menu.factory.ts
|-- services/
|   |-- bot.service.ts
|   |-- lifecycle.service.ts
|   |-- settings-profile.service.ts
|   |-- module-enablement.service.ts
|   |-- provisioning.service.ts
|   |-- bot-search.service.ts
|   |-- health.service.ts
|   |-- notification.service.ts
|   |-- export.service.ts
|   `-- import.service.ts
|-- repositories/
|   |-- bot.repository.ts
|   |-- settings-profile.repository.ts
|   |-- module-enablement.repository.ts
|   |-- lifecycle-event.repository.ts
|   |-- template-source.repository.ts
|   |-- health-snapshot.repository.ts
|   |-- import.repository.ts
|   `-- export.repository.ts
|-- contracts/
|   |-- bot-profile.schema.ts
|   |-- lifecycle-transitions.ts
|   |-- settings-profile.schema.ts
|   |-- module-enablement.schema.ts
|   |-- import-export.schema.ts
|   `-- search-adapter.ts
|-- events/
|   |-- event-names.ts
|   `-- event-payloads.ts
|-- types/
|   |-- bot.types.ts
|   |-- lifecycle.types.ts
|   |-- settings.types.ts
|   |-- module-enablement.types.ts
|   |-- import-export.types.ts
|   `-- navigation.types.ts
|-- locales/
|   |-- ar.json
|   `-- en.json
|-- database/
|   `-- schema.prisma
`-- tests/
    |-- unit/
    `-- integration/
```

**Structure Decision**: Use the standard module catalog structure. The selected
blueprints are `basic`, `crud`, `workflow`, `searchable`, `importable`,
`exportable`, `notifiable`, and `admin-managed`. The `cms-enabled` and
`ai-assisted` blueprints are intentionally out of scope for MVP.

## Architecture Impact

- New operational module under `modules/bot-management`.
- New module-owned persistence models for bot registry, settings profile,
  module enablement, template source attribution, lifecycle events, health
  snapshots, imports, and exports.
- No new package dependencies beyond existing `@tempot/*` packages.
- No runtime process control inside this module.
- No direct module-to-module imports. Template provisioning is represented by
  contracts, identifiers, and events; runtime lookup must be mediated by approved
  package contracts or future app orchestration.
- Documentation sync required for `docs/ROADMAP.md`, Starlight module docs, and
  module README during implementation.

## Implementation Strategy

### Layer 1: Foundation

Create module metadata, manifest, config, public exports, locale files, type
contracts, schemas, event names, and abilities. This layer proves the module is
visible to Module Doctor before business logic begins.

### Layer 2: Persistence

Create module-owned Prisma schema and repositories. Persist sensitive credential
fingerprints and setup state only; never expose raw secret values in lists,
exports, logs, notifications, or audit summaries.

### Layer 3: Business Services

Implement registry, lifecycle, settings profile, module enablement,
provisioning, search, health, notification, import, and export services. Services
must return `Result<T, AppError>` and publish events through the event bus.

### Layer 4: Telegram Presentation

Implement menus, commands, callback handlers, and text handlers. Primary flows
must use Inline Keyboard menus; commands are shortcuts.

### Layer 5: Tests

Follow TDD. Unit tests cover contracts, lifecycle guards, services, menus, and
permissions. Integration tests cover persistence, lifecycle, settings,
provisioning, search, import/export, and notification event flow.

### Layer 6: Documentation and Gates

Update README, roadmap, docs module page, changeset, and run relevant gates:
`pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`,
`pnpm spec:validate`, `pnpm cms:check`, `pnpm boundary:audit`,
`pnpm module:checklist`, `pnpm tempot module doctor bot-management`, and
`git diff --check`.

## Key Design Decisions

| Decision | Rationale |
| --- | --- |
| Operational module, not package | The work is product/domain behavior, not reusable infrastructure. |
| Lifecycle state machine | Bot state changes need clear guards, reasons, and auditability. |
| No runtime orchestration | Avoids coupling module logic to app worker/process concerns. |
| Per-bot settings profile | Allows future multi-bot readiness without hardcoded configuration. |
| Module enablement entity | Makes module availability explicit per bot and supports blocked states. |
| Template source attribution | Connects template-management to bot operations without importing module code. |
| Redacted import/export | Supports portability while protecting credentials. |
| Event-first integration | Preserves module boundary rules and supports notification/audit workflows. |

## Risk Assessment

| Risk | Mitigation |
| --- | --- |
| Credential exposure | Store/display only redacted values and fingerprints; add tests for every output path. |
| Runtime coupling | Keep runtime control out of module; emit events and record state only. |
| Cross-module import temptation | Use IDs, events, and package contracts; boundary audit blocks direct imports. |
| Module enablement drift | Store unavailable/blocked states with reasons; validate via module registry. |
| Health notification noise | Add incident-window throttling and tests for flapping status. |
| Importing unsafe profiles | Import into `DRAFT` only and report blocked requirements. |

## Complexity Tracking

No constitution violations are planned. Any later need for new external
dependencies, runtime orchestration, encryption contract changes, or dashboard
surface must be documented with a new ADR or separate spec before implementation.
