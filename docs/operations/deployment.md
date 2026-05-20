# Tempot — Production Deployment Guide

## Prerequisites

| Requirement | Minimum version |
|---|---|
| Docker | 24+ |
| PostgreSQL | 16 with pgvector extension |
| Redis | 7-alpine |
| Node.js (if running without Docker) | 22.12+ |
| pnpm | 11+ |

---

## 1. Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

### Required variables

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SUPER_ADMIN_IDS` | Comma-separated Telegram user IDs |
| `BOT_MODE` | `webhook` for production |
| `WEBHOOK_URL` | Public HTTPS URL where Telegram delivers updates |
| `WEBHOOK_SECRET_TOKEN` | Random 32-byte hex — validate Telegram requests |

### Optional variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_POOL_MAX` | `20` | PostgreSQL connection pool limit |
| `TEMPOT_SENTRY` | `false` | Enable Sentry error monitoring |
| `SENTRY_DSN` | — | Required when `TEMPOT_SENTRY=true` |
| `SENTRY_RELEASE` | — | Git SHA or semver tag for release tracking |
| `SENTRY_ENVIRONMENT` | `production` | Sentry environment tag |
| `LOG_LEVEL` | `info` | Pino log level |

Generate a secure webhook secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Database Migrations

**Always run migrations before starting the application.**

```bash
# First deployment or after schema changes
pnpm --filter @tempot/database exec prisma migrate deploy

# Verify migration status
pnpm --filter @tempot/database exec prisma migrate status
```

> **Never** use `prisma db push` in production — it bypasses migration history.

---

## 3. Docker Deployment (Recommended)

### Build the image

```bash
docker build -f apps/bot-server/Dockerfile -t tempot-bot-server:latest .
```

### Run with Docker Compose

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Run database migrations
docker compose run --rm bot-server \
  sh -c "node_modules/.bin/prisma migrate deploy"

# Start the bot
docker compose up -d bot-server
```

### Run as standalone container

```bash
docker run -d \
  --name tempot-bot \
  --env-file .env \
  -p 3000:3000 \
  tempot-bot-server:latest
```

---

## 4. GitHub Container Registry (CI/CD)

The Docker workflow (`.github/workflows/docker.yml`) automatically builds and
pushes to GHCR on every push to `main` and on version tags.

### Pull and run the published image

```bash
docker pull ghcr.io/<owner>/tempot-bot-server:main

docker run -d \
  --name tempot-bot \
  --env-file .env \
  -p 3000:3000 \
  ghcr.io/<owner>/tempot-bot-server:main
```

### Automated deploy on new tag

Tag a release to trigger a versioned image build:
```bash
git tag v1.0.0
git push origin v1.0.0
```

This produces images tagged as `v1.0.0`, `1.0`, and `sha-<short>`.

---

## 5. Webhook Registration

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

---

## 6. Health Check

The bot-server exposes a health endpoint at `GET /health`. Expect `200 OK`
with `{"status":"ok"}` when the service is ready.

```bash
curl http://localhost:3000/health
```

---

## 7. Sentry Integration

1. Create a project at [sentry.io](https://sentry.io) or your self-hosted instance.
2. Set `TEMPOT_SENTRY=true` and `SENTRY_DSN=<your-dsn>` in `.env`.
3. Set `SENTRY_RELEASE` to the current Git SHA for release tracking:
   ```bash
   SENTRY_RELEASE=$(git rev-parse --short HEAD)
   ```
4. Restart the bot. Errors are captured automatically.

---

## 8. Database Connection Pool Tuning

The default pool size is **20 connections**. Adjust based on your database
server's `max_connections` limit:

```
# Rule of thumb: DATABASE_POOL_MAX = max_connections / number_of_replicas - 5
DATABASE_POOL_MAX=15
```

---

## 9. Rollback Procedure

```bash
# Stop the current container
docker stop tempot-bot

# Run the previous image
docker run -d --name tempot-bot --env-file .env \
  ghcr.io/<owner>/tempot-bot-server:sha-<previous-sha>

# If schema migration was applied, roll back:
pnpm --filter @tempot/database exec prisma migrate resolve \
  --rolled-back <migration-name>
```

---

## 10. Checklist Before Go-Live

- [ ] All required env vars filled in `.env`
- [ ] `prisma migrate deploy` completed with no pending migrations
- [ ] `GET /health` returns `200 OK`
- [ ] Webhook registered and `getWebhookInfo` shows no errors
- [ ] `SUPER_ADMIN_IDS` set to at least one valid Telegram user ID
- [ ] `BOT_TOKEN` and `WEBHOOK_SECRET_TOKEN` are not committed to version control
- [ ] `TEMPOT_SENTRY=true` and `SENTRY_DSN` set (optional but recommended)
- [ ] Docker image tagged with release version and pushed to registry
