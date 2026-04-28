# Telegram Managed Bots Integration Boundary

**Status**: Draft execution artifact for spec #026
**Decision source**: ADR-041

## Future Boundary

Managed Bots support must live behind a dedicated boundary, tentatively:

```text
apps/bot-server or future dashboard
  -> managed-bot service/adapter
  -> Telegram Bot API
  -> event-bus audit/provisioning events
```

It must not be embedded directly into unrelated modules or existing startup wiring.

## Responsibilities

| Responsibility | Owner |
| --- | --- |
| Generate BotFather newbot link | Managed-bot adapter |
| Receive `managed_bot` update | Bot runtime integration |
| Validate owner consent | Managed-bot service |
| Retrieve token through `getManagedBotToken` | Managed-bot adapter |
| Encrypt and store token | Future token vault/storage boundary |
| Publish provisioning events | Event bus |
| Audit token access | Logger/audit package |
| Expose admin view | Future dashboard |

## Required Events

Suggested future event names:

- `managed-bot.provisioning.started`
- `managed-bot.created`
- `managed-bot.token.retrieved`
- `managed-bot.token.rotated`
- `managed-bot.disabled`

## Security Requirements

- Explicit user consent before provisioning.
- Token access limited to privileged system paths.
- Encrypted token storage.
- Token rotation guide before production use.
- Audit log for every token retrieval and use.
- Abuse limits per tenant, workspace, user, and bot.

## Non-Goals

- No current implementation.
- No database schema changes.
- No managed-bot dashboard UI.
- No coupling to `modules/user-management`.
- No bypass of SpecKit, Superpowers, i18n, or CI gates.
