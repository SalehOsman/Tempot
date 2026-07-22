# Tempot Production Deployment Guide

This guide describes provider-neutral container deployment for Tempot Core. It
does not approve production release by itself. Use the cutover plan and release
evidence record before any go/no-go decision.

## Prerequisites

| Requirement                        | Minimum version            |
| ---------------------------------- | -------------------------- |
| Docker                             | 24+                        |
| PostgreSQL                         | 16 with pgvector extension |
| Redis                              | 7-alpine                   |
| Node.js, if running without Docker | 22.12+                     |
| pnpm                               | 10.33.3                    |

## 1. Environment Variables

Copy `.env.example` to `.env` and fill in all required values. Do not commit
real secret values.

```bash
cp .env.example .env
```

### Required Variables

| Variable                                       | Description                                                |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `BOT_TOKEN`                                    | Telegram bot token from BotFather                          |
| `DATABASE_URL`                                 | PostgreSQL connection string                               |
| `REDIS_URL`                                    | Redis connection string                                    |
| `SUPER_ADMIN_IDS`                              | Comma-separated Telegram user IDs                          |
| `BOT_MODE`                                     | `webhook` for production                                   |
| `WEBHOOK_URL`                                  | Public HTTPS URL where Telegram delivers updates           |
| `WEBHOOK_SECRET_TOKEN`                         | Random secret token for Telegram webhook validation        |
| `TEMPOT_READINESS_TOKEN`                       | Secret token required for restricted readiness checks      |
| `DEFAULT_LANGUAGE`                             | Default locale, for example `en`                           |
| `DEFAULT_COUNTRY`                              | Default country, for example `US`                          |
| `PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION` | Active protected-data encryption key version               |
| `PROTECTED_DATA_ENCRYPTION_KEYS`               | JSON map of encryption key versions to base64 32-byte keys |
| `PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION`     | Active protected-data lookup key version                   |
| `PROTECTED_DATA_LOOKUP_KEYS`                   | JSON map of lookup key versions to base64 32-byte keys     |

### Optional Variables

| Variable             | Default      | Description                              |
| -------------------- | ------------ | ---------------------------------------- |
| `DATABASE_POOL_MAX`  | `20`         | PostgreSQL connection pool limit         |
| `TEMPOT_SENTRY`      | `false`      | Enable Sentry error monitoring           |
| `SENTRY_DSN`         | unset        | Required when `TEMPOT_SENTRY=true`       |
| `SENTRY_RELEASE`     | unset        | Git SHA, image digest, or semver release |
| `SENTRY_ENVIRONMENT` | `production` | Sentry environment tag                   |
| `LOG_LEVEL`          | `info`       | Pino log level                           |
| `TEMPOT_HTTP_TRUSTED_CLIENT_IP_HEADER` | unset | Trusted proxy header for webhook rate-limit buckets: `cf-connecting-ip` or `x-real-ip` |

Generate webhook secrets outside the repository:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Database Migrations

Always run migrations before starting the application for a new release.

```bash
pnpm --filter @tempot/database exec prisma migrate deploy
pnpm --filter @tempot/database exec prisma migrate status
```

Never use `prisma db push` in production because it bypasses migration history.

For container images, run Prisma from the deployed database package:

```bash
docker run --rm \
  --env-file .env \
  ghcr.io/<owner>/tempot-bot-server@sha256:<digest> \
  sh -c "cd /app/node_modules/@tempot/database && PRISMA_SCHEMA_PATH=/app/node_modules/@tempot/database/prisma/schema.prisma /app/node_modules/.pnpm/node_modules/.bin/prisma migrate deploy"
```

## 3. Docker Deployment

### Local Compose

`docker-compose.yml` is local-only infrastructure. It binds exposed ports to
`127.0.0.1` and must not be used as an internet-exposed production manifest.

```bash
docker compose up -d postgres redis
docker compose run --rm bot-server sh -c "cd /app/node_modules/@tempot/database && PRISMA_SCHEMA_PATH=/app/node_modules/@tempot/database/prisma/schema.prisma /app/node_modules/.pnpm/node_modules/.bin/prisma migrate deploy"
docker compose up -d bot-server
```

### Local Webhook Compose

Use this workflow for local staging-style webhook testing from the current
checkout. It builds the Docker image locally as `tempot-bot-server:local` and
runs the bot in webhook mode with the local PostgreSQL, Redis, and Cloudflare
Tunnel services.

