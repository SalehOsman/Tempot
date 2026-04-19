# Spec: Test Module (`test-module`)

> **Status:** Temporary — remove when the first real feature module is added.
>
> This module exists solely to verify the full bot pipeline end-to-end
> during local development and Docker deployments.

## Purpose

Provide a minimal, removable Telegram module that exercises all layers of
the infrastructure without implementing any business logic:

- Telegram command routing (grammY)
- Module discovery & validation pipeline
- Session read via `deps.sessionProvider`
- Dynamic settings read via `deps.settings`
- Event bus publish via `deps.eventBus`
- Process metrics (uptime, memory)

## Commands

| Command   | Role Required | Description                          |
|-----------|--------------|--------------------------------------|
| `/start`  | GUEST        | Welcome message + command list       |
| `/ping`   | GUEST        | Round-trip latency measurement       |
| `/whoami` | GUEST        | Display session role, language, status |
| `/dbtest` | GUEST        | Read `maintenance_mode` from settings |
| `/status` | GUEST        | Uptime, memory, event bus smoke test |

## Removal

Delete the following when no longer needed:

- `apps/bot-server/modules/test-module/`
- `specs/022-test-module/`

No database migrations or schema changes are introduced by this module.
