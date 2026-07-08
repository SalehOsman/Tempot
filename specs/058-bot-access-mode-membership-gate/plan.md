# Implementation Plan: Bot Access Mode and Membership Gate

**Branch**: `codex/058-bot-access-mode-membership-gate` | **Date**: 2026-06-21 | **Spec**: `specs/058-bot-access-mode-membership-gate/spec.md`
**Input**: Feature specification from `/specs/058-bot-access-mode-membership-gate/spec.md`

## Summary

Introduce a fail-closed Telegram access gate that runs before command and callback dispatch, backed by explicit bot access mode settings and actor-state resolution. Add a dedicated `membership-management` module for join requests and administrator review. Keep user profile creation inside the user-management boundary and connect the modules through event-bus contracts.

The implementation must close the current gap where an unrecognized visitor can see internal capabilities. The default behavior is private. Public mode is supported only for capabilities explicitly classified as public.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: Node.js 22.12+, grammY 1.41.x, Hono 4.x, Prisma 7.x, CASL 6.x, neverthrow 8.2.0, Vitest 4.1.0, i18next 25.x, Pino 9.x
**Storage**: PostgreSQL 16 through Prisma repositories; existing protected-data rules apply to sensitive fields
**Testing**: Vitest unit tests, module integration tests, bot-server routing tests, repository integration tests
**Target Platform**: Telegram bot runtime in Docker/local and production runtime
**Project Type**: Monorepo with `apps/`, `modules/`, and `packages/`
**Performance Goals**: Access-gate p95 overhead below 50 ms for local command routing tests
**Constraints**: No direct Prisma access in services/handlers; no module-to-module direct mutation; no hardcoded user-facing text; no `any` or TypeScript suppressions
**Scale/Scope**: Applies to all Telegram command, callback, and menu surfaces

## Constitution Check

*GATE: Must pass before implementation starts. Re-check after Phase 1 design.*

- TypeScript strict mode remains mandatory.
- The new gate must return `Result<T, AppError>` from public APIs that can fail.
- Handlers and services use repositories, not Prisma directly.
- `membership-management` communicates profile activation through event-bus or approved boundary contract; it must not import user-management internals.
- User-facing text uses i18n keys with English and Arabic locale entries.
- Menus and callbacks are authorized at rendering and execution time.
- TDD is required for gate behavior, membership state transitions, and role-filtered menu rendering.
- Documentation and tests remain in English.

## Project Structure

### Documentation for This Feature

```text
specs/058-bot-access-mode-membership-gate/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- access-control-contract.md
|   `-- membership-workflow-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Expected Source Changes

```text
apps/bot-server/src/
|-- authorization/
|   `-- ability-registry.ts
|-- bot/
|   |-- middleware/
|   |   |-- auth.middleware.ts
|   |   `-- access-gate.middleware.ts
|   `-- routing or dispatcher integration points
`-- startup/
    |-- deps.settings-provider.ts
    `-- module-navigation.provider.ts

modules/membership-management/
|-- commands/
|-- handlers/
|-- menus/
|-- repositories/
|-- services/
|-- events/
|-- database/
|-- locales/
|-- tests/
|-- module.config.ts
|-- module.manifest.ts
`-- index.ts

modules/user-management/
|-- events or handlers for membership approval outcome
|-- services/user.service.ts
|-- repositories/user.repository.ts
`-- tests/

