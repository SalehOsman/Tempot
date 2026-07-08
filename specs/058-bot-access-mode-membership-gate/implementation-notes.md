# Implementation Notes: Bot Access Mode and Membership Gate

Date: 2026-06-22

## Confirmed Startup Insertion Point

The central access gate is registered in `apps/bot-server/src/bot/bot.factory.ts` after authentication and before scoped-users, validation, interaction observation, conversations, module handlers, and audit middleware.

Current order:

1. Sanitizer
2. Rate limiter
3. Maintenance
4. Authentication
5. Access gate
6. Scoped users
7. Validation
8. Interaction observer
9. Conversations
10. Module handlers
11. Audit middleware

This preserves the required behavior: every command and callback reaches the access gate only after actor resolution and before module handlers can execute protected behavior.

## Access Mode Settings Ownership

`BOT_ACCESS_MODE` is owned by `packages/settings` as a static setting for the current implementation slice:

- Missing value defaults to `private`.
- Valid values are `private` and `public`.
- Invalid values fail static settings validation and do not resolve to public behavior.

Runtime administration of access mode under settings-management is still pending.

## Event Bus Convention

The project event bus exposes `publish(eventName, payload): AsyncResult<void, AppError>`. Runtime module deps use a narrower `{ isOk(): boolean }` adapter, so `membership-management` converts runtime publish results back into a `Result` contract inside its setup function.

Implemented membership events:

- `membership-management.request.submitted`
- `membership-management.request.approved`
- `membership-management.request.rejected`

Pending event work:

- Cancelled and expired request events.
- Full audit evidence for membership state transitions and profile activation outcomes.

## Current Membership Runtime Behavior

Implemented:

- Unknown private visitor `/start` no longer receives the internal main menu.
- Unknown private visitor receives only a membership request prompt.
- `membership:request` is the only membership callback classified as bootstrap.
- `membership:list` and other membership callbacks are admin-only and require `manage.membership-request`.
- Access gate now reads CASL ability rules from `ctx.ability`; `manage.all` satisfies all required capabilities.
- Membership requests persist in PostgreSQL through `PrismaMembershipRequestRepository`.
- Membership request service supports submit, approve, and reject state transitions with event publication.
- Approved membership events now include Telegram username and language data needed by user-management profile activation.
- `user-management` subscribes to `membership-management.request.approved` and creates an idempotent default `USER` profile through its own repository boundary.
- Administrator review callbacks are implemented for pending list, request detail, approval, and rejection.
- Membership review menus are implemented with list, approve/reject, and back-to-list actions.
- Main-menu navigation now carries access classification and required-ability metadata.
- `/start` prefers ability-filtered navigation when the runtime provider exposes it.
- The navigation provider filters by role and required CASL ability; `manage.all` satisfies ability-gated entries.
- Access-gate command/callback namespace mapping now uses the same required-ability tokens as menu rendering for settings, users, membership, audit, notifications, content, help, and profile.
- Existing menu items are classified as protected or admin; template-management and bot-management currently expose no main-menu item.

Pending:

- Full `pnpm test:integration` completion in the current local environment; the latest full run fails only in unrelated TestDB/Prisma schema setup suites, and those failed suites pass when run individually.
- Runtime access-mode administration UI.
- Full end-to-end Telegram scenario tests.
