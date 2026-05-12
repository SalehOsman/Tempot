# Feature Specification: Bot Management Module

**Feature Branch**: `040-bot-management`
**Created**: 2026-05-12
**Status**: Draft
**Priority**: P1 (Phase 3B operational platform module)
**Input**: Product Manager approved an operational `bot-management` module that should professionally reuse Tempot's existing platform capabilities.

---

## Purpose

Implement a `bot-management` module that gives administrators a governed
operational control plane for Telegram bots managed by Tempot. The module
tracks bot identity, configuration state, lifecycle status, enabled modules,
template provenance, operational health, and administrative actions.

The module is not a runtime process manager. It does not start, stop, or host
bot workers directly. Instead, it records and governs the operational state that
`apps/bot-server` and future SaaS/runtime layers can consume through approved
contracts and events.

This module is the baseline **Operational platform** module for Phase 3B and
prepares Tempot for future multi-bot readiness without introducing Tempot Cloud
or dashboard scope in this feature.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register and Inspect Managed Bots (Priority: P1)

As an administrator, I want to register a managed bot and view its operational
profile so that Tempot has one authoritative record for every bot it manages.

**Why this priority**: Bot registry is the foundation for all lifecycle,
settings, module, template, and health workflows.

**Independent Test**: Register a bot with required identity fields, view its
detail screen, and verify the recorded profile shows identity, status, runtime
mode, owner, locale, and module enablement summary.

**Acceptance Scenarios**:

1. **Given** I am an administrator, **When** I open the bot management menu,
   **Then** I can choose to list existing bots or register a new managed bot.
2. **Given** I register a bot with valid required fields, **When** registration
   completes, **Then** the bot is recorded in `DRAFT` status and its detail view
   is displayed.
3. **Given** a managed bot exists, **When** I open its detail view, **Then** I
   can see its identity, lifecycle status, runtime mode, owner, default locale,
   enabled modules summary, template source when present, and latest health
   snapshot.
4. **Given** a duplicate Telegram username is already registered, **When** I
   attempt to register another bot with the same username, **Then** the system
   rejects the registration and explains how to view the existing record.

---

### User Story 2 - Govern Bot Lifecycle (Priority: P1)

As an administrator, I want managed bots to move through explicit lifecycle
states so that operational changes are intentional, auditable, and reversible
where possible.

**Why this priority**: Lifecycle governance prevents accidental activation,
unsafe configuration changes, and ambiguous operational status.

**Independent Test**: Move a bot through the approved lifecycle states and
verify invalid transitions are blocked with clear reasons.

**Acceptance Scenarios**:

1. **Given** a bot is in `DRAFT`, **When** required configuration is completed,
   **Then** it can move to `CONFIGURED`.
2. **Given** a bot is in `CONFIGURED`, **When** an administrator activates it,
   **Then** it moves to `ACTIVE` and an operational event is recorded.
3. **Given** a bot is `ACTIVE`, **When** an administrator pauses it with a
   reason, **Then** it moves to `PAUSED` and remains visible in operational
   lists.
4. **Given** a bot is `ACTIVE` or `PAUSED`, **When** an administrator places it
   into maintenance with a reason, **Then** it moves to `MAINTENANCE`.
5. **Given** a bot is no longer needed, **When** an administrator archives it
   with a reason, **Then** it moves to `ARCHIVED` and is hidden from default
   active views without losing historical data.

---

### User Story 3 - Manage Bot Settings Profiles (Priority: P1)

As an administrator, I want each managed bot to have a settings profile so that
bot behavior is configurable without changing code.

**Why this priority**: Per-bot settings are necessary before modules can be
enabled safely across more than one bot.

**Independent Test**: Edit a bot settings profile, save it, reopen the profile,
and verify all values persist and are represented in the bot detail view.

**Acceptance Scenarios**:

1. **Given** a managed bot exists, **When** I open settings, **Then** I can view
   default language, country or region, timezone, notification preference,
   privacy flags, and feature toggles.
2. **Given** I update a setting, **When** I save the profile, **Then** the
   updated value is persisted and a settings-changed event is recorded.
3. **Given** a setting is invalid for the selected bot state, **When** I attempt
   to save it, **Then** the system rejects it and keeps the previous valid
   value.
4. **Given** a bot has no custom value for an optional setting, **When** its
   profile is viewed, **Then** the inherited default is shown clearly.

