---
title: Adding Logging to a Service
description: Step-by-step tutorial to add technical logging and audit trails to a Tempot service
tags:
  - tutorial
  - logger
  - observability
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
---

## Prerequisites

Before you begin, make sure you have:

- A working Tempot development environment (see [Getting Started](/en/tutorials/getting-started/))
- PostgreSQL running with the Tempot database migrated (audit logs are persisted)
- Basic understanding of the [Shared Package](/en/concepts/shared/) Result pattern

## Adding Logging to an Order Service

In this tutorial you will add structured technical logging and compliance audit trails to a service that processes orders.

### Step 1: Import the Technical Logger

The `logger` from `@tempot/logger` is a pre-configured Pino instance ready to use:

```typescript
import { logger } from '@tempot/logger';

logger.info({ msg: 'Order service initialized' });
```

All output is structured JSON. The `userId` is injected automatically when running inside a `sessionContext`.

### Step 2: Log Operations at the Right Level

Use appropriate log levels for different situations:

```typescript
import { AppError, type AsyncResult } from '@tempot/shared';
import { ok, err } from 'neverthrow';

async function processOrder(orderId: string): AsyncResult<string> {
  logger.info({ msg: 'Processing order', orderId });

  const validated = validateOrder(orderId);
  if (validated.isErr()) {
    logger.warn({ msg: 'Order validation failed', orderId });
    return validated;
  }

  logger.debug({ msg: 'Order validated, proceeding to payment', orderId });
  return ok(orderId);
}
```

Use `info` for normal operations, `warn` for recoverable issues, `debug` for development diagnostics, and `error` for failures.

### Step 3: Log Errors with the Custom Serializer

Pass `AppError` instances through the `err` key to activate PII redaction and reference code extraction:

```typescript
function validateOrder(orderId: string) {
  if (!orderId) {
    const error = new AppError('orders.validation_failed', {
      reason: 'missing_id',
    });
    logger.error({ err: error, msg: 'Order validation error' });
    return err(error);
  }
  return ok(orderId);
}
```

The serializer stamps `loggedAt` on the error, preventing duplicate full-trace entries if the same error is logged again upstream.

### Step 4: Set Up the Audit Logger

Create an `AuditLogger` to persist state changes for compliance:

```typescript
import { AuditLogger, type AuditLogEntry } from '@tempot/logger';
import { AuditLogRepository } from '@tempot/database';

const auditLogRepo = new AuditLogRepository({ log: async () => {} });
const auditLogger = new AuditLogger(auditLogRepo);
```

### Step 5: Log State Changes

Record before/after snapshots for every state-changing operation:

```typescript
async function updateOrderStatus(
  orderId: string,
  oldStatus: string,
  newStatus: string,
): AsyncResult<void> {
  const entry: AuditLogEntry = {
    action: 'orders.order.update',
    module: 'orders',
    targetId: orderId,
    before: { status: oldStatus },
    after: { status: newStatus },
  };

  const result = await auditLogger.log(entry);
  if (result.isErr()) {
    logger.error({ err: result.error, msg: 'Audit log failed' });
  }
  return result;
}
```

The `userId` and `userRole` are read from `sessionContext` automatically. For non-success entries, a reference code in the format `ERR-YYYYMMDD-XXXX` is auto-generated.

### Step 6: Use Session Context for Attribution

Wrap your request handler in `sessionContext.run()` so both loggers pick up the user identity:

```typescript
import { sessionContext } from '@tempot/shared';

async function handleRequest(userId: string) {
  sessionContext.run({ userId, userRole: 'USER' }, async () => {
    // All logger calls here automatically include userId
    await processOrder('ord_123');
    await updateOrderStatus('ord_123', 'PENDING', 'CONFIRMED');
  });
}
```

## What You Built

You created a service with:

- Structured JSON logging via Pino with automatic `userId` injection
- Error logging with PII redaction and double-logging prevention
- Compliance audit trails persisted to the database with before/after snapshots
- Automatic user attribution via `sessionContext`

## Next Steps

- Read the [Logger Concepts](/en/concepts/logger/) to understand the two-layer PII redaction system
- See the [Using the Logger Package](/en/guides/logger/) guide for advanced configuration
- Learn inter-module communication in the [Event Bus Tutorial](/en/tutorials/event-bus/)
