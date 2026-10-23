# Environment Variables Reference & T3-Env Boot Validation

## 1. Overview
The **Tembot-v2 Platform** enforces strict boot-time environment validation via `@t3-oss/env-core@0.12.0` and `zod`.

If any required variable is missing, malformed, or fails semantic validation, the application process aborts immediately (Fail-Fast) with exit code 1.

---

## 2. Environment Variables Catalog

| Variable Name | Required | Default / Example | Purpose & Description |
| :--- | :---: | :--- | :--- |
| **`NODE_ENV`** | Yes | `development` / `production` | Active runtime environment mode |
| **`PORT`** | No | `3000` | Port for Hono HTTP gateway |
| **`DATABASE_URL`** | Yes | `postgresql://postgres:postgrespassword@localhost:5432/tembot` | PostgreSQL connection string |
| **`REDIS_URL`** | Yes | `redis://localhost:6379` | Redis connection string for BullMQ and sessions |
| **`TELEGRAM_BOT_TOKEN`** | Yes | `123456789:ABCdefGHI...` | Official Telegram Bot API Token from @BotFather |
| **`TELEGRAM_WEBHOOK_SECRET`**| Prod | `cryptographic-random-string` | Secret header token for webhook verification |
| **`BOT_RUNNER_MODE`** | No | `polling` (dev) / `webhook` (prod) | Active Telegram update receiver mode |
| **`CORS_ORIGIN`** | No | `http://localhost:5173` | Allowed origins for TMA and Admin Dashboard |
| **`S3_ENDPOINT`** | No | `http://localhost:9000` | MinIO or S3 endpoint for media storage |
| **`S3_ACCESS_KEY`** | No | `minioadmin` | S3 Access Key |
| **`S3_SECRET_KEY`** | No | `miniopassword` | S3 Secret Key |
| **`S3_BUCKET`** | No | `tembot-media` | S3 Storage Bucket Name |
| **`LOG_LEVEL`** | No | `info` / `debug` | Structured logging verbosity |

---

## 3. T3-Env Schema Definition (`packages/server-core/src/env.ts`)

```typescript
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
    BOT_RUNNER_MODE: z.enum(['polling', 'webhook']).default('polling'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
```
