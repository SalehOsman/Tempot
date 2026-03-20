# Risk Registry

> Reference: Spec v11, Section 26.3
> 24 identified risks with probability, impact, and mitigation plans.

---

## Risk Matrix Legend

| Rating | Probability | Impact |
|--------|-------------|--------|
| High | > 60% | System unavailable or data loss |
| Medium | 20–60% | Degraded functionality |
| Low | < 20% | Minor issues, workarounds available |

---

## Infrastructure Risks

### RISK-001 — Redis Outage
- **Probability:** Medium
- **Impact:** High (sessions lost, queues paused, cache misses)
- **Mitigation:** Redis Degradation Strategy (ADR-028) — automatic fallback to PostgreSQL for sessions, direct DB queries for cache, BullMQ pauses and resumes automatically
- **Alert:** SUPER_ADMIN notified immediately via bot message

### RISK-002 — PostgreSQL Outage
- **Probability:** Low
- **Impact:** High (all persistent data unavailable)
- **Mitigation:** Daily encrypted backups to Google Drive + S3; health check endpoint monitors DB latency; `service_healthy` condition in docker-compose prevents bot from starting without DB
- **Recovery:** See DISASTER-RECOVERY.md Scenario 2

### RISK-003 — Storage Provider Unavailability
- **Probability:** Low
- **Impact:** Medium (file uploads and document generation fail)
- **Mitigation:** Fallback to local storage via `STORAGE_PROVIDER=local`; document-engine events queued in BullMQ until provider recovers
- **Alert:** `storage.upload_failed` events trigger SUPER_ADMIN notification

### RISK-004 — Bot Process Crash
- **Probability:** Medium
- **Impact:** High (bot completely unresponsive)
- **Mitigation:** Docker `restart: unless-stopped`; global error boundary in grammY catches unhandled errors; Sentry captures crash context before exit
- **Recovery:** Automatic restart < 5 seconds

### RISK-005 — Disk Space Exhaustion
- **Probability:** Low
- **Impact:** High (PostgreSQL stops accepting writes)
- **Mitigation:** `/health` endpoint monitors free disk space; alert at 70% usage; backup retention policy automatically removes old backups; local uploads directory size-limited

---

## Security Risks

### RISK-006 — BOT_TOKEN Compromise
- **Probability:** Low
- **Impact:** High (attacker can impersonate bot, read all messages)
- **Mitigation:** Token stored only in `.env` (gitignored); gitleaks scans every commit; rotate token immediately via BotFather if compromised; webhook secret token validates webhook authenticity
- **Response:** Rotate token, audit Audit Log for unusual activity, notify users if data breach suspected

### RISK-007 — SQL Injection
- **Probability:** Very Low
- **Impact:** High (data breach, data loss)
- **Mitigation:** Prisma and Drizzle ORM prevent injection by default; no raw SQL in application code; `$queryRaw` only used with parameterised queries

### RISK-008 — XSS via User Input
- **Probability:** Low
- **Impact:** Medium (malicious content in bot messages or dashboard)
- **Mitigation:** sanitize-html strips all HTML from user inputs before processing (ADR-020); Zod validates all input schemas

### RISK-009 — Brute Force / Spam
- **Probability:** High
- **Impact:** Medium (API rate limit exhaustion, degraded performance)
- **Mitigation:** @grammyjs/ratelimiter limits messages per user (30/min); rate-limiter-flexible protects Hono API; SUPER_ADMIN alerted after 5 denied access attempts from same user

### RISK-010 — Privilege Escalation
- **Probability:** Very Low
- **Impact:** Critical (attacker gains SUPER_ADMIN access)
- **Mitigation:** SUPER_ADMIN role assigned only via `SUPER_ADMIN_IDS` env variable; no self-promotion mechanism exists; CASL `can('manage','all')` requires explicit SUPER_ADMIN role; role changes logged in Audit Log

### RISK-011 — API Key Leakage in Logs
- **Probability:** Low
- **Impact:** High (AI provider key exposed)
- **Mitigation:** Pino configured with PII redaction; API keys never logged; gitleaks scans for secrets; API keys stored encrypted in DB, not in code

---

## AI / Integration Risks

