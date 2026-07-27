# backup-management

Telegram-facing operator module for backup, restore rehearsal, controlled live
restore, and database factory reset workflows.

The module owns only bot UX, authorization, confirmations, localized operator
messages, and safe evidence summaries. Reusable backup execution and metadata
behavior lives in `@tempot/backup-engine`; artifact storage must compose
`@tempot/storage-engine`.

## Scope

- Super-admin backup operations menu.
- Backup history and safe status summaries.
- Confirmation flows for backup, restore rehearsal, live restore, factory reset,
  retention, and deletion.
- Event-backed notifications and audit-friendly operator evidence.

## Boundaries

- Do not access Prisma directly from handlers or services.
- Do not send raw Telegram notifications directly when notifier or event-bus
  composition is available.
- Do not store plaintext backup artifacts or protected-data key material.
- Do not run live restore until a selected backup has a successful isolated
  restore rehearsal and the operator passes the two-step confirmation flow.
- Do not run database factory reset without creating a fresh backup first and
  passing the two-step confirmation flow. Factory reset deletes all users and
  relies on `SUPER_ADMIN_IDS` bootstrap after the bot container restarts.
