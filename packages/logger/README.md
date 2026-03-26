# @tempot/logger

> Pino 9.x structured logging + AuditLogger. First package to implement — zero internal dependencies.

## Purpose

- `AppLogger` — Pino-based structured JSON logger with 6 levels (TRACE → FATAL)
- `AuditLogger` — records all state-changing operations to the `audit_logs` table
- PII redaction via Pino `redact` option
- `loggedAt` flag on `AppError` prevents duplicate logging (ADR-034)
- Error Reference System — generates `ERR-YYYYMMDD-XXXX` codes linking user messages to Audit Log entries

## Phase

Phase 1 — Core Bedrock **(first package to implement — no internal dependencies)**

## Dependencies

| Package       | Purpose                              |
| ------------- | ------------------------------------ |
| `pino` 9.x    | Fastest Node.js JSON logger          |
| `pino-pretty` | Human-readable output in development |

> ⚠️ logger has **zero** `@tempot/*` dependencies — it is the foundation everything else builds on.

## API

```typescript
import { createLogger, AuditLogger } from '@tempot/logger';

// Application logger
const logger = createLogger({ level: process.env.LOG_LEVEL ?? 'info' });

logger.trace('Deep debug info');
logger.debug('Debug info');
logger.info('Normal operation');
logger.warn('Non-fatal warning');
logger.error(appError, 'Error context');
logger.fatal('System crash — shutting down');

// Audit logger
const auditLogger = new AuditLogger(prisma);

await auditLogger.log({
  userId: 'user-123',
  userRole: 'ADMIN',
  action: 'invoices.invoice.created',
  module: 'invoices',
  targetId: 'invoice-456',
  before: null,
  after: { id: 'invoice-456', amount: 1500 },
  status: 'SUCCESS',
});

// Error reference system
const refCode = auditLogger.generateRefCode(); // ERR-20260319-0042
```

## Log Levels

| Level   | When to use                                               |
| ------- | --------------------------------------------------------- |
| `TRACE` | Deep diagnostics — DB query details, cache hits/misses    |
| `DEBUG` | Development debugging                                     |
| `INFO`  | Normal operations — request received, job completed       |
| `WARN`  | Recoverable issues — Redis fallback active, retry attempt |
| `ERROR` | Operation failed — requires investigation                 |
| `FATAL` | System cannot continue — triggers `process.exit(1)`       |

## PII Redaction

Configured to redact sensitive fields before logging:

```typescript
const logger = createLogger({
  redact: ['password', 'token', 'secret', 'authorization', 'cookie'],
});
```

## ADRs

- ADR-034 — No double logging via `loggedAt` flag

## Status

✅ **Implemented** — Phase 1
