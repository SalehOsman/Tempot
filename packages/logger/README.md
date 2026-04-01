# @tempot/logger

Pino 9.x structured logging and audit logging for the Tempot framework.

## Purpose

- **Technical logger** -- pre-configured Pino singleton with PII redaction, session-aware context injection, and `AppError` serialization.
- **Audit logger** -- persists state-changing operations to the database via `AuditLogRepository`.

## Exports

```typescript
// logger.config.ts
export const SENSITIVE_KEYS: string[];

// technical/error.serializer.ts
export const appErrorSerializer: (err: unknown) => unknown;

// technical/pino.logger.ts
export const logger: pino.Logger;

// audit/audit.logger.ts
export interface AuditLogEntry { ... }
export class AuditLogger { ... }
```

## Dependencies

| Package                   | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `pino` ^9.0.0             | Structured JSON logger                     |
| `neverthrow` 8.2.0        | Result pattern for error handling          |
| `@tempot/shared`          | `AppError`, `AsyncResult` types            |
| `@tempot/database`        | `AuditLogRepository` for audit persistence |
| `@tempot/session-manager` | `sessionContext` for user identity         |

## Technical Logger

The package exports a pre-configured Pino `logger` singleton. It reads `LOG_LEVEL` from the environment (defaults to `"info"`).

```typescript
import { logger } from '@tempot/logger';

logger.trace('Deep diagnostics');
logger.debug('Debug details');
logger.info({ orderId: 'abc-123' }, 'Order processed');
logger.warn('Retry attempt');
logger.error({ err: appError }, 'Operation failed');
logger.fatal('Unrecoverable failure');
```

### Session Context Mixin

The logger automatically injects `userId` from `sessionContext` into every log entry when a session store is active. No manual configuration needed.

### AppError Serializer

The custom `appErrorSerializer` handles `AppError` instances:

- **No double logging** -- if `err.loggedAt` is already set, emits a minimal `{ message, code, __redundant }` object instead of the full error.
- **Sets `loggedAt`** -- marks the error as logged to prevent downstream duplicates.
- **Redacts PII** -- recursively replaces values of sensitive keys in `err.details`.
- **Strips stack in production** -- `err.stack` is only included when `NODE_ENV !== 'production'`.

### PII Redaction

Sensitive fields are defined in `SENSITIVE_KEYS`:

```typescript
import { SENSITIVE_KEYS } from '@tempot/logger';
// ['password', 'token', 'secret', 'apiKey', 'creditCard']
```

Pino's built-in `redact` option uses these keys at the top level. The `appErrorSerializer` applies recursive redaction within `AppError.details`.

## Audit Logger

`AuditLogger` persists state-changing operations to the database. It accepts an `AuditLogRepository` (not a raw Prisma client).

```typescript
import { AuditLogger } from '@tempot/logger';

const auditLogger = new AuditLogger(auditLogRepository);

const result = await auditLogger.log({
  action: 'invoices.invoice.created',
  module: 'invoices',
  targetId: 'invoice-456',
  before: null,
  after: { id: 'invoice-456', amount: 1500 },
  status: 'SUCCESS',
});

if (result.isErr()) {
  // result.error is AppError with code 'logger.audit_log_failed'
}
```

### AuditLogEntry Interface

```typescript
interface AuditLogEntry {
  action: string;
  module: string;
  targetId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  status?: string; // defaults to 'SUCCESS'
  userId?: string; // falls back to sessionContext
  userRole?: string; // falls back to sessionContext
}
```

`userId` and `userRole` are automatically resolved from `sessionContext` when not provided explicitly.

## Log Levels

| Level   | When to use                                             |
| ------- | ------------------------------------------------------- |
| `trace` | Deep diagnostics -- DB query details, cache hits/misses |
| `debug` | Development debugging                                   |
| `info`  | Normal operations -- request received, job completed    |
| `warn`  | Recoverable issues -- retry attempts, fallback active   |
| `error` | Operation failed -- requires investigation              |
| `fatal` | System cannot continue                                  |

## Status

Phase 1 -- implemented.
