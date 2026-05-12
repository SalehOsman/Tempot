# Implementation Plan: Input Engine Inline Flow Standardization

**Branch**: `041-input-engine-inline-flow-standardization` | **Date**: 2026-05-12 | **Spec**: `specs/041-input-engine-inline-flow-standardization/spec.md`  
**Input**: Feature specification from `specs/041-input-engine-inline-flow-standardization/spec.md`

## Summary

Complete the production adoption path for structured Telegram flows by wiring
the active bot runtime for conversation-backed `@tempot/input-engine` usage,
migrating `bot-management` registration onto that shared flow, removing the
manual duplicate state path, and reconciling the package README with the real
implementation surface.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode  
**Primary Dependencies**: `@tempot/input-engine`, `@grammyjs/conversations`,
`grammy`, `@tempot/i18n-core`, `@tempot/shared`, `@tempot/ux-helpers`,
`@tempot/logger`, `@tempot/event-bus`  
**Storage**: No new persistence layer; existing bot-management repositories are reused  
**Testing**: Vitest 4.1.0 with focused unit and integration coverage  
**Target Platform**: Node.js 22.12+ / Telegram bot runtime  
**Project Type**: Cross-cutting app + module + package documentation feature  
**Performance Goals**: No observable startup regression from conversation wiring;
registration form transitions remain interactive and deterministic in tests  
**Constraints**: Maintain middleware ordering, strict Result/error patterns,
no user-facing hardcoded text, no duplicate manual registration state path after
migration  
**Scale/Scope**: One shared runtime integration plus one production module
adoption that becomes the reference pattern for later modules

## Constitution Check

| Rule | Status |
| --- | --- |
| Rule XIII: Clean Architecture | Pass. Runtime wiring remains in `apps/`, domain flow definition remains in `modules/`, reusable engine remains in `packages/`. |
| Rule XII: Preserve Existing Patterns | Pass. The work extends current bot-server factory/bootstrap patterns and existing bot-management handler/service contracts. |
| Rule XXI: Result Pattern | Pass. Domain persistence remains routed through existing service methods that already return `Result<T, AppError>`. |
| Rule XXXIV: TDD Mandatory | Pass. Bot-server runtime tests and bot-management flow tests are specified before code edits. |
| Rule XXXIX: i18n-Only Rule | Pass. New user-facing flow messages must come from existing or added locale keys. |
| Rule L: Code-Documentation Parity | Pass after README, roadmap, SpecKit artifacts, and verification outputs are reconciled. |
| Rule LXXXII: Handoff Gate | Pending until artifacts pass analysis and `pnpm spec:validate`. |

## Capability Reuse Decision Table

| Capability Need | Default Package | Decision | Rationale | Follow-up |
| --- | --- | --- | --- | --- |
| Multi-step bot registration | `@tempot/input-engine` | `Reuse` | Existing package already owns structured Telegram forms, validation, progress, confirmation, cancel, and resume behavior. | Remove manual duplicate registration state after migration. |
| Runtime conversation hosting | `@grammyjs/conversations` plus `@tempot/input-engine` contract | `Compose` | Bot-server must host grammY conversation middleware while modules consume the reusable form API. | Document the runtime contract in package README. |
| Command and inline entry convergence | Module command layer plus `@tempot/ux-helpers` patterns | `Compose` | Commands remain shortcuts; inline menus remain the primary navigation surface. Both should start one shared form. | Reuse the same start helper from both paths. |
| Bot persistence after form completion | Existing bot-management services and repositories | `Reuse` | Domain write path is already present and must stay authoritative. | Keep uniqueness and duplicate detection in service/repository logic. |
| Developer guidance | Existing project docs and input-engine README | `Compose` | The package README and feature artifacts must describe actual usage together. | Update roadmap only if the work changes current project status. |

## Project Structure

### Documentation

```text
specs/041-input-engine-inline-flow-standardization/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- tasks.md
`-- checklists/
    `-- requirements.md

docs/superpowers/specs/
`-- 2026-05-12-input-engine-inline-flow-standardization-design.md
```

### Source Code

```text
apps/bot-server/
|-- src/bot/bot.factory.ts
|-- src/startup/deps.bot-factory.ts
|-- src/startup/deps.builders.ts
`-- tests/
    |-- unit/
    `-- integration/

modules/bot-management/
|-- package.json
|-- module.config.ts
|-- commands/new-bot.command.ts
|-- handlers/callback.handler.ts
|-- handlers/text.handler.ts
|-- handlers/bot-state.service.ts        # removal candidate
|-- flows/                               # only if the local module structure needs a form definition folder
|-- locales/ar.json
|-- locales/en.json
`-- tests/unit/

packages/input-engine/
`-- README.md
```

**Structure Decision**: Implement the smallest cross-boundary change that fixes
the root issue. No new shared package is introduced. A small local form-definition
file under `bot-management` is allowed if it keeps handlers concise and under the
file/function limits.

## Implementation Strategy

### Layer 1: Runtime Host

Write failing bot-server tests that prove conversation middleware is composed in
the active bot factory/startup path. Implement the minimal wiring needed to host
input-engine conversations without changing unrelated runtime responsibilities.

### Layer 2: Module Adoption

Write failing bot-management tests for command and inline entry equivalence,
successful completion, validation failure, duplicate rejection, and cancellation.
Implement the registration form through `@tempot/input-engine`, reusing existing
bot-management services for persistence.

### Layer 3: Remove Duplicate Local State

Retire the manual production state path once the new flow is covered. Delete dead
files or code rather than leaving dormant alternatives.

### Layer 4: Documentation Sync

Reconcile the input-engine README with implemented behavior and update roadmap or
module docs only where project status or adoption guidance changes materially.

### Layer 5: Verification

Run targeted tests first, then reconciliation and merge-readiness checks aligned
to the touched surfaces.

## Risk Assessment

| Risk | Mitigation |
| --- | --- |
| Middleware order regression | Add bot-server unit/integration coverage around factory/startup composition. |
| Duplicate service paths | Require both entry points to converge on one shared registration launcher. |
| Hidden manual-state leftovers | Search and tests must prove the old production path is removed. |
| Documentation still drifts | Update package README in the same feature and reconcile with specs. |
| Feature scope broadens into all modules | Keep this feature to runtime foundation plus first production adoption only. |
