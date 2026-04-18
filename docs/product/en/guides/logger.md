---
title: Using the Logger Package
description: Practical guide to structured logging, audit trails, error serialization, and PII redaction in Tempot
tags:
  - guide
  - logger
  - observability
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## Overview

The `@tempot/logger` package provides two logging systems: a Pino-based technical logger for operational diagnostics and an `AuditLogger` for compliance-grade state tracking. This guide covers using both systems, configuring log levels, handling errors in logs, and understanding PII redaction.

## Using the Technical Logger

Import the pre-configured `logger` instance and call its level methods:

```typescript
import { logger } from '@tempot/logger';

logger.info({ msg: 'Order processed', orderId: 'ord_123' });
logger.warn({ msg: 'Cache miss', key: 'user:456' });
logger.error({ err: appError, msg: 'Payment failed' });
```

All output is structured JSON sent to stdout. The `userId` field is injected automatically from `sessionContext` when available, so you never need to pass it manually.

## Configuring Log Levels

Set the `LOG_LEVEL` environment variable to control output verbosity:

```bash
LOG_LEVEL=debug node dist/main.js
```

Available levels in ascending severity:

| Level   | Value | Typical Use                        |
| ------- | ----- | ---------------------------------- |
| `trace` | 10    | Request/response payloads          |
| `debug` | 20    | Development diagnostics            |
| `info`  | 30    | Normal operations (default)        |
| `warn`  | 40    | Recoverable issues                 |
| `error` | 50    | Operation failures                 |
| `fatal` | 60    | Unrecoverable errors, process exit |

Messages below the configured level are silently dropped by Pino with zero overhead.

## Logging Errors

Pass `AppError` instances through the `err` key to invoke the custom serializer:

```typescript
import { AppError } from '@tempot/shared';
import { logger } from '@tempot/logger';

const error = new AppError('invoices.creation_failed', {
  customerId: 'c_123',
  reason: 'duplicate',
});

logger.error({ err: error, msg: 'Invoice creation failed' });
```

The `appErrorSerializer` extracts `code`, `i18nKey`, `referenceCode`, and redacted `details` from the error. In non-production environments, the stack trace is included.

### No Double Logging

Once an `AppError` is serialized, its `loggedAt` field is stamped. If the same error is logged again (e.g., as it propagates up the call stack), the serializer returns a minimal stub:

```json
{ "message": "Already logged", "code": "invoices.creation_failed", "__redundant": true }
```

This prevents duplicate full-trace log entries for the same error.

## Using the Audit Logger

The `AuditLogger` persists state changes to the database for compliance tracking. Create an instance with an `AuditLogRepository`:

```typescript
import { AuditLogger, type AuditLogEntry } from '@tempot/logger';
import { AuditLogRepository } from '@tempot/database';

const auditLogRepo = new AuditLogRepository({ log: async () => {} });
const auditLogger = new AuditLogger(auditLogRepo);
```

Log state changes with before/after snapshots:

```typescript
const entry: AuditLogEntry = {
  action: 'invoices.invoice.update',
  module: 'invoices',
  targetId: 'inv_123',
  before: { status: 'DRAFT', amount: 400 },
  after: { status: 'SENT', amount: 500 },
};

const result = await auditLogger.log(entry);
if (result.isErr()) {
  logger.error({ err: result.error, msg: 'Audit log failed' });
}
```

The `userId` and `userRole` are read automatically from `sessionContext`. You can override them explicitly in the entry if needed.

### Reference Codes

For non-success audit entries, a reference code is auto-generated in the format `ERR-YYYYMMDD-XXXX`:

```typescript
const failedEntry: AuditLogEntry = {
  action: 'invoices.payment.process',
  module: 'invoices',
  status: 'FAILURE',
  // referenceCode auto-generated if not provided
};
```

This code links the audit record, the user-facing error message, and the Sentry event for traceability.

## Understanding PII Redaction

Sensitive data is stripped at two layers before it reaches log output.

### Layer 1 — Pino Redaction

Pino's native `redact` option replaces top-level values for keys in `SENSITIVE_KEYS`:

```typescript
import { SENSITIVE_KEYS } from '@tempot/logger';
// ['password', 'token', 'secret', 'apiKey', 'creditCard']
```

Any log call containing these keys at the top level produces `[Redacted]` in the output.

### Layer 2 — Error Serializer Redaction

The `appErrorSerializer` recursively walks `err.details` and replaces matching key values with `[REDACTED]`. This handles arbitrarily nested objects and arrays:

```typescript
// Input details:
{ user: { name: 'Alice', password: 's3cret', billing: { creditCard: '4111...' } } }

// Serialized output:
{ user: { name: 'Alice', password: '[REDACTED]', billing: { creditCard: '[REDACTED]' } } }
```

## Context Injection

The logger integrates with `sessionContext` from `@tempot/shared`. When middleware sets the session at the request boundary, both logging systems benefit:

- **Technical logger** — Pino's `mixin` adds `userId` to every log entry
- **Audit logger** — `AuditLogger.log()` reads `userId` and `userRole` for attribution

No explicit user data passing is required in your service code.

## Best Practices

- Always pass `AppError` via the `err` key, not as a string message
- Set `LOG_LEVEL` to `debug` in development and `info` or `warn` in production
- Use the audit logger for every state-changing operation, not just failures
- Never log raw sensitive data; rely on the two-layer redaction system
- Let `sessionContext` handle user attribution automatically