---

### User Story 4 - Enable Modules Per Bot (Priority: P1)

As an administrator, I want to choose which implemented modules are enabled for
each bot so that a bot can run only the capabilities it is intended to expose.

**Why this priority**: Module enablement makes Tempot's modular architecture
visible and governable at the bot level.

**Independent Test**: Enable and disable approved modules for a bot, verify the
module list updates, and verify blocked modules cannot be enabled when their
requirements are not satisfied.

**Acceptance Scenarios**:

1. **Given** a managed bot exists, **When** I open module enablement, **Then** I
   see available modules grouped by implemented, unavailable, and blocked.
2. **Given** a module is implemented and allowed, **When** I enable it for the
   bot, **Then** the bot module profile records the enabled state.
3. **Given** a module has unmet requirements, **When** I attempt to enable it,
   **Then** the action is blocked with the unmet requirements listed.
4. **Given** a module is enabled for a bot, **When** I disable it, **Then** a
   confirmation is required and the resulting state is recorded.

---

### User Story 5 - Provision Bots From Templates (Priority: P1)

As an administrator, I want to create a bot profile from a published template so
that approved templates can become real managed bot configurations.

**Why this priority**: This connects `template-management` to the operational
bot lifecycle and turns templates into usable product assets.

**Independent Test**: Select a published template, create a bot profile from it,
and verify the new bot records template source, version, initial modules, and
settings profile.

**Acceptance Scenarios**:

1. **Given** published templates exist, **When** I choose "create from
   template", **Then** I can browse and select an eligible template.
2. **Given** I select a template, **When** provisioning starts, **Then** a new
   bot profile is created in `DRAFT` status with a link to the template and
   version used.
3. **Given** a template requires modules that are not available, **When**
   provisioning is attempted, **Then** the system blocks provisioning and lists
   the missing requirements.
4. **Given** a bot was created from a template, **When** I view the bot detail,
   **Then** I can see the source template, source version, and provisioning
   timestamp.

---

### User Story 6 - Search and Filter Managed Bots (Priority: P2)

As an administrator, I want to search and filter managed bots so that I can find
operational records quickly as the number of bots grows.

**Why this priority**: Search is not required for the first bot, but it becomes
essential once multiple bots exist.

**Independent Test**: Search bots by name, username, owner, lifecycle status,
runtime mode, template source, and enabled module.

**Acceptance Scenarios**:

1. **Given** multiple bots exist, **When** I search by name or username,
   **Then** matching bots are listed with status and owner summary.
2. **Given** multiple bots exist, **When** I filter by lifecycle status,
   **Then** only bots in that status are shown.
3. **Given** a bot was provisioned from a template, **When** I filter by
   template source, **Then** the bot appears in matching results.
4. **Given** no bots match a search, **When** results are displayed, **Then** an
   empty state explains how to clear filters or register a bot.

---

### User Story 7 - Receive Operational Notifications (Priority: P2)

As an administrator, I want important bot-management changes to notify the right
people so that operational events do not get missed.

**Why this priority**: Notifications improve operational response without being
required for basic registry workflows.

**Independent Test**: Trigger lifecycle, provisioning, and health-warning
events and verify eligible administrators receive notification requests.

**Acceptance Scenarios**:

1. **Given** a bot is activated, paused, archived, or placed in maintenance,
   **When** the action completes, **Then** an operational notification is
   requested for eligible administrators.
2. **Given** provisioning from a template completes, **When** the bot profile is
   created, **Then** the requester receives a completion notification.
3. **Given** a bot health status becomes degraded or unhealthy, **When** the
   health snapshot is recorded, **Then** administrators are notified once per
   incident window.

---

### User Story 8 - Export and Import Bot Profiles (Priority: P3)

As an administrator, I want to export and import bot profiles so that bot setup
can be reviewed, backed up, and moved between Tempot instances.

**Why this priority**: Portability is useful, but it can follow the core
registry, lifecycle, and settings workflows.

**Independent Test**: Export a bot profile, import it into a clean environment,
and verify supported metadata, settings, modules, and template source are
preserved.

**Acceptance Scenarios**:

1. **Given** a bot profile exists, **When** I export it, **Then** a portable
   profile document is produced without exposing sensitive secrets.
