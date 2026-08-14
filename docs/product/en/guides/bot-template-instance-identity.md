---
title: Bot Template Instance Identity
description: How to name and isolate bot instances created from the Tempot template
tags:
  - guide
  - docker
  - template
  - operations
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: beginner
---

# Bot Template Instance Identity

This guide explains how a bot created from Tempot gets its local Docker
identity, how to change it, and how to run multiple bot instances on the same
Docker host without naming collisions.

## Change Plan

Tempot uses Docker Compose project identity instead of fixed container and
volume names.

The implementation rules are:

1. `.env.example` provides a default `COMPOSE_PROJECT_NAME=tempot`.
2. `docker-compose.yml` avoids fixed `container_name` values.
3. Docker volumes use Compose-managed names instead of explicit `tempot_*`
   volume names.
4. Host ports are configurable through `.env`.
5. Local image tagging is not pinned in Compose, so local builds do not share
   a fixed image name.

This keeps the default path simple for one bot and makes parallel local bot
instances predictable.

## Default Behavior

After copying `.env.example` to `.env`, the default local identity is:

```env
COMPOSE_PROJECT_NAME=tempot
BOT_HTTP_HOST_PORT=3000
POSTGRES_HOST_PORT=5432
RESTORE_POSTGRES_HOST_PORT=5433
```

If you do not change these values, the template runs with the default Tempot
local identity.

## Naming A New Bot Instance

Before the first Docker start for a new bot, edit `.env`:

```env
COMPOSE_PROJECT_NAME=my-customer-bot
BOT_HTTP_HOST_PORT=3001
POSTGRES_HOST_PORT=5434
RESTORE_POSTGRES_HOST_PORT=5435
```

Then start the local stack:

```bash
pnpm docker:dev
```

Use lowercase letters, digits, dashes, or underscores in
`COMPOSE_PROJECT_NAME`. Keep it short and stable because Docker uses it when
deriving container, network, and volume names.

## Telegram Name Versus Docker Identity

The Telegram bot name, username, avatar, and description are managed in
BotFather. These values are what end users see in Telegram.

`COMPOSE_PROJECT_NAME` is not visible to Telegram users. It is only the local
infrastructure identity used by Docker Compose.

## Local Docker Build Names

The Compose files do not pin a `container_name` or a fixed bot-server image tag.
Docker Compose can therefore derive local runtime names from the project and
service names. Use immutable image names only in production deployment manifests,
not in the local template Compose files.

## Multiple Bots On One Host

Each bot checkout should use a unique set of values:

| Bot | `COMPOSE_PROJECT_NAME` | `BOT_HTTP_HOST_PORT` | `POSTGRES_HOST_PORT` | `RESTORE_POSTGRES_HOST_PORT` |
| --- | --- | --- | --- | --- |
| First bot | `sales-bot` | `3000` | `5432` | `5433` |
| Second bot | `support-bot` | `3001` | `5434` | `5435` |
| Third bot | `ops-bot` | `3002` | `5436` | `5437` |

The internal service names remain `bot-server`, `postgres`, `redis`, and
`restore-postgres` inside each Compose project. Do not use host ports inside
container-to-container connection strings.

## Database URLs

For code running inside Docker, Compose provides internal URLs:

```env
DATABASE_URL=postgresql://tempot:tempot_password@postgres:5432/tempot_db
REDIS_URL=redis://redis:6379
```

For code running on the host through `pnpm dev`, use the host ports from `.env`:

```env
DATABASE_URL=postgresql://tempot:tempot_password@localhost:5434/tempot_db
REDIS_URL=redis://localhost:6379
```

If you change `POSTGRES_USER`, `POSTGRES_PASSWORD`, or `POSTGRES_DB`, keep
`DATABASE_URL` aligned with the same values.

## Verification

Before relying on a customized identity, verify the Compose configuration:

```bash
docker compose config
pnpm template:audit
pnpm check
```

For webhook mode:

```bash
docker compose -f docker-compose.yml -f docker-compose.webhook.yml config
```

These commands confirm that the Compose files resolve cleanly and that the
public template still passes the repository quality gates.
