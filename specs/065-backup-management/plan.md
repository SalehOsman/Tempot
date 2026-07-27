# Implementation Plan: Backup Management

**Branch**: `codex/backup-management-spec` | **Date**: 2026-07-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/065-backup-management/spec.md`

## Summary

Create a reusable `@tempot/backup-engine` package and a Telegram-facing
`backup-management` module. The package owns backup execution, isolated restore
rehearsal, manifest generation, integrity verification, retention, and failure
classification. The module owns super-admin UX, confirmation flows, safe
evidence summaries, and event-backed notifications.

This work closes an existing documentation-to-code gap: the project already
requires encrypted backups, restore rehearsal, backup verification, backup
failure alerts, and production evidence, but no backup package or module exists.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode on Node.js 22.12+  
**Primary Dependencies**: Prisma 7.x, PostgreSQL 16, pgvector, BullMQ through
shared queue factory, `neverthrow` 8.2.0, Pino 9.x, grammY 1.41.x, Hono 4.x  
**Storage**: PostgreSQL metadata plus backup artifact storage through
`@tempot/storage-engine`; protected data remains encrypted under existing
protected-data policy  
**Testing**: Vitest 4.1.0 unit tests, integration tests with PostgreSQL and
storage adapters, Telegram callback tests through existing mock context helpers  
**Target Platform**: Tempot Core bot runtime and Docker production image  
**Project Type**: TypeScript monorepo with package plus business module  
**Performance Goals**: Backup orchestration must be asynchronous for large data
sets, avoid blocking Telegram handlers, and preserve bot responsiveness during
long-running jobs  
**Constraints**: No plaintext sensitive backup artifacts, no direct module
imports, no direct Prisma in handlers/services, no direct provider calls from
modules, no production restore overwrite in first release  
**Scale/Scope**: Single-bot Tempot Core now, records and contracts remain
scope-ready for future multi-bot operation without implementing SaaS behavior

## Constitution Check

| Rule Area | Gate | Status |
| --- | --- | --- |
| Spec-driven work | Spec #065 exists before code. | Pass |
| Package creation | `@tempot/backup-engine` must pass the 10-point package checklist before first package code. | Required before implementation |
| Module creation | `modules/backup-management` must be created only after this spec and plan are approved. | Required before implementation |
| Event-driven modules | Module must publish/consume events, not import other modules. | Pass by design |
| Repository pattern | Metadata persistence must use repositories. | Pass by design |
| Result pattern | Package public APIs must return `Result<T, AppError>`. | Pass by design |
| Queue policy | Long-running jobs must use the shared queue factory, not direct BullMQ setup. | Pass by design |
| i18n | Operator text must live in locale files. | Pass by design |
| UX | Telegram menus must use compact rows, clear empty states, confirmation expiry, and status-message patterns. | Pass by design |
| Security | Backup artifacts must be encrypted before upload and never expose secrets. | Pass by design |
| ADR timing | Architecture decision for backup package/module split is documented before code. | Pass via ADR-046 |

## Project Structure

### Documentation

```text
specs/065-backup-management/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── detailed-specs.md
├── quickstart.md
├── contracts/
│   └── backup-engine.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
packages/backup-engine/
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts
│   ├── backup-engine.errors.ts
│   ├── backup-engine.types.ts
│   ├── backup-engine.service.ts
│   ├── backup-manifest.service.ts
│   ├── backup-integrity.service.ts
│   ├── restore-rehearsal.service.ts
│   ├── retention.service.ts
│   └── ports/
└── tests/
    ├── unit/
    └── integration/

modules/backup-management/
├── README.md
├── package.json
├── module.config.ts
├── index.ts
├── abilities.ts
├── locales/
│   ├── ar.json
│   └── en.json
├── features/
├── handlers/
├── menus/
├── services/
├── repositories/
├── module.flow.json
└── tests/
```

**Structure Decision**: Use a package/module split. The package owns reusable
backup infrastructure; the module owns operator workflows. This follows
`docs/developer/module-capability-reuse-standard.md` and the existing
`packages/module-registry` `backup-engine` capability flag.

## Capability Decision Table

| Capability Need | Default Package | Decision | Rationale | Follow-up |
| --- | --- | --- | --- | --- |
| Backup execution workflow | `@tempot/backup-engine` | Extend Package | The capability is reusable infrastructure and already appears in the module registry. | Create package before module code. |
| Backup artifact storage | `@tempot/storage-engine` | Compose | Storage provider contracts already own artifact persistence boundaries. | Add backup artifact adapter only if the package lacks needed metadata. |
| Backup metadata persistence | `@tempot/database` | Compose | Database package owns repositories and protected-data boundaries. | Add repository contracts and migrations through approved patterns. |
| Operator notifications | `@tempot/notifier` | Reuse | Notifications are package-owned and should not use direct Telegram sends. | Add event-backed notifier adapter if required. |
| Lifecycle communication | `@tempot/event-bus` | Reuse | Modules communicate only through events. | Define `backup.*` and `restore.*` events. |
| Schedule configuration | `@tempot/settings` | Reuse | `backup_schedule` already exists as a dynamic setting. | Wire scheduler to existing setting. |
| Operator menus and confirmations | `@tempot/ux-helpers` | Compose | Backup management owns labels and callback map; helper package owns UX primitives. | Add governed `module.flow.json`. |
| Structured settings or restore target input | `@tempot/input-engine` | Compose | Multi-step operator input should use existing flow infrastructure. | Use only for multi-field flows. |
| Evidence report export | `@tempot/document-engine` | Compose | Evidence summaries may later be exported without local PDF/XLSX generation. | Optional after first Telegram release. |
| Audit-oriented logs | `@tempot/logger` and existing audit surfaces | Reuse | Logs must be structured and safe. | Ensure no secrets or keys are logged. |

## Phase Plan

### Phase 0: Research

Resolve backup artifact encryption boundary, storage destination model, isolated
restore target safety, queue execution shape, notification delivery contract,
and how existing disaster-recovery commands map to implemented commands.

### Phase 1: Design

Define entities, package contracts, module flow map, i18n surfaces, evidence
summary shape, repository boundaries, and retention behavior.

### Phase 2: Tasks

Produce TDD-ordered tasks for package creation, package tests, module UX tests,
integration tests, docs sync, and operational evidence.

### Phase 3: Superpowers Execution

After SpecKit analyze and `pnpm spec:validate` pass, execute with Superpowers:
brainstorming, writing-plans, TDD implementation, review, verification, and
finishing branch.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| None | N/A | N/A |
