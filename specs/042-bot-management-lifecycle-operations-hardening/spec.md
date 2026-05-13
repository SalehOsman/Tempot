# Feature Specification: Bot Management Lifecycle Operations Hardening

**Feature Branch**: `042-bot-management-lifecycle-operations-hardening`  
**Created**: 2026-05-13  
**Status**: Implementation complete on branch; pending review and merge  
**Priority**: P1 operational completion slice for `bot-management`  
**Input**: Product Manager approved continuing `bot-management` production
completion with lifecycle operations as the next full methodology slice.

---

## Purpose

The `bot-management` module already owns lifecycle contracts, transition policy,
domain service logic, repositories, and events. What remains incomplete is the
production-facing Telegram workflow that lets administrators operate those
transitions safely and consistently.

This feature turns lifecycle governance into a complete inline-first operating
surface:

1. Inline lifecycle actions appear from bot detail views.
2. Only valid next actions are exposed for the current state.
3. Reason-required transitions use `@tempot/input-engine`.
4. Sensitive transitions receive explicit confirmation where appropriate.
5. Results return to the updated detail surface without bypassing existing
   `LifecycleService` rules.

The feature does not broaden into settings, provisioning, search, notifications,
or import/export. Those remain later slices inside the wider Spec #040 module
completion program.

---

## User Scenarios & Testing

### User Story 1 - Open a Lifecycle Control Surface (Priority: P1)

As an administrator, I want to open lifecycle controls for a managed bot so that
I can understand which state changes are currently allowed.

**Independent Test**: Open bot detail, select lifecycle, and verify the rendered
menu includes only valid next actions for the bot's current lifecycle status.

**Acceptance Scenarios**:

1. **Given** a bot detail view is visible, **When** I select the lifecycle action,
   **Then** the bot view updates in place to a lifecycle control surface.
2. **Given** a bot is `CONFIGURED`, **When** lifecycle controls render, **Then**
   activation and archive actions are available while invalid actions are absent.
3. **Given** a bot is `ACTIVE`, **When** lifecycle controls render, **Then**
   pause, maintenance, and archive actions are available while duplicate activate
   or resume actions are absent.
4. **Given** a lifecycle surface is open, **When** I choose back, **Then** I
   return to the same bot detail surface.

### User Story 2 - Execute Direct Lifecycle Transitions (Priority: P1)

As an administrator, I want allowed direct transitions to execute cleanly so that
bot state can be governed from Telegram without a dashboard.

**Independent Test**: Trigger allowed non-reason transitions from inline actions,
verify `LifecycleService` receives the right target state, and confirm the bot
detail view reflects the updated status.

**Acceptance Scenarios**:

1. **Given** a bot is `DRAFT`, **When** it is promoted to `CONFIGURED`, **Then**
   the service persists the transition, records history, and the detail view
   shows `CONFIGURED`.
2. **Given** a bot is `CONFIGURED`, **When** activation is selected, **Then** the
   service moves it to `ACTIVE` and the detail view reflects the new state.
3. **Given** a bot is `PAUSED` or `MAINTENANCE`, **When** resume is selected,
   **Then** the service returns it to `ACTIVE`.
4. **Given** a transition is no longer valid at execution time, **When** the
   action is submitted, **Then** the module shows the localized invalid-state
   message and does not report false success.

### User Story 3 - Execute Reason-Required Lifecycle Transitions (Priority: P1)

As an administrator, I want pause, maintenance, and archive actions to collect a
reason through the shared input engine so that operational governance remains
auditable and consistent.

**Independent Test**: Start a reason-required action, complete the reason form,
verify the service receives the trimmed reason, and confirm cancellation or
missing-reason paths do not mutate bot state.

**Acceptance Scenarios**:

1. **Given** a bot is `ACTIVE`, **When** I choose pause, **Then** a guided reason
   flow starts through `@tempot/input-engine`.
2. **Given** a bot is `ACTIVE` or `PAUSED`, **When** I choose maintenance,
   **Then** a guided reason flow starts through `@tempot/input-engine`.
3. **Given** a bot can be archived, **When** I approve archive intent, **Then**
   the reason form starts and the service receives the reason before archiving.
4. **Given** the reason flow is cancelled, **When** cancellation completes,
   **Then** no lifecycle state change is persisted and the user receives a
   localized cancellation-safe result.
5. **Given** an empty or whitespace-only reason is submitted, **When** the flow
   validates input, **Then** the shared form feedback rejects it before service
   invocation.

