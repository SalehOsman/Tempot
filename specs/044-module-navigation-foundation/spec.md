# Feature Specification: Module Navigation Foundation

**Feature Branch**: `codex/module-navigation-foundation`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "Implement a full architectural solution for the `/start` menu so settings, notifications, messages, stats, and help are owned by professional modules, follow Tempot methodology, and reuse existing project packages wherever possible instead of rewriting capabilities."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Only Available Actions Appear (Priority: P1)

A bot user opens `/start` and sees a main menu that contains only actions backed by enabled, registered product capabilities.

**Why this priority**: The current menu advertises unavailable actions, causing repeated fallback messages and making the bot feel broken.

**Independent Test**: Can be fully tested by disabling or omitting a capability owner and confirming its menu action is absent, while enabled capabilities still appear and respond.

**Acceptance Scenarios**:

1. **Given** a capability is enabled and the user has permission, **When** the user opens `/start`, **Then** the related menu action is visible and pressing it opens the expected capability view.
2. **Given** a capability is not implemented, disabled, or unavailable, **When** the user opens `/start`, **Then** the related menu action is not shown.
3. **Given** a previously rendered menu contains a stale action, **When** the user presses it after the owner is disabled, **Then** the user receives a clear unavailable-action response and can return to a valid menu.

---

### User Story 2 - Modules Own Their Menu Entries (Priority: P1)

A module owner can declare the main-menu actions, callback ownership, role visibility, and user-facing labels for a capability without changing unrelated modules.

**Why this priority**: Menu ownership must follow module boundaries so future modules do not require hardcoded edits in `user-management`.

**Independent Test**: Can be tested by adding one enabled module contribution and confirming the main menu includes its action, routes the callback to that owner, and removes it when disabled.

**Acceptance Scenarios**:

1. **Given** a module declares a menu action, **When** the bot starts, **Then** the action is registered with its owner and appears only for eligible users.
2. **Given** two modules declare different actions, **When** the main menu is rendered, **Then** both actions appear in a stable, predictable order without one module importing the other.
3. **Given** two modules attempt to claim the same callback action, **When** startup validation runs, **Then** the conflict is reported and the invalid configuration is rejected.

---

### User Story 3 - Administrators See Operational Capabilities (Priority: P2)

An administrator opens `/start` and sees operational capabilities such as settings, notifications, messages, statistics, and help only when their owning modules are active.

**Why this priority**: Admin users need a coherent control surface for the single-bot template while preserving future module growth.

**Independent Test**: Can be tested with an admin user and a standard user, confirming capability visibility changes by role and module availability.

**Acceptance Scenarios**:

1. **Given** an admin user and enabled operational modules, **When** the admin opens `/start`, **Then** operational actions appear and route to their module-owned entry views.
2. **Given** a standard user, **When** the user opens `/start`, **Then** admin-only actions are hidden even when the owning module is enabled.
3. **Given** no operational modules are enabled, **When** an admin opens `/start`, **Then** the menu still renders successfully with available core actions.

---

### User Story 4 - Help Reflects Active Capabilities (Priority: P3)

A user opens help and sees guidance for the active commands and capabilities they can access.

**Why this priority**: Help should reduce confusion and must not document unavailable features.

**Independent Test**: Can be tested by enabling and disabling capabilities and confirming the help view updates to match the available actions for the current user.

**Acceptance Scenarios**:

1. **Given** a capability is enabled for the user, **When** help is opened, **Then** the capability appears with a concise purpose and available entry action.
2. **Given** a capability is unavailable to the user, **When** help is opened, **Then** the capability is omitted.

### Edge Cases

- A menu action points to a disabled, missing, or failed module.
- A callback arrives from an old message after module availability changed.
- Two modules declare the same callback namespace or action.
- A user role changes between menu render and button press.
- A module contribution lacks a localized label for the user's language.
- A module is enabled but its startup validation fails.
- A menu contains more actions than fit comfortably in one Telegram keyboard.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST render `/start` menu actions from enabled capability owners rather than hardcoding unavailable actions in a single module.
- **FR-002**: Every visible main-menu action MUST have an owning module or platform capability that can handle the action at the time the menu is rendered.
- **FR-003**: The system MUST hide menu actions whose owning capability is disabled, unavailable, failed validation, or not permitted for the current user.
- **FR-004**: The system MUST reject duplicate callback ownership for the same action or namespace during startup validation.
- **FR-005**: The system MUST preserve module boundaries: one feature module MUST NOT directly import another feature module to render or route its menu actions.
- **FR-006**: The system MUST allow modules to declare role-aware main-menu contributions with localized labels and stable ordering metadata.
- **FR-007**: The system MUST route callback actions to the owning capability and MUST produce a clear unavailable-action response for stale or invalid callbacks.
- **FR-008**: The system MUST keep existing working actions for profile, user administration, templates, and bot management while moving ownership into the new navigation model.
- **FR-009**: The system MUST define ownership expectations for settings, notifications, messages, statistics, and help so each can be implemented by a dedicated professional module in later specs.
- **FR-010**: The system MUST provide a help surface that reflects the user's accessible active capabilities and omits unavailable capabilities.
- **FR-011**: The system MUST support role-specific menus for standard users, admins, and super admins.
- **FR-012**: The system MUST record enough validation evidence for maintainers to diagnose missing owners, duplicate actions, and disabled contributions.
- **FR-013**: The system MUST avoid duplicating existing platform capabilities when an existing package or module-level service already owns the relevant concern.

### Key Entities _(include if feature involves data)_

- **Navigation Contribution**: A module-owned declaration for a menu action, including label key, action identifier, visibility rules, ordering, and owner metadata.
- **Callback Ownership**: The mapping between a callback action or namespace and the module or platform capability responsible for handling it.
- **Navigation Surface**: A user-visible menu or help view assembled from active contributions for a specific user and context.
- **Capability Availability**: The runtime state that determines whether a contribution can be shown and handled.
- **Visibility Rule**: A role, permission, or capability condition that controls whether a contribution is available to a user.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of buttons shown in `/start` have an active handler or are omitted from the rendered menu.
- **SC-002**: Pressing any visible `/start` menu button completes with a capability response or valid unavailable-action response in under 2 seconds during local development.
- **SC-003**: Standard users, admins, and super admins each see menus that match their accessible active capabilities in all acceptance scenarios.
- **SC-004**: Startup validation catches duplicate callback ownership and missing owners before the bot begins serving updates.
- **SC-005**: Help content lists only accessible active capabilities for the current user in all tested role scenarios.
- **SC-006**: No module duplicates an existing platform capability when an existing package or service is available for that concern.

## Assumptions

- The first implementation slice is the navigation foundation and ownership model, not all downstream modules at once.
- Settings, notifications, messages, statistics, and help will each receive their own follow-up SpecKit artifacts before production implementation.
- Existing implemented modules remain active and must continue working while the navigation model changes.
- The menu is optimized for Telegram inline keyboard use in the current single-bot template.
- The architecture must remain ready for future multi-bot scope without introducing hosted SaaS behavior in this slice.
