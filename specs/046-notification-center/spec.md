# Feature Specification: notification-center

## Goal

Build `notification-center` as the single operational notification module for
Telegram users. The module must provide real notification actions, clear
preferences, governed callback flows, and no duplicated notification menus in
`settings-management`.

## User Stories

### Story 1 - Open the Notification Center

As a Telegram user, I can open the notification center from the main menu or
`/notifications` so I can review notification status and available actions from
one predictable place.

**Acceptance Criteria**

- SC-001: Pressing the main menu Notifications button opens the notification
  center without unhandled callback fallback.
- SC-002: `/notifications` opens the same root notification center surface.
- SC-003: The root surface does not duplicate the settings notification
  preferences screen.

### Story 2 - Send a Real Test Notification

As a Telegram user, I can request a test notification so I can confirm the bot
can deliver notifications to my current chat.

**Acceptance Criteria**

- SC-004: Pressing Test Notification produces a real Telegram-visible delivery
  outcome, not only a static page transition.
- SC-005: Repeating the test action from the result surface must not produce
  Telegram's "message is not modified" unchanged callback path.
- SC-006: The result surface includes a delivery reference or timestamp so each
  test outcome is distinguishable.

### Story 3 - Manage Notification Preferences

As a Telegram user, I can review and update notification delivery from the
notification center and from settings through one shared destination.

**Acceptance Criteria**

- SC-007: `settings-management` links to `notifications:preferences` directly
  instead of rendering a duplicate notification settings menu.
- SC-008: The preferences surface shows the current notification delivery state
  from the persisted `notifications_enabled` setting.
- SC-009: Pressing the preference toggle persists the new delivery state and
  renders the updated state.

### Story 4 - Review Recent Notification Activity

As an administrator or supported user, I can review recent notification activity
so I can understand whether notification actions are being requested and
delivered.

**Acceptance Criteria**

- SC-010: The module exposes a recent activity surface backed by existing
  interaction or audit records.
- SC-011: Empty activity state is explicit and localized.
- SC-012: The activity surface never invents delivery history that is not present
  in the system.

### Story 5 - Govern All Notification Flows

As a maintainer, I can inspect the notification center flow map and run module
doctor checks so duplicate, stale, or unhandled callbacks are caught before bot
testing.

**Acceptance Criteria**

- SC-013: `modules/notification-center/module.flow.json` documents every visible
  notification surface and callback.
- SC-014: `pnpm tempot module doctor notification-center` passes with zero flow
  violations.
- SC-015: `settings-management` and `notification-center` flow maps agree on the
  single owner of notification preferences.

## Functional Requirements

- FR-001: The module MUST expose a `/notifications` command.
- FR-002: The module MUST own and handle the `notifications:*` callback namespace.
- FR-003: The module MUST render user-facing text through i18n keys only.
- FR-004: The module MUST provide a governed root surface for notification status.
- FR-005: The module MUST provide a governed preferences surface.
- FR-006: The module MUST provide a governed test result surface for test
  notification requests.
- FR-007: The module MUST publish a structured notification test request event.
- FR-008: The module MUST produce a Telegram-visible test delivery outcome for
  the requesting user.
- FR-009: The module MUST include a unique timestamp or reference in each test
  result surface.
- FR-010: The module MUST expose recent notification activity from existing
  observable records when records are available.
- FR-011: The module MUST not duplicate notification settings inside
  `settings-management`.
- FR-012: The module MUST define `module.flow.json` and pass module doctor flow
  checks.
- FR-013: Every visible callback MUST be handled, explicitly unavailable, or
  removed from the UI.
- FR-014: The module MUST reuse `@tempot/ux-helpers` for Telegram message update
  behavior.
- FR-015: The module MUST reuse the project event bus for cross-module or
  package-facing notification events.
- FR-016: The module MUST persist notification enablement using the approved
  settings package.
- FR-017: The module MUST expose a governed `notifications:toggle` callback for
  changing notification enablement.

## Non-Functional Requirements

- NFR-001: TypeScript strict mode must pass with no `any`, suppression comments,
  or production `console.*`.
- NFR-002: Runtime behavior changes must follow TDD.
- NFR-003: Module code must remain below constitution file and function limits.
- NFR-004: The module must not introduce new persistence without a separate
  approved data-model change.
- NFR-005: The module must not import another module directly.
- NFR-006: The module must keep Telegram interactions localized in Arabic and
  English.

## Out of Scope

- Per-user notification categories and quiet hours are out of scope until a
  dedicated user preference store is specified.
- Broadcast notification management is out of scope.
- SaaS tenant notification policy management is out of scope.