### User Story 4 - Preserve Production UX and Governance Guarantees (Priority: P1)

As the project owner, I want the lifecycle surface to preserve Tempot's approved
interaction and governance rules so that the feature becomes a reference pattern
for later module slices.

**Independent Test**: Verify in tests that lifecycle actions are inline-first,
reuse existing services rather than duplicating domain rules, use i18n keys only,
and keep invalid/cancelled transitions non-mutating.

**Acceptance Scenarios**:

1. **Given** lifecycle operations execute through callbacks and guided flows,
   **When** tests inspect the implementation, **Then** no duplicate lifecycle
   state machine or local map-based form state exists.
2. **Given** user-facing lifecycle copy is emitted, **When** code and locale
   files are reviewed, **Then** TypeScript files contain no hardcoded end-user
   lifecycle text.
3. **Given** lifecycle flows depend on packages, **When** implementation is
   reviewed, **Then** `@tempot/input-engine` and existing UX/runtime contracts
   are composed instead of bypassed.
4. **Given** the feature is complete, **When** README and feature artifacts are
   reviewed, **Then** documentation matches the actual production behavior.

---

## Edge Cases

- A lifecycle menu opened earlier may become stale before execution; service
  validation remains authoritative.
- Archive must not be exposed as an ordinary one-click destructive action.
- Reason-required transitions must not mutate state if form completion fails,
  cancellation occurs, or validation rejects the reason.
- A missing bot should return the existing localized not-found behavior rather
  than throwing from callback handling.
- Current lifecycle status may not permit any forward transition; the menu must
  still provide back navigation.
- Event publication failure must surface through the existing lifecycle service
  result path and must not produce false success in the Telegram surface.

## Functional Requirements

- **FR-001**: The lifecycle control surface MUST be reachable from bot detail
  inline menus.
- **FR-002**: Lifecycle menus MUST show only actions valid for the bot's current
  state according to existing transition policy.
- **FR-003**: Direct lifecycle actions MUST reuse `LifecycleService.transition`
  and MUST NOT duplicate transition rules in handlers.
- **FR-004**: Pause, maintenance, and archive lifecycle actions MUST collect a
  reason through `@tempot/input-engine`.
- **FR-005**: Archive MUST require explicit inline confirmation before the
  reason flow starts.
- **FR-006**: Successful lifecycle changes MUST return to an updated bot detail
  surface reflecting the new status.
- **FR-007**: Invalid, stale, missing-bot, or service-rejected actions MUST show
  localized feedback without reporting false success.
- **FR-008**: Cancelled reason flows MUST not call lifecycle persistence.
- **FR-009**: Lifecycle controls MUST remain inline-first; commands may remain
  secondary entry points only if already present in the module.
- **FR-010**: The implementation MUST preserve the existing event/history
  behavior already owned by `LifecycleService`.
- **FR-011**: SpecKit planning MUST document capability reuse decisions for
  input-engine, callback UX, and lifecycle domain orchestration.
- **FR-012**: Documentation MUST be reconciled so `bot-management` README and
  feature artifacts describe lifecycle operations accurately.

## Key Entities

- **Lifecycle Action Menu**: Current-state-derived inline control surface shown
  from a managed bot detail view.
- **Lifecycle Transition Intent**: A callback action containing bot identity and
  target status, validated against current lifecycle state before service use.
- **Lifecycle Reason Flow**: Shared `@tempot/input-engine` conversation that
  collects a required transition reason for governed actions.
- **Lifecycle Archive Confirmation**: Inline confirmation step that prevents
  accidental archive execution.
- **Lifecycle Operation Outcome**: Updated detail view, validation rejection,
  cancellation response, missing-bot response, or service failure response.

## Success Criteria

- **SC-001**: Tests prove lifecycle menus expose valid next actions and hide
  invalid ones for representative states.
- **SC-002**: Tests prove direct lifecycle actions call the existing service and
  update the detail surface on success.
- **SC-003**: Tests prove reason-required actions use input-engine and do not
  mutate state on cancellation or invalid reason input.
- **SC-004**: Tests prove archive requires confirmation before the reason flow.
- **SC-005**: `pnpm spec:validate` passes for Spec #042 with zero critical issues.

## Assumptions

- Existing lifecycle transition policy and `LifecycleService` remain the source
  of truth for allowed state changes.
- `@tempot/input-engine` already has the runtime adoption required for guided
  lifecycle reason flows after Spec #041.
- Lifecycle notification dispatch remains outside this slice and will be handled
  in a later focused feature when the notifier integration is scheduled.