packages/settings/
|-- src/static-settings.loader.ts
|-- src/settings.types.ts
`-- tests/

packages/module-registry/ or existing navigation contracts
`-- capability classification support where needed
```

## Architecture Decisions

1. The access gate belongs in `apps/bot-server` because it is cross-cutting runtime behavior around every Telegram interaction.
2. Membership workflow belongs in a new `membership-management` module because it is domain functionality with commands, menus, persistence, locales, and admin actions.
3. User profile creation remains owned by `user-management`; membership approval emits or invokes an approved event-bus contract instead of directly mutating user-management internals.
4. Menu visibility must be derived from the same authorization contract used by command and callback execution.
5. Missing access-mode configuration defaults to private. Invalid access-mode configuration must not produce public behavior.
6. Public mode requires explicit public classification. Unclassified capabilities are treated as protected.

## Phase 0: Research and Boundary Validation

Deliverable: `research.md`

- Confirm current bot middleware ordering and where the gate can run before command/callback handlers.
- Confirm current navigation provider and menu factories can receive actor/ability context.
- Confirm existing settings-management can store access mode or whether a package-level setting is required.
- Confirm event-bus contract shape for cross-module approval.
- Confirm current user-management profile creation and super-admin bootstrap behavior.

## Phase 1: Design and Contracts

Deliverables: `data-model.md`, `contracts/access-control-contract.md`, `contracts/membership-workflow-contract.md`, `quickstart.md`

- Define `AccessActor`, `AccessDecision`, and capability classification.
- Define `BotAccessSettings` behavior and validation.
- Define `MembershipRequest` persistence and state transitions.
- Define event names and payloads for request submission, approval, rejection, and profile activation.
- Define menu filtering behavior for unknown, pending, user, admin, and super-admin actors.

## Phase 2: Implementation Strategy

### 2.1 Access Mode Settings

- Add typed `BotAccessMode` and validation in settings infrastructure.
- Default missing mode to `private`.
- Treat invalid values as startup configuration errors or explicit private fallback with startup error according to final implementation choice.
- Add tests for missing, valid, and invalid values.

### 2.2 Actor Resolution and Access Gate

- Resolve Telegram identity, active user profile, role, and membership request state.
- Return a typed `AccessActor`.
- Evaluate command/callback/menu capability classification against actor state and access mode.
- Deny by default when identity, profile lookup, settings, or classification fails.
- Ensure gate runs before protected handlers.

### 2.3 Membership Management Module

- Scaffold `modules/membership-management` using existing module conventions.
- Add repository and migration for membership requests.
- Add visitor command/callback handlers for request submission and status.
- Add admin command/callback handlers for list, details, approve, reject.
- Add menus and locales.
- Add audit events for every state transition.

### 2.4 User Management Integration

- Add an event handler or approved boundary in user-management to create or activate `UserProfile` from approved membership requests.
- Preserve existing super-admin bootstrap and protected-data behavior.
- Add idempotency for approval retries.

### 2.5 Menu and Navigation Enforcement

- Extend existing navigation capability metadata to include visibility classification.
- Filter menu items by actor state and ability.
- Revalidate command and callback execution with the same decision contract.
- Add snapshot-style tests for actor states.

### 2.6 Settings Administration

- Add bot access mode view/update under settings or bot-management as an admin-only capability.
- Restrict mode update to `SUPER_ADMIN` by default.
- Audit mode changes.

## Phase 3: Verification Strategy

- Unit tests: access decisions, settings validation, actor resolution, menu filtering, membership state machine.
- Handler tests: unknown `/start`, pending `/start`, stale callback denial, admin approval/rejection.
- Repository tests: membership request uniqueness, state transitions, concurrent review.
- Integration tests: approval creates active user profile through user-management boundary.
- Regression tests: existing super-admin `/start` still resolves and sees admin menu.
- Gate tests: hidden menu item cannot be executed through direct command/callback.

## Risk Register

- **Risk**: Menu hiding is implemented without execution-time blocking.
  **Mitigation**: Central access gate is mandatory and tested independently from menu rendering.
- **Risk**: Membership module directly mutates user-management data.
  **Mitigation**: Event-bus contract and tests assert no direct module import for profile mutation.
- **Risk**: Public mode accidentally exposes unclassified actions.
  **Mitigation**: Unclassified actions default to protected.
- **Risk**: Existing super-admin bootstrap is broken.
  **Mitigation**: Add regression tests using current super-admin resolution path.
- **Risk**: Old local Docker data has inconsistent user records.
  **Mitigation**: Preserve repository lookup fixes and include migration/backfill notes where needed.

## Complexity Tracking

No constitution violation is accepted. The feature is cross-cutting but justified because access control must be centralized to prevent bypass through callbacks or direct commands.

## Post-Implementation Documentation

After implementation, update:

- `docs/ROADMAP.md`
- `docs/architecture/tempot_architecture.md`
- `docs/developer/workflow-guide.md` if workflow changes are needed
- `modules/membership-management/README.md`
- Root `README.md` local bot access-mode notes
- Relevant changelog or changeset
