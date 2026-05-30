# Implementation Plan: notification-center

## Technical Context

- Runtime: Node.js 22.12+.
- Language: TypeScript 5.9.3 strict mode.
- Bot interface: grammY callbacks and commands.
- UX package: `@tempot/ux-helpers` for edit-or-send behavior and unchanged
  callback handling.
- Eventing: `@tempot/event-bus` via the module dependency container.
- Existing observable data: `interactionEvents` and `auditLog` providers exposed
  by `apps/bot-server`.
- Settings package: `@tempot/settings` stores the global
  `notifications_enabled` delivery setting.
- Optional notification package: `@tempot/notifier` remains the delivery
  capability reference, but this module must not invent an unconnected queue path.

## Constitution Check

- TypeScript strict mode: required.
- i18n-only user-facing text: required.
- Event-driven communication: required for cross-module or package-facing
  notification events.
- No direct module-to-module imports: required.
- TDD: required before production behavior changes.
- Fix at source: duplicate menus and unchanged callback behavior must be fixed in
  the owning menu and handler logic.
- Documentation parity: this spec, plan, data model, research, tasks,
  quickstart, module flow map, and developer docs must stay aligned.

## Architecture

`notification-center` becomes the single owner of notification operational UI.
It owns `notifications:*` callbacks and exposes the root, preferences, activity,
and test result surfaces. `settings-management` must only route to
`notifications:preferences`; it must not render a duplicate notification
settings submenu.

The first implementation uses the existing module dependency container:

- `eventBus.publish` records structured notification test requests.
- `ctx.reply` or an equivalent Telegram-visible action confirms real delivery to
  the current chat.
- `interactionEvents.findMany` and `auditLog.findMany` provide activity evidence.
- `@tempot/ux-helpers` updates the current screen and handles stale callbacks.

## Flow Surfaces

| Surface | Type | Opened by | Purpose |
| --- | --- | --- | --- |
| `notifications.main` | parent | `/notifications`, `notifications:view` | Operational notification center. |
| `notifications.preferences` | leaf | `notifications:preferences` | Review and toggle current delivery preference state. |
| `notifications.test_result` | result | `notifications:test` | Confirm a real test notification request with a unique timestamp/reference. |
| `notifications.activity` | leaf | `notifications:activity` | Show recent notification-related activity from observable records. |

## Callback Contract

| Callback | Owner | Behavior |
| --- | --- | --- |
| `notifications:view` | notification-center | Show root notification center. |
| `notifications:preferences` | notification-center | Show preferences surface. |
| `notifications:toggle` | notification-center | Persist the opposite notification delivery state, then show preferences. |
| `notifications:test` | notification-center | Publish test request, produce Telegram-visible test delivery, then show result. |
| `notifications:activity` | notification-center | Show recent activity or explicit empty state. |
| `menu:main` | bot-server | Exit to main menu. |
| `settings:view` | settings-management | Exit to settings when opened from settings context. |

## Integration Plan

1. Update `settings-management` so its notification entry links directly to
   `notifications:preferences` and no longer exposes `notifications:test`.
2. Add `modules/notification-center/module.flow.json` with all notification
   surfaces and callback actions.
3. Refactor notification menu construction to render surface-specific keyboards.
4. Refactor notification callback handling to use explicit action-to-surface
   resolution.
5. Implement settings-backed notification enablement toggle.
6. Implement test notification delivery as a visible Telegram message plus a
   unique result surface.
7. Implement recent activity display from existing interaction or audit records.
8. Add focused runtime and module doctor tests.
9. Update docs and quickstart, then run the required gates.

## Risk Controls

- If `@tempot/notifier` is not wired into the bot runtime, do not fake queue
  delivery. Produce a real Telegram-visible test delivery and keep event
  publication as the integration signal.
- Only implement the currently approved global notification enablement toggle.
  Do not add per-user categories, quiet hours, or priority rules in this change.
- If activity providers return no records, show a localized empty state rather
  than fabricated history.

## Verification Plan

- `pnpm --filter @tempot/notification-center test`
- `pnpm --filter @tempot/notification-center build`
- `pnpm --filter @tempot/settings-management test`
- `pnpm tempot module doctor notification-center`
- `pnpm tempot module doctor settings-management`
- `pnpm cms:check`
- `pnpm spec:validate`
- Broader `pnpm lint` and `pnpm build:bot-runtime` before merge.
