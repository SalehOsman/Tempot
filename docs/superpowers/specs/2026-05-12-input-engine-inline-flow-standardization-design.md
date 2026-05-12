# Input Engine Inline Flow Standardization - Design

**Date:** 2026-05-12  
**Status:** Approved design captured from the Project Manager decision trail  
**Scope:** Shared runtime enablement, first production adoption in `bot-management`,
and documentation reconciliation.

## Problem

Tempot already owns a capable `@tempot/input-engine` package, but the active bot
runtime does not yet present a clearly integrated, production-facing host for
conversation-driven forms. As a result, `bot-management` started with a manual
text-state registration flow even though project standards now require commands
as entry points, inline menus as the primary navigation surface, and
`@tempot/input-engine` as the default for structured flows.

This creates three concrete risks:

1. Reusable package capability is not consumed by the first operational module.
2. Future modules may copy the same local flow pattern.
3. Package documentation can drift from real code and mislead developers.

## Chosen Approach

Deliver one governed feature that:

1. Adds the missing shared runtime integration in `apps/bot-server` required to
   host conversation-backed form flows safely.
2. Migrates the `bot-management` bot registration flow from a local state map to
   an `@tempot/input-engine` form while keeping `/new_bot` and inline buttons as
   equivalent entry points.
3. Corrects `@tempot/input-engine` documentation so implemented capabilities,
   runtime prerequisites, and adoption guidance match the codebase.

This is the narrowest solution that fixes the root issue without mixing in every
future module migration. Subsequent module adoption can follow the same standard
once the shared runtime path is proven.

## Runtime Design

- `apps/bot-server` owns grammY middleware and conversation runtime wiring.
- `@tempot/input-engine` remains a reusable package that defines form schemas,
  field handlers, validation, progress, confirmation, cancel, and resume logic.
- Modules declare and invoke forms, but do not own generic conversation hosting.
- Runtime boot must remain compatible with existing security middleware order and
  module loading conventions.

## Bot Management Design

- `/new_bot` remains a command shortcut.
- The bot-management inline menu gains or preserves a "create bot" entry point.
- Both entry points converge on the same input-engine registration form.
- The form collects the existing registration payload, validates it through the
  established schema/service path, and then returns to the authoritative bot
  detail/menu flow.
- Manual map-based text state is removed once it no longer owns any approved
  domain behavior.

## Documentation Design

- The input-engine README must describe the actually implemented feature set and
  the runtime contract expected from bot-server.
- Specs and tasks must capture the capability-reuse decision table.
- The roadmap should identify this standardization effort as the runtime
  completion step that turns `input-engine` into a consumed platform path, not a
  dormant package.

## Testing Strategy

- RED first for bot-server conversation runtime registration.
- RED first for bot-management registration flow entry, validation, completion,
  and cancellation through the new form path.
- Regression coverage for the removal of the manual text-state route.
- Documentation reconciliation through `pnpm spec:validate` and relevant focused
  checks before merge readiness is claimed.

## Non-Goals

- Migrating every module flow in the repository in the same feature.
- Redesigning `@tempot/input-engine` field coverage.
- Adding new dashboard or SaaS user interfaces.
- Introducing cross-module imports that violate event-driven boundaries.