### RISK-012 — AI Provider Rate Limiting
- **Probability:** Medium (during high load)
- **Impact:** Medium (AI features unavailable temporarily)
- **Mitigation:** Circuit breaker after 5 failures (ADR-033); BullMQ queue retries with exponential backoff; graceful degradation to manual input (Constitution Rule XXXIII); SUPER_ADMIN notified when circuit opens

### RISK-013 — Embedding Model Change Breaking Search
- **Probability:** Low (deliberate decision)
- **Impact:** High (all existing search results meaningless)
- **Mitigation:** AI-REINDEXING-STRATEGY.md provides zero-downtime re-indexing procedure; mixing embeddings from different models prevented by configuration validation at startup

### RISK-014 — AI Provider Cost Overrun
- **Probability:** Medium
- **Impact:** Medium (unexpected billing)
- **Mitigation:** Embedding results cached in cache-manager for 24 hours; batch processing for non-urgent indexing (50% cost reduction); circuit breaker prevents runaway API calls; monitor usage via provider dashboard

### RISK-015 — Third-Party API Breaking Change
- **Probability:** Low (for major providers)
- **Impact:** Medium (AI features break until updated)
- **Mitigation:** Vercel AI SDK abstracts provider specifics (ADR-016); upgrading the SDK adapter restores compatibility without touching module code

---

## Data Risks

### RISK-016 — Accidental Mass Deletion
- **Probability:** Low
- **Impact:** High (bulk data loss)
- **Mitigation:** Soft delete by default (Constitution Rule XXVII); hard delete requires explicit `SUPER_ADMIN` action; bulk delete triggers immediate SUPER_ADMIN alert; Audit Log records before/after for every deletion

### RISK-017 — Session Data Loss
- **Probability:** Low
- **Impact:** Medium (active conversations interrupted)
- **Mitigation:** Dual session strategy (Redis + PostgreSQL); Redis failure automatically falls back to PostgreSQL sessions; schema versioning prevents corruption on bot updates

### RISK-018 — Translation Key Regression
- **Probability:** Medium (during module updates)
- **Impact:** Medium (UI shows raw keys instead of translated text)
- **Mitigation:** `pnpm cms:check` mandatory in CI/CD for every PR touching locales; missing keys blocked at PR level; fallback chain returns error key string (never crashes)

### RISK-019 — Backup Corruption
- **Probability:** Low
- **Impact:** High (unrestorable backup)
- **Mitigation:** `pnpm backup:verify` monthly validation; backups verified with checksum before upload; multiple backup destinations (Drive + S3 + local); SUPER_ADMIN alerted immediately on backup failure

---

## Operational Risks

### RISK-020 — Breaking Database Migration
- **Probability:** Medium (during active development)
- **Impact:** High (data loss or bot failure on deploy)
- **Mitigation:** Session Schema Versioning (Section 15.6); maintenance mode activated before breaking migrations; full backup required before any breaking change; ADR required for breaking schema changes (Constitution Rule XLVII)

### RISK-021 — Dependency Vulnerability
- **Probability:** Medium
- **Impact:** Variable (depends on vulnerability)
- **Mitigation:** `pnpm audit` on every push; gitleaks on every commit; Dependabot configured for automated PR on vulnerability patches; Constitution Rule XLVIII requires libraries with 500+ stars and active maintenance

### RISK-022 — Docker Image Vulnerability
- **Probability:** Medium
- **Impact:** Medium (container escape or privilege escalation)
- **Mitigation:** `ankane/pgvector:latest` and `redis:7-alpine` use minimal base images; production images built from `node:20-alpine`; regular `docker pull` to get latest patches

### RISK-023 — Configuration Drift Between Environments
- **Probability:** Medium
- **Impact:** Medium ("works on my machine" bugs)
- **Mitigation:** `.env.example` documents all required variables; `docker-compose.yml` standardises local infrastructure; `scripts/setup-dev.sh` automates new environment setup

### RISK-024 — Single Point of Failure — SUPER_ADMIN
- **Probability:** Low
- **Impact:** High (system unmanageable if only SUPER_ADMIN loses access)
- **Mitigation:** `SUPER_ADMIN_IDS` supports multiple IDs (comma-separated); Telegram account recovery available via Telegram support; backup SUPER_ADMIN ID stored securely
