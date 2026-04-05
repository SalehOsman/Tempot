# Disaster Recovery Plan

> Reference: Spec v11, Section 18 and 26

---

## RTO / RPO Targets

| Service | RTO (Recovery Time) | RPO (Recovery Point) |
|---------|--------------------|--------------------|
| Bot (grammY) | < 5 minutes | 0 (stateless) |
| PostgreSQL | < 30 minutes | < 1 hour (daily backup) |
| Redis | < 2 minutes | 0 (reconstructable from DB) |
| Storage files | < 1 hour | < 24 hours |
| Full system | < 1 hour | < 1 hour |

---

## Scenario 1 — Bot Process Crash

**Symptoms:** Bot stops responding to messages. Telegram shows "bot is unavailable."

**Recovery steps:**

```bash
# 1. Check process status
docker ps | grep bot-server

# 2. View crash logs
docker logs tempot-bot --tail 100

# 3. Restart bot
docker compose restart bot-server

# 4. Verify recovery
curl https://your-domain.com/health
# Expected: { "status": "healthy" }

# 5. Send test message to bot
# Expected: bot responds normally
```

**Prevention:** Configure Docker `restart: unless-stopped` (already set in docker-compose.yml).

---

## Scenario 2 — PostgreSQL Failure

**Symptoms:** Bot responds to messages but cannot read/write data. Errors logged at ERROR level.

**Recovery steps:**

```bash
# 1. Check PostgreSQL status
docker ps | grep tempot-postgres
docker logs tempot-postgres --tail 50

# 2. If container is unhealthy — restart
docker compose restart postgres
# Wait for health check: docker inspect tempot-postgres | grep Status

# 3. If data corruption — restore from backup
pnpm backup:restore --service postgres --date YYYY-MM-DD

# 4. Run pending migrations
pnpm migrate

# 5. Restart bot to reconnect
docker compose restart bot-server

# 6. Verify health
curl https://your-domain.com/health
```

**RPO note:** Daily backups mean up to 24 hours of data loss in worst case. For critical deployments, configure continuous WAL archiving.

---

## Scenario 3 — Redis Failure

**Symptoms:** Sessions not loading from Redis. Cache misses on every request. BullMQ jobs not processing.

**Recovery steps:**

```bash
# 1. Check Redis status
docker ps | grep tempot-redis
docker logs tempot-redis --tail 50

# 2. Restart Redis
docker compose restart redis
# Sessions automatically reload from PostgreSQL on next request

# 3. Verify Redis is accepting connections
docker exec tempot-redis redis-cli ping
# Expected: PONG

# 4. BullMQ jobs resume automatically after Redis reconnects
# No manual intervention needed — ioredis auto-reconnects

# 5. Verify health
curl https://your-domain.com/health
```

**Zero RPO:** Redis is a cache — all data is reconstructable from PostgreSQL. No data is lost on Redis failure.

---

## Scenario 4 — Storage Provider Failure (Google Drive / S3)

**Symptoms:** File uploads fail. Document generation fails. `storage.upload_failed` errors in logs.

**Recovery steps:**

```bash
# 1. Switch to local storage temporarily
# In .env:
STORAGE_PROVIDER=local

# 2. Restart bot
docker compose restart bot-server

# 3. Investigate the provider issue
# For Google Drive: check API quotas at console.cloud.google.com
# For S3: check bucket permissions and endpoint availability

# 4. Re-upload pending files after provider is restored
pnpm storage:sync --direction local-to-remote

# 5. Switch back to cloud storage
STORAGE_PROVIDER=google-drive  # or s3
docker compose restart bot-server
```

---

## Scenario 5 — Complete Server Loss

**Symptoms:** Server is unreachable. All services down.

**Recovery steps:**

```bash
# On new server:

# 1. Clone repository
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot

# 2. Install dependencies
pnpm install

# 3. Restore .env from secure storage (1Password, AWS Secrets Manager, etc.)
# Copy .env to project root

# 4. Start infrastructure
pnpm docker:dev

# 5. Restore PostgreSQL backup
pnpm backup:restore --service postgres --latest

# 6. Run migrations to catch up
pnpm migrate

# 7. Start bot
pnpm dev  # or docker compose up for production

# 8. Update Telegram webhook URL if domain changed
pnpm webhook:set

# 9. Verify health
curl https://your-domain.com/health
```

**RTO:** < 1 hour with automated backup restore.

---

## Scenario 6 — Accidental Data Deletion

**Symptoms:** Users report missing data. Soft-delete is active but a hard delete was performed.

**Recovery steps:**

```bash
# 1. Check if data is soft-deleted (most likely)
# Via Prisma Studio or direct DB query:
SELECT * FROM invoices WHERE "isDeleted" = true AND id = 'affected-id';

# 2. Restore soft-deleted records
UPDATE invoices SET "isDeleted" = false, "deletedAt" = NULL, "deletedBy" = NULL
WHERE id = 'affected-id';

# 3. If hard-deleted — restore from backup
pnpm backup:restore --service postgres --date YYYY-MM-DD --table invoices

# 4. Audit the deletion
# Check Audit Log for the deletion event
SELECT * FROM audit_logs WHERE action LIKE '%.delete' AND "targetId" = 'affected-id';
```

---

## Backup Schedule

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| PostgreSQL full dump | Daily (02:00 Cairo time) | 30 days | Google Drive + Local |
| PostgreSQL full dump | Weekly (Sunday 03:00) | 90 days | Google Drive + S3 |
| Storage files | Daily (03:00 Cairo time) | 30 days | S3 |

Backups are encrypted before upload (AES-256). SUPER_ADMIN is notified immediately on backup failure.

---

## Backup Verification

Run monthly to confirm backups are restorable:

```bash
pnpm backup:verify --date YYYY-MM-DD
# Restores backup to a test container and runs validation queries
# Reports: record counts, data integrity checks, restoration time
```
