# Environment Variables Reference (`.env.example`)

> Complete reference guide for all environment variables, configuration flags, secrets, and provider settings in Tempot.

---

## 📋 Overview

Tempot reads configuration from environment variables defined in a `.env` file at the repository root. This document details all 8 configuration sections present in [`.env.example`](../../.env.example).

---

## Section 0 — Bot Instance Identity & Docker

| Variable | Default Value | Description |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | `tempot` | Docker Compose project namespace used to isolate containers, networks, and volumes. |
| `BOT_HTTP_HOST_PORT` | `3000` | Local machine port forwarded to Hono HTTP server (webhooks & health checks). |
| `POSTGRES_HOST_PORT` | `5432` | Local machine port forwarded to primary PostgreSQL 16 instance. |
| `RESTORE_POSTGRES_HOST_PORT` | `5433` | Local machine port forwarded to isolated restore rehearsal PostgreSQL instance. |
| `POSTGRES_USER` | `tempot` | Primary PostgreSQL database username. |
| `POSTGRES_PASSWORD` | `tempot_password` | Primary PostgreSQL database password. |
| `POSTGRES_DB` | `tempot_db` | Primary PostgreSQL database name. |
| `RESTORE_POSTGRES_USER` | `tempot` | Rehearsal PostgreSQL database username. |
| `RESTORE_POSTGRES_PASSWORD` | `tempot_password` | Rehearsal PostgreSQL database password. |
| `RESTORE_POSTGRES_DB` | `tempot_restore_db` | Rehearsal PostgreSQL database name. |

---

## Section 1 — Core System & Telegram Runtime

