---
title: Pre-Launch Checklist
description: Experimental launch and production certification checklist for Tempot bots
tags:
  - enterprise
  - launch
  - operations
  - checklist
audience:
  - bot-developer
  - operator
  - super-admin
contentType: developer-docs
difficulty: intermediate
---

# Pre-Launch Checklist

Use this checklist before allowing users into a bot created from Tempot.

## Experimental Launch Gate

Experimental launch is allowed only when these checks are complete:

- [ ] A staging Telegram bot exists and is separate from the production bot.
- [ ] `.env` is configured and not committed.
- [ ] `BOT_TOKEN`, `DATABASE_URL`, `REDIS_URL`, `SUPER_ADMIN_IDS`, and
  `BOT_MODE` are configured.
- [ ] `WEBHOOK_URL` and `WEBHOOK_SECRET_TOKEN` are configured when using webhook
  mode.
- [ ] `COMPOSE_PROJECT_NAME` and host ports are unique for this bot instance.
- [ ] `pnpm check` passes.
- [ ] `pnpm docs:check` passes.
- [ ] `pnpm template:audit` passes.
- [ ] Docker services start with `pnpm docker:dev`.
- [ ] `GET /live` returns alive when the bot server is running.
- [ ] `GET /ready` is not accessible without the readiness token when readiness
  is configured.
- [ ] `/start` works in the staging Telegram bot.
- [ ] Super-admin access works for the configured administrator.
- [ ] The selected critical module flows are tested in Telegram.

## Backup And Restore Gate

When backup features are enabled:

- [ ] Backup storage path is configured.
- [ ] Backup encryption key source is configured.
- [ ] Restore rehearsal database is separate from the live database.
- [ ] Restore rehearsal succeeds before any live restore is considered.
- [ ] Production restore is blocked unless a passed rehearsal exists.

## Production Certification Gate

Production certification requires stronger evidence than experimental launch:

- [ ] Release identity is recorded.
- [ ] Git commit or image digest is recorded.
- [ ] Migration compatibility decision is recorded.
- [ ] SLO status is recorded for critical journeys.
- [ ] Monitoring and alert route are tested.
- [ ] Rollback, forward-fix, or restore decision is recorded.
- [ ] Backup and restore rehearsal evidence is attached.
- [ ] Production operator and approver are recorded.

Do not treat local Docker success as production approval.
