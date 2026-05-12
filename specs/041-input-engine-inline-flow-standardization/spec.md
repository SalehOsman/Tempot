# Feature Specification: Input Engine Inline Flow Standardization

**Feature Branch**: `041-input-engine-inline-flow-standardization`  
**Created**: 2026-05-12  
**Status**: Implementation complete on branch; pending review and merge  
**Priority**: P1 platform standardization and production hardening  
**Input**: Product Manager approved a comprehensive correction so structured
Telegram flows use the shared `@tempot/input-engine` path instead of local
manual state patterns.

---

## Purpose

Tempot must expose one professional operating model for structured Telegram
flows:

1. Commands act as discoverable entry points.
2. Inline menus are the primary navigation surface.
3. `@tempot/input-engine` is the default engine for multi-step data collection.

This feature closes the runtime gap that prevents that model from being fully
production-ready, migrates the current `bot-management` registration flow to the
approved pattern, and reconciles the package documentation so future module work
uses the shared capability correctly.

---

## User Scenarios & Testing

### User Story 1 - Host Input Engine Flows in the Active Bot Runtime (Priority: P1)

As the Tempot platform, I need the bot runtime to host conversation-backed input
flows so that modules can use `@tempot/input-engine` without rebuilding generic
state machines.

**Why this priority**: Without runtime hosting, the package remains difficult to
adopt in production modules and local reimplementations continue.

**Independent Test**: Start the bot runtime with the input-flow integration
enabled, register a small conversation-backed form route in tests, and verify the
middleware stack can enter, continue, cancel, and complete the flow.

**Acceptance Scenarios**:

1. **Given** the bot server boots with its configured middleware stack,
   **When** an input-engine flow is registered, **Then** the runtime can host it
   without bypassing existing bot-server initialization paths.
2. **Given** an active conversation-backed form, **When** the user submits the
   next expected input, **Then** the form resumes through the shared runtime
   integration.
3. **Given** an active form, **When** the user cancels it, **Then** the runtime
   exits the conversation cleanly and the flow reports cancellation through the
   package contract.

---

### User Story 2 - Register Managed Bots Through the Standard Inline Flow (Priority: P1)

As an administrator, I want bot registration to run through the standard
input-engine flow from both commands and inline buttons so that Tempot uses one
professional creation path.

**Why this priority**: `bot-management` is the first active operational module
and should be the reference implementation for future modules.

**Independent Test**: Start registration from `/new_bot` and from the inline
menu, complete the same form successfully in both cases, and verify both produce
the same service result and follow-up navigation.

**Acceptance Scenarios**:

1. **Given** I am an administrator, **When** I use `/new_bot`, **Then** the
   shared bot registration form starts.
2. **Given** I am on the bot-management inline menu, **When** I choose the
   create action, **Then** the same shared bot registration form starts.
3. **Given** I complete the form with valid data, **When** registration
   finishes, **Then** the existing bot-management service persists the bot and
   the interface returns to the managed bot detail path.
4. **Given** I provide invalid or duplicate values, **When** validation runs,
   **Then** the flow presents package-backed validation feedback and the module
   does not create a partial bot record.

---

### User Story 3 - Remove the Disapproved Manual Registration State Path (Priority: P1)

As the technical owner of the codebase, I want the old local text-state
registration path removed once the shared form is active so that the repository
does not preserve a duplicate, lower-standard mechanism.

**Why this priority**: Keeping both paths would create divergence, maintenance
cost, and future ambiguity for module authors.

**Independent Test**: Confirm no production bot-registration path still depends
on the manual map-backed state service, while registration behavior remains
covered by the new tests.

**Acceptance Scenarios**:

1. **Given** the shared input flow is active, **When** repository searches and
   tests inspect bot registration, **Then** the removed manual state service is
   no longer part of the production path.
2. **Given** registration is cancelled or restarted, **When** the module handles
   the outcome, **Then** it uses package-backed flow control rather than local
   registration session state.

