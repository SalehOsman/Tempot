---
title: Bot Creation Checklist
description: Checklist for creating a new Telegram bot from the Tempot template
tags:
  - enterprise
  - bot-creation
  - checklist
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: beginner
---

# Bot Creation Checklist

Use this checklist before running a bot created from Tempot.

## Identity

- [ ] Choose a repository name for the new bot.
- [ ] Create a Telegram bot in BotFather.
- [ ] Record the Telegram display name and username outside the repository.
- [ ] Copy `.env.example` to `.env`.
- [ ] Set a unique `COMPOSE_PROJECT_NAME` if more than one bot can run on the
  same Docker host.
- [ ] Set non-conflicting host ports when another bot or local service already
  uses the defaults.

Example local identity:

```env
COMPOSE_PROJECT_NAME=my-customer-bot
BOT_HTTP_HOST_PORT=3001
POSTGRES_HOST_PORT=5434
RESTORE_POSTGRES_HOST_PORT=5435
```

## Required Environment

- [ ] `BOT_TOKEN` is set from BotFather.
- [ ] `DATABASE_URL` points to the intended PostgreSQL instance.
- [ ] `REDIS_URL` points to the intended Redis instance.
- [ ] `SUPER_ADMIN_IDS` contains the Telegram user IDs allowed to administer the
  bot.
- [ ] `BOT_MODE` is set to `polling` for simple local development or `webhook`
  for webhook operation.
- [ ] `WEBHOOK_URL` and `WEBHOOK_SECRET_TOKEN` are set when `BOT_MODE=webhook`.
- [ ] Real `.env` files are not committed.

## First Run

```bash
pnpm install
pnpm docker:dev
pnpm dev
```

On Windows PowerShell, copy the environment example with:

```powershell
Copy-Item .env.example .env
```

## Minimum Validation

Run:

```bash
pnpm check
pnpm docs:check
pnpm template:audit
```

The bot is not ready for experimental users until the checks pass and the
critical Telegram flows are tested with a real staging bot.

## Customization Rule

Place bot-specific workflows in `modules/` first. Change shared packages only
when the behavior is truly platform-level and must apply to all modules.