```powershell
pnpm build:bot-runtime
docker compose -f docker-compose.yml -f docker-compose.webhook.yml -p tempot up -d --build bot-server
docker compose -f docker-compose.yml -f docker-compose.webhook.yml -p tempot ps
docker logs -f tempot-bot
```

Required `.env` values for this local webhook stack:

| Variable                 | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `WEBHOOK_URL`            | Current public HTTPS tunnel URL without `/webhook`         |
| `WEBHOOK_SECRET_TOKEN`   | Secret sent by Telegram and validated by the webhook route |
| `TEMPOT_READINESS_TOKEN` | Secret required by `GET /ready`                            |
| `TEMPOT_HTTP_TRUSTED_CLIENT_IP_HEADER` | Optional. Use `cf-connecting-ip` only when all webhook traffic goes through Cloudflare |

Cloudflare Quick Tunnel URLs are temporary. If the `tempot-cloudflared` service
prints a new `trycloudflare.com` URL, update `WEBHOOK_URL`, recreate the
`bot-server` service, and register the Telegram webhook again.

This workflow is for local verification only. Production promotion still uses
the immutable signed digest from the Docker workflow.

### Immutable Image Deployment

Promotion must use the immutable digest from the Docker workflow, not a mutable
tag.

```bash
docker pull ghcr.io/<owner>/tempot-bot-server@sha256:<digest>

docker run -d \
  --name tempot-bot \
  --env-file .env \
  -p 127.0.0.1:3000:3000 \
  ghcr.io/<owner>/tempot-bot-server@sha256:<digest>
```

Place a TLS reverse proxy or platform load balancer in front of the container.
Do not expose PostgreSQL or Redis to the public internet.

## 4. Webhook Registration

After deployment, register the webhook with Telegram:

```bash
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}/webhook\",
    \"secret_token\": \"${WEBHOOK_SECRET_TOKEN}\"
  }"
```

Verify:

```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

## 5. Health And Readiness Checks

Public liveness exposes only minimal process status:

```bash
curl http://localhost:3000/live
curl http://localhost:3000/health
```

Both must return:

```json
{ "status": "alive" }
```

Detailed readiness is restricted:

```bash
curl -H "x-tempot-readiness-token: ${TEMPOT_READINESS_TOKEN}" \
  http://localhost:3000/ready
```

`/ready` without the token must return `403`. With the token it returns
dependency details and a status of `healthy`, `degraded`, or `unhealthy`.

## 6. Monitoring And Alerts

Before promotion, confirm the target environment exposes or forwards:

- request and update latency;
- error rate;
- database latency or pool pressure;
- Redis latency;
- queue activity;
- memory and event-loop health;
- an independent alert path that does not depend only on Telegram.

## 7. Rollback Or Forward-Fix

Before rollback, read the migration compatibility record for the release. Image
rollback is allowed only when the previous digest is compatible with the
current schema and data state.

```bash
docker stop tempot-bot

docker run -d \
  --name tempot-bot \
  --env-file .env \
  ghcr.io/<owner>/tempot-bot-server@sha256:<previous-compatible-digest>
```

Do not mark a Prisma migration as rolled back unless the database state was
actually restored or corrected according to the migration compatibility record.
Use restore or forward-fix when image rollback is unsafe.

## 8. Production Cutover

Use `docs/operations/production-cutover-plan.md` for the full cutover sequence.
Record release evidence under `docs/operations/evidence/`.

## 9. Checklist Before Go-Live

- [ ] All required env vars are filled through the target platform secret store.
- [ ] `prisma migrate deploy` completed with no pending migrations.
- [ ] `GET /live` and `GET /health` return `{ "status": "alive" }`.
- [ ] `GET /ready` requires `x-tempot-readiness-token`.
- [ ] Webhook is registered and `getWebhookInfo` shows no errors.
- [ ] `SUPER_ADMIN_IDS` contains at least one valid Telegram user ID.
- [ ] Protected-data key rings are present and recoverable.
- [ ] Immutable digest is scanned, signed, verified, and promoted.
- [ ] Backup/restore rehearsal evidence is recorded.
- [ ] Rollback or forward-fix rehearsal evidence is recorded.
- [ ] Monitoring and independent alert evidence is recorded.
- [ ] Product Manager go/no-go decision is recorded.