---

### User Story 4 - Give Developers Accurate Adoption Guidance (Priority: P1)

As a Tempot developer, I need current documentation for `@tempot/input-engine`
and the inline-flow standard so that future modules implement approved patterns
without rediscovering runtime details.

**Why this priority**: Documentation drift already exists and will keep causing
implementation drift unless corrected with the code change.

**Independent Test**: Review the updated README and feature artifacts, then
verify they describe the actual runtime prerequisites, implemented capability
surface, and the approved adoption pattern without contradictions.

**Acceptance Scenarios**:

1. **Given** I read the input-engine documentation, **When** I compare it with
   the package API and tests, **Then** the described field coverage and runtime
   status are accurate.
2. **Given** I plan a new Telegram module flow, **When** I consult the project
   guidance, **Then** it clearly directs me to commands plus inline menus plus
   `@tempot/input-engine` for structured input.

---

## Edge Cases

- Runtime integration must not disturb existing security middleware,
  initialization order, shutdown behavior, or module loading.
- Commands and inline actions must converge on the same flow to avoid duplicate
  service logic.
- A cancelled or interrupted registration must not create a partial bot record.
- Duplicate bot identity failures must stay service-authoritative and may not be
  hidden by the form layer.
- Documentation must not overstate support for workflows that remain future
  module adoption work.
- The feature must not silently turn every module migration into one broad,
  uncontrolled change set.

## Functional Requirements

- **FR-001**: Bot server MUST expose the shared runtime integration required for
  conversation-backed `@tempot/input-engine` flows.
- **FR-002**: The runtime integration MUST preserve existing bot-server startup,
  middleware, module loading, and shutdown behavior.
- **FR-003**: `bot-management` MUST start the same registration flow from
  `/new_bot` and from its inline create action.
- **FR-004**: Bot registration MUST use `@tempot/input-engine` rather than a local
  manual state map for structured multi-step collection.
- **FR-005**: Registration completion MUST continue to use existing validated
  module services and repositories for persistence.
- **FR-006**: Invalid and duplicate bot-registration inputs MUST be rejected
  without partial persistence.
- **FR-007**: Manual production registration state that duplicates
  `@tempot/input-engine` responsibilities MUST be removed once the shared form
  is in place.
- **FR-008**: The input-engine README MUST accurately describe implemented
  capabilities, runtime prerequisites, and current production readiness.
- **FR-009**: SpecKit planning MUST document package reuse decisions and any
  package/runtime composition used by this feature.
- **FR-010**: The change MUST remain reusable for future module flows without
  directly migrating unrelated modules in this feature.

## Key Entities

- **Input Flow Runtime Registration**: App-level conversation registration and
  middleware composition required to host package-backed forms.
- **Bot Registration Form Definition**: Module-owned schema/configuration passed
  to `@tempot/input-engine` to collect bot registration values.
- **Bot Registration Outcome**: Completed, cancelled, or validation-failed flow
  result that routes back into existing bot-management services and menus.

## Success Criteria

- **SC-001**: Bot-server tests prove a conversation-backed input flow can enter,
  continue, cancel, and complete through the active runtime integration.
- **SC-002**: `/new_bot` and the inline create action produce one equivalent
  registration journey with no duplicate domain path.
- **SC-003**: No production bot-registration path still depends on the removed
  manual state-map implementation after the feature is complete.
- **SC-004**: Updated docs accurately match the current input-engine capability
  surface and runtime prerequisites.
- **SC-005**: `pnpm spec:validate` passes with no critical reconciliation issue
  for the new feature artifacts.

## Assumptions

- Existing `@tempot/input-engine` package capabilities are materially complete
  and the remaining gap is runtime adoption plus module consumption, not a
  wholesale package redesign.
- `bot-management` registration service contracts remain the authoritative
  domain write path after the UI flow migration.
- Future modules will reuse the standardized pattern through later scoped work;
  this feature establishes the runtime foundation and first operational example.
