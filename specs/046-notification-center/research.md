# Research: notification-center

## Decision: Make notification-center the single operational UI owner

Rationale: The bot currently exposes Notifications in the main menu and a
separate notification submenu inside Settings. This creates duplicate entry
points with overlapping labels. A single owner for `notifications:*` keeps
flows reviewable and lets `settings-management` route directly to preferences.

Alternatives considered:

- Keep both menus: rejected because it preserves the duplicate user experience.
- Move notifications only under settings: rejected because operational
  notification activity and delivery testing are not settings-only concerns.

## Decision: Use real Telegram-visible test delivery first

Rationale: The existing `@tempot/notifier` package is the project notification
capability, but the current module dependency container does not expose a
notifier service to modules. Routing the test action only through an event would
remain invisible to users. The first functional implementation must therefore
publish the event and also produce a visible test delivery to the current chat.

Alternatives considered:

- Publish event only: rejected because it is the current fake-feeling behavior.
- Wire a full queue-backed notifier runtime immediately: deferred because it is
  a broader app-level integration and should be specified separately if needed.

## Decision: Notification enablement uses the settings package

Rationale: The notification center needs at least one real preference action.
`@tempot/settings` already owns global dynamic settings backed by the database,
so `notifications_enabled` is the smallest approved persisted setting for the
current core bot. This avoids a fake toggle and avoids introducing a new table
for a broader user-preference system.

Alternatives considered:

- Keep preferences review-only: rejected because the Project Manager requires a
  functional module, not an informational page.
- Add per-user notification preference storage now: deferred because categories,
  quiet hours, and per-user policy need a separate data-model and repository
  design.

## Decision: Activity uses existing observability providers

Rationale: The bot server already exposes `interactionEvents` and `auditLog` to
modules. These sources can provide honest recent activity without inventing a
new notification history table.

Alternatives considered:

- Create notification history storage now: deferred until delivery pipeline
  history requirements are specified.
- Display static sample history: rejected as fake behavior.