| Variable | Required? | Description |
|---|---|---|
| `BOT_TOKEN` | **Yes** | Telegram Bot API token obtained from [@BotFather](https://t.me/botfather). |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URI (`postgresql://tempot:tempot_password@localhost:5432/tempot_db`). |
| `REDIS_URL` | **Yes** | Redis connection URI for sessions, event bus, and queues (`redis://localhost:6379`). |
| `SUPER_ADMIN_IDS` | **Yes** | Comma-separated Telegram User IDs with permanent Super Admin privileges (`123456789,987654321`). |
| `BOT_MODE` | Optional | Operation mode: `polling` (default for local dev) or `webhook` (production). |
| `WEBHOOK_URL` | If Webhook | Public HTTPS URL where Telegram sends updates (`https://bot.example.com/api/telegram/webhook`). |
| `WEBHOOK_SECRET_TOKEN` | If Webhook | Secret token passed in `X-Telegram-Bot-Api-Secret-Token` header for request verification. |
| `TEMPOT_READINESS_TOKEN` | Optional | Token required to query internal `/health/readiness` probe endpoints. |
| `NODE_ENV` | Optional | Runtime environment: `development`, `test`, or `production`. |

---

## Section 2 — Internationalization & Region

| Variable | Default Value | Description |
|---|---|---|
| `DEFAULT_LANGUAGE` | `ar` | Default bot language: `ar` (Arabic) or `en` (English). |
| `DEFAULT_COUNTRY` | `EG` | Default ISO 3166-1 alpha-2 country code (`EG`, `SA`, `AE`, `KW`, `JO`). |
| `REGIONAL_MODE` | `static` | Regional parsing mode: `static` (pre-bundled data) or `dynamic`. |

---

## Section 3 — AI Engine & Vector Embeddings

| Variable | Default Value | Description |
|---|---|---|
| `TEMPOT_AI_PROVIDER` | `gemini` | Runtime chat AI provider: `gemini`, `openai`, or `deepseek`. |
| `AI_EMBEDDING_PROVIDER` | `gemini` | Text embedding provider: `gemini`, `openai`, or `ollama`. |
| `AI_EMBEDDING_MODEL` | `gemini-embedding-2-preview` | Model name for vector computation (e.g. `text-embedding-3-large`). |
| `AI_EMBEDDING_DIMENSIONS`| `3072` | Embedding vector dimensions (must match `AI_EMBEDDING_MODEL`). |
| `GEMINI_API_KEY` | If Gemini | Google Gemini API Key from Google AI Studio. |
| `OPENAI_API_KEY` | If OpenAI | OpenAI API Key. |
| `DEEPSEEK_API_KEY` | If DeepSeek | DeepSeek Chat API Key. |
| `OLLAMA_BASE_URL` | If Ollama | Local Ollama endpoint (`http://localhost:11434` or `http://host.docker.internal:11434`). |
| `TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD` | `0.70` | Cosine similarity threshold for AI-grounded help retrieval. |
| `TEMPOT_KNOWLEDGE_MAX_WRITE_CHUNKS` | `500` | Maximum document chunks allowed per single batch ingestion. |

---

## Section 4 — Pluggable Feature Flags (Toggle Guards)

Enable or disable specific packages at runtime (set to `false` to disable):

| Feature Flag | Default | Controlled Package |
|---|---|---|
| `TEMPOT_AUTH` | `true` | `@tempot/auth-core` (CASL RBAC) |
| `TEMPOT_SESSIONS` | `true` | `@tempot/session-manager` (Redis sessions) |
| `TEMPOT_NOTIFIER` | `true` | `@tempot/notifier` (Queue broadcasts) |
| `TEMPOT_LOGGER` | `true` | `@tempot/logger` (Pino logging) |
| `TEMPOT_AUDIT` | `true` | `@tempot/logger` AuditLogger |
| `TEMPOT_AI` | `true` | `@tempot/ai-core` (LLM & Embeddings) |
| `TEMPOT_STORAGE` | `true` | `@tempot/storage-engine` (File uploads) |
| `TEMPOT_BACKUP` | `true` | `@tempot/backup-engine` (Database dumps) |
| `TEMPOT_REGIONAL` | `true` | `@tempot/regional-engine` (Timezones & Currencies) |
| `TEMPOT_INPUT` | `true` | `@tempot/input-engine` (Interactive forms) |
| `TEMPOT_DYNAMIC_CMS` | `true` | `@tempot/cms-engine` (Dynamic texts) |
| `TEMPOT_SEARCH` | `true` | `@tempot/search-engine` (Full-text search) |
| `TEMPOT_DOCUMENTS` | `true` | `@tempot/document-engine` (PDF/Excel exports) |
| `TEMPOT_IMPORT` | `true` | `@tempot/import-engine` (Data imports) |
| `TEMPOT_SENTRY` | `false` | `@tempot/sentry` (Telemetry) |
| `TEMPOT_PAYMENT` | `false` | `@tempot/payment` (Payment integrations) |

---

## Section 5 — Observability & Telemetry

| Variable | Default Value | Description |
|---|---|---|
| `LOG_LEVEL` | `info` | Minimum log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. |
| `SENTRY_DSN` | Optional | Sentry DSN endpoint for production exception tracking. |

---

## Section 6 — Cloud Storage Providers

| Variable | Provider | Description |
|---|---|---|
| `STORAGE_PROVIDER` | — | Active storage provider: `local`, `google-drive`, or `s3`. |
| `STORAGE_LOCAL_PATH` | `local` | Relative directory path for local uploads (`./uploads`). |
| `GOOGLE_DRIVE_CLIENT_ID` | `google-drive` | Google OAuth2 Client ID. |
| `GOOGLE_DRIVE_CLIENT_SECRET`| `google-drive` | Google OAuth2 Client Secret. |
| `GOOGLE_DRIVE_REFRESH_TOKEN`| `google-drive` | Google OAuth2 Refresh Token. |
| `GOOGLE_DRIVE_FOLDER_ID` | `google-drive` | Target Google Drive Folder ID. |
| `S3_BUCKET` | `s3` | AWS S3 or Cloudflare R2 bucket name. |
| `S3_REGION` | `s3` | S3 region (e.g. `us-east-1` or `auto`). |
| `S3_ACCESS_KEY_ID` | `s3` | S3 Access Key ID. |
| `S3_SECRET_ACCESS_KEY` | `s3` | S3 Secret Access Key. |
| `S3_ENDPOINT` | `s3` | Custom S3 endpoint URL (for MinIO, R2, or DigitalOcean Spaces). |

---

## Section 6A — Disaster Recovery & Backup Settings

| Variable | Default Value | Description |
|---|---|---|
| `TEMPOT_BACKUP_STORAGE_PATH` | `/app/backups` | Directory where encrypted backup tarballs are stored. |
| `TEMPOT_BACKUP_RESTORE_DATABASE_URL` | — | Dedicated isolated PostgreSQL connection string for testing restore rehearsals. |
| `TEMPOT_BACKUP_RESTORE_FILES_PATH` | `/app/restore-rehearsals` | Staging path for rehearsal file extractions. |
| `TEMPOT_BACKUP_ENCRYPTION_KEY` | Optional | 256-bit AES encryption key for securing backup dumps. |
| `TEMPOT_BACKUP_FILENAME_TIME_ZONE` | `UTC` | Timezone formatting used in generated backup filenames. |
| `TEMPOT_BACKUP_ACTIVE_JOB_STALE_AFTER_MS` | `900000` | Stale timeout (15 mins) after which hanging backup jobs are failed. |

---

## Section 7 & 8 — Encryption & Protected Data

| Variable | Required? | Description |
|---|---|---|
| `PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION` | Optional | Active key version for encrypting classified identity fields. |
| `PROTECTED_DATA_ENCRYPTION_KEYS` | Optional | JSON map of key versions to 256-bit AES keys for seamless rotation. |
| `PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION` | Optional | Active version for generating HMAC exact-match lookup tokens. |
| `PROTECTED_DATA_LOOKUP_KEYS` | Optional | JSON map of HMAC lookup keys. |
