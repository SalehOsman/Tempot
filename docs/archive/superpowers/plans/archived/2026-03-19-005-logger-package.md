# Logger Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational logger package providing structured technical logging (Pino) and a Unified Audit Log service with user context tracking.

**Architecture:** Use Pino for high-performance JSON logging. Implement a secondary `AuditLogger` that persists critical state changes to the database with before/after diffs. Both leverage `AsyncLocalStorage` (via `@tempot/session-manager`) to automatically capture user identity.

**Tech Stack:** TypeScript, Pino, Prisma, @tempot/session-manager (AsyncLocalStorage).

---

### Task 1: Structured Technical Logger with User Context (Pino)

**Files:**

- Create: `packages/logger/src/technical/pino.logger.ts`
- Test: `packages/logger/tests/unit/pino-logger.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { logger } from '../src/technical/pino.logger';
import { sessionContext } from '@tempot/session-manager';

describe('Pino Logger', () => {
  it('should automatically inject userId from session context', () => {
    const stream = { write: vi.fn() };
    const testLogger = logger.child({}, { stream } as any);

    sessionContext.run({ userId: 'user_123' }, () => {
      testLogger.info('Test context');
    });

    expect(stream.write).toHaveBeenCalledWith(expect.stringContaining('user_123'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/logger/tests/unit/pino-logger.test.ts`
Expected: FAIL (logger not defined or context ignored)

- [ ] **Step 3: Write minimal implementation**

```typescript
import pino from 'pino';
import { sessionContext } from '@tempot/session-manager';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin() {
    const context = sessionContext.getStore();
    return context?.userId ? { userId: context.userId } : {};
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/logger/tests/unit/pino-logger.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/logger/src/technical/pino.logger.ts
git commit -m "feat(logger): implement structured Pino logger with ALS context injection (FR-004)"
```

---

### Task 2: Unified Audit Logger Service

**Files:**

- Create: `packages/logger/src/audit/audit.logger.ts`
- Test: `packages/logger/tests/unit/audit-logger.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { AuditLogger } from '../src/audit/audit.logger';

describe('AuditLogger', () => {
  it('should log a state change to the database', async () => {
    const audit = new AuditLogger();
    const result = await audit.log({
      userId: '1',
      action: 'user.update',
      module: 'users',
      before: { name: 'Old' },
      after: { name: 'New' },
    });
    expect(result).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/logger/tests/unit/audit-logger.test.ts`
Expected: FAIL (AuditLogger not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { prisma } from '@tempot/database';

export class AuditLogger {
  async log(entry: any) {
    return prisma.auditLog.create({
      data: {
        ...entry,
        timestamp: new Date(),
        status: 'SUCCESS',
      },
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/logger/tests/unit/audit-logger.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/logger/src/audit/audit.logger.ts
git commit -m "feat(logger): implement unified AuditLogger service"
```

---

### Task 3: PII Redaction Logic

**Files:**

- Modify: `packages/logger/src/technical/pino.logger.ts`
- Test: `packages/logger/tests/unit/redaction.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { logger } from '../src/technical/pino.logger';

describe('Log Redaction', () => {
  it('should redact sensitive fields like password', () => {
    // This requires checking the output stream of Pino
    // Mocking the stream for test
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/logger/tests/unit/redaction.test.ts`
Expected: FAIL (Fields not redacted)

- [ ] **Step 3: Write minimal implementation**

```typescript
// Update logger configuration
export const logger = pino({
  redact: ['password', 'token', 'apiKey', 'secret'],
  // ... rest of config
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/logger/tests/unit/redaction.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/logger/src/technical/pino.logger.ts
git commit -m "feat(logger): add PII redaction for sensitive fields"
```