2. **Given** an exported profile exists, **When** I import it, **Then** a new
   `DRAFT` bot profile is created for review before activation.
3. **Given** an imported profile references unavailable modules, **When** import
   completes, **Then** those modules are recorded as blocked requirements
   rather than silently enabled.
4. **Given** an exported profile contains sensitive values, **When** export is
   generated, **Then** those values are redacted or represented as required
   setup steps.

---

### Edge Cases

- **Token exposure**: Sensitive bot credentials must never be shown in full in
  lists, exports, notifications, logs, or audit summaries.
- **Duplicate identity**: Telegram username and bot token fingerprint must not
  be duplicated across active managed bots.
- **Incomplete configuration**: A bot cannot leave `DRAFT` until required
  identity, runtime mode, owner, locale, and settings profile values are valid.
- **Invalid lifecycle transition**: Unsupported state transitions must be
  rejected with a clear reason and no partial state changes.
- **Concurrent admin edits**: When two administrators edit the same bot profile,
  the later save must detect stale data and ask for review instead of silently
  overwriting.
- **Unavailable module**: A module that is not implemented or not ready must be
  visible as unavailable, not silently hidden when it affects provisioning.
- **Template update after provisioning**: Bots created from a template retain
  their source version and do not auto-upgrade without a future explicit update
  workflow.
- **Import with missing dependencies**: Import records missing modules or
  settings as blocked requirements and keeps the imported bot in `DRAFT`.
- **Health flapping**: Repeated degraded/healthy changes inside a short window
  must not flood administrators with repeated notifications.

---

## Non-Goals

- No dashboard or mini-app UI in this feature.
- No Tempot Cloud SaaS tenant model in this feature.
- No runtime worker orchestration, process supervision, or hosting control.
- No direct Telegram webhook registration changes without a later approved
  runtime contract.
- No payment, subscription, or monetization management.
- No AI assistant for bot setup in the MVP.
- No automatic template upgrade workflow for existing bots.
- No cross-instance live synchronization.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow administrators to register, view, edit, and
  archive managed bot records.
- **FR-002**: System MUST maintain a governed bot lifecycle with these states:
  `DRAFT`, `CONFIGURED`, `ACTIVE`, `PAUSED`, `MAINTENANCE`, and `ARCHIVED`.
- **FR-003**: System MUST reject invalid lifecycle transitions and preserve the
  previous valid state.
- **FR-004**: System MUST require a reason for pausing, maintenance mode, and
  archiving.
- **FR-005**: System MUST record an audit trail for every state-changing
  bot-management action.
- **FR-006**: System MUST support per-bot settings profiles for locale, region,
  timezone, notification preference, privacy flags, and feature toggles.
- **FR-007**: System MUST allow administrators to enable or disable implemented
  modules per managed bot.
- **FR-008**: System MUST block module enablement when required module
  conditions are not satisfied.
- **FR-009**: System MUST support creating a bot profile from a published
  template while preserving source template and version attribution.
- **FR-010**: System MUST keep bots created from templates in `DRAFT` until
  their configuration has been reviewed and completed.
- **FR-011**: System MUST search and filter managed bots by name, Telegram
  username, owner, lifecycle status, runtime mode, template source, and enabled
  module.
- **FR-012**: System MUST provide paginated bot lists with clear empty states
  and back navigation.
- **FR-013**: System MUST request operational notifications for lifecycle
  changes, provisioning completion, and health degradation.
- **FR-014**: System MUST support exporting bot profiles without exposing
  sensitive credentials.
- **FR-015**: System MUST support importing bot profiles into `DRAFT` status
  with validation and blocked-requirement reporting.
- **FR-016**: System MUST redact sensitive credentials in every user-facing,
  exported, logged, and notification context.
- **FR-017**: System MUST enforce role-based access for all bot-management
  actions:
  - `GUEST`: no access.
  - `USER`: no access unless explicitly granted in a later spec.
  - `ADMIN`: manage non-sensitive bot records and lifecycle.
  - `SUPER_ADMIN`: manage sensitive setup, credential rotation, and all admin
    actions.
- **FR-018**: System MUST expose command shortcuts only as secondary access
  paths; primary interaction is through menus and buttons.
- **FR-019**: System MUST emit domain events for bot registered, bot updated,
  lifecycle changed, module enablement changed, settings changed, provisioning
  completed, import completed, export completed, and health status changed.
