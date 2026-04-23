# @tempot/sentry

> Error monitoring integration via Sentry — opt-in, PII-filtered, with Telegram alerts.

## Purpose

Wraps `@sentry/node` in a Tempot-compatible interface with:

- **Opt-in activation** via `SENTRY_DSN` environment variable (Rule LV)
- **PII filtering** via `beforeSend` hook — no user data reaches Sentry
- **Toggle guard** — `TEMPOT_SENTRY=true/false` to enable/disable at runtime
- **Error reporter** — structured error reporting with `AppError` integration
- **Self-hosted support** — configurable DSN for self-hosted Sentry instances

## Phase

Infrastructure — built pre-methodology, integrated into bot-server.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@sentry/node` 8.x | Sentry SDK — ADR not required (standard monitoring) |
| `@tempot/shared` | AppError, toggle guard |
| `neverthrow` 8.2.0 | Result pattern |

## API

```typescript
import { initSentry, captureError, SentryReporter } from '@tempot/sentry';

// Initialize (only when SENTRY_DSN is set)
initSentry({ dsn: process.env.SENTRY_DSN });

// Report an error
captureError(appError);

// Use the reporter interface
const reporter = new SentryReporter();
reporter.report(appError);
```

## Exports

- `sentry.client` — initialization and configuration
- `sentry.constants` — configuration constants
- `sentry.errors` — Sentry-specific error codes
- `sentry.reporter` — structured error reporting
- `sentry.toggle` — runtime enable/disable guard
- `sentry.types` — TypeScript interfaces

## Status

✅ **Implemented** — Infrastructure (pre-methodology)