- **FR-020**: System MUST preserve historical records when a bot is archived;
  archiving is not permanent deletion.
- **FR-021**: System MUST surface health status as `unknown`, `healthy`,
  `degraded`, or `unhealthy` without pretending to control runtime processes.
- **FR-022**: System MUST make unavailable or blocked modules visible in bot
  provisioning and module enablement flows.

### Key Entities

- **ManagedBot**: Authoritative record for a Telegram bot managed by Tempot,
  including identity, lifecycle status, owner, runtime mode, locale, and health
  summary.
- **BotSettingsProfile**: Per-bot configurable values such as locale, region,
  timezone, notification preference, privacy flags, and feature toggles.
- **BotModuleEnablement**: Module enablement state for a managed bot, including
  enabled, disabled, unavailable, or blocked status and the reason when blocked.
- **BotTemplateSource**: Optional attribution linking a managed bot to the
  published template and version used to create it.
- **BotLifecycleEvent**: Historical record of lifecycle changes, actor, reason,
  timestamp, and previous/new state.
- **BotHealthSnapshot**: Latest known health status and summary details for a
  managed bot.
- **BotProfileImport**: Import attempt with validation result, created bot
  reference when successful, and blocked requirements.
- **BotProfileExport**: Export request and produced artifact metadata with
  sensitive values redacted.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An administrator can register a bot profile and reach its detail
  view in under 3 minutes.
- **SC-002**: 100% of lifecycle transitions are either accepted according to the
  approved state model or rejected without changing persisted state.
- **SC-003**: 100% of sensitive credential displays are redacted in menus,
  exports, notifications, and audit summaries.
- **SC-004**: Search and filtered lists return the correct bot set in under 1
  second for 1,000 managed bot records.
- **SC-005**: A bot created from a published template preserves source template
  and version attribution in every detail view and export.
- **SC-006**: At least 90% of administrator workflows are available through
  buttons and menus, with commands acting only as shortcuts.
- **SC-007**: All state-changing actions produce an audit trail and a domain
  event.
- **SC-008**: Import/export round-trip preserves all non-sensitive supported
  profile data and reports missing requirements without data loss.
- **SC-009**: Module enablement never silently enables unavailable or blocked
  modules.
- **SC-010**: The feature passes SpecKit analysis and repository reconciliation
  gates before implementation handoff.

---

## Assumptions

- `bot-management` is an operational module under `modules/`, not a new shared
  package.
- `user-management` already provides administrator role context.
- `template-management` already provides published templates and versions that
  can be referenced for provisioning.
- Runtime process control remains owned by `apps/bot-server` or a future
  runtime contract; this module records and governs operational state only.
- Dashboard and mini-app experiences are future phases; Telegram menus are the
  primary interface for this feature.
- Sensitive credential storage and rotation require a stricter design in
  `plan.md`; this specification only defines required outcomes and boundaries.
- Imported profiles always enter `DRAFT` for review before activation.
- The initial expected scale is up to 1,000 managed bots in one Tempot instance.

---

## Capability Alignment

The module must reuse existing Tempot platform capabilities instead of creating
local substitutes:

- Authorization and administrator permissions.
- Repository-backed persistence and soft-delete behavior.
- Event-driven communication for lifecycle, settings, module, provisioning,
  import/export, and health changes.
- Settings profiles and feature toggles.
- Search, filtering, pagination, and state snapshots.
- Notification request flow for operational events.
- Import/export validation and artifact generation.
- Storage for generated artifacts when required by export workflows.
- Locale-driven user-facing text.
- Shared Telegram menu, pagination, confirmation, and status-message patterns.
- Audit logging and optional error monitoring.
- Module metadata and enablement visibility.

Exact package-level contracts and implementation choices belong in `plan.md`,
`research.md`, and `data-model.md`.

---

## References

- Constitution Rule XLVI: Module Creation Gate
- Constitution Rule LXXIX: Spec-Driven Development is Mandatory
- Constitution Rule LXXXII: Handoff Gate
- Constitution Rule L: Code-Documentation Parity
- Module Development Catalog: `docs/developer/module-development-catalog.md`
- New Module Checklist: `docs/developer/new-module-checklist.md`
- Roadmap baseline module strategy: `docs/ROADMAP.md`
- Spec #025: `user-management`
- Spec #039: `template-management`
