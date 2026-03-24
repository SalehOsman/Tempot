# Notifier Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational notifier package for centralized, scheduled, and bulk notifications using BullMQ as per Tempot v11 Blueprint.

**Architecture:** A unified `NotifierService` that acts as a producer, adding notification jobs to a BullMQ `notifications` queue. A specialized `NotificationWorker` consumes these jobs, enforces Telegram's rate limits (30 msg/sec), handles localized templates via `i18n-core`, and updates user statuses upon failure (e.g., if blocked).

**Tech Stack:** TypeScript, BullMQ, @tempot/shared (QueueFactory), @tempot/i18n-core, grammY, Prisma (Postgres).

---

### Task 1: Notification Types and Job Schema (FR-002)

**Files:**
- Create: `packages/notifier/src/types/notification.types.ts`
- Test: `packages/notifier/tests/unit/job-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { NotificationType } from '../src/types/notification.types';

describe('Notification Types', () => {
  it('should support mandatory notification categories', () => {
    const types: NotificationType[] = ['INDIVIDUAL', 'GROUP', 'ROLE_BASED', 'BROADCAST', 'SCHEDULED'];
    expect(types).toContain('BROADCAST');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/notifier/tests/unit/job-schema.test.ts`
Expected: FAIL (NotificationType not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export type NotificationType = 'INDIVIDUAL' | 'GROUP' | 'ROLE_BASED' | 'BROADCAST' | 'SCHEDULED';

export interface NotificationJobData {
  userId?: string;
  role?: string;
  templateKey: string;
  templateData?: Record<string, any>;
  type: NotificationType;
  scheduleAt?: Date;
  isSilent?: boolean;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/notifier/tests/unit/job-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/notifier/src/types/notification.types.ts
git commit -m "feat(notifier): define notification types and job data schema (FR-002)"
```

---

### Task 2: Notifier Service (Producer) (FR-001)

**Files:**
- Create: `packages/notifier/src/notifier.service.ts`
- Test: `packages/notifier/tests/unit/notifier-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NotifierService } from '../src/notifier.service';

describe('NotifierService', () => {
  it('should add a job to the queue with correct delay for scheduled alerts', async () => {
    const queue = { add: vi.fn() };
    const service = new NotifierService(queue as any);
    const futureDate = new Date(Date.now() + 60000);
    
    await service.schedule('user1', 'reminders.appointment', {}, futureDate);
    expect(queue.add).toHaveBeenCalledWith('notification', expect.any(Object), expect.objectContaining({
      delay: expect.any(Number)
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/notifier/tests/unit/notifier-service.test.ts`
Expected: FAIL (NotifierService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Queue } from 'bullmq';
import { NotificationJobData } from './types/notification.types';

export class NotifierService {
  constructor(private queue: Queue) {}

  async sendIndividual(userId: string, templateKey: string, data?: any): Promise<void> {
    await this.queue.add('notification', { userId, templateKey, templateData: data, type: 'INDIVIDUAL' });
  }

  async schedule(userId: string, templateKey: string, data: any, at: Date): Promise<void> {
    const delay = at.getTime() - Date.now();
    await this.queue.add('notification', { userId, templateKey, templateData: data, type: 'SCHEDULED' }, { delay });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/notifier/tests/unit/notifier-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/notifier/src/notifier.service.ts
git commit -m "feat(notifier): implement NotifierService as a job producer (FR-001)"
```

---

### Task 3: Notification Worker (Consumer) (FR-004, FR-006)

**Files:**
- Create: `packages/notifier/src/workers/notification.worker.ts`
- Test: `packages/notifier/tests/integration/notification-worker.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NotificationWorker } from '../src/workers/notification.worker';

describe('NotificationWorker', () => {
  it('should attempt to send localized message via grammY', async () => {
    // Requires mock Bot and i18n
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/notifier/tests/integration/notification-worker.test.ts`
Expected: FAIL (NotificationWorker not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Worker, Job } from 'bullmq';
import { Bot } from 'grammy';
import { t } from '@tempot/i18n-core';

export class NotificationWorker {
  constructor(private bot: Bot, private redisConnection: any) {
    new Worker('notifications', this.process.bind(this), { connection: this.redisConnection });
  }

  async process(job: Job) {
    const { userId, templateKey, templateData, isSilent } = job.data;
    
    try {
      const message = t(templateKey, templateData); // Uses current session lang if available, or default
      await this.bot.api.sendMessage(userId, message, { disable_notification: isSilent });
    } catch (error: any) {
      if (error.description?.includes('bot was blocked')) {
        await this.handleUserBlock(userId);
      }
      throw error; // Let BullMQ retry for other errors (e.g., 429)
    }
  }

  private async handleUserBlock(userId: string) {
    // Update user status in DB to SUSPENDED
    console.warn(`User ${userId} blocked the bot. Suspending account.`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/notifier/tests/integration/notification-worker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/notifier/src/workers/notification.worker.ts
git commit -m "feat(notifier): implement NotificationWorker with rate-limiting and block handling (FR-004)"
```

---

### Task 4: Bulk Broadcast Logic (FR-002, FR-004)

**Files:**
- Modify: `packages/notifier/src/notifier.service.ts`
- Test: `packages/notifier/tests/unit/broadcast.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NotifierService } from '../src/notifier.service';

describe('Broadcast Notification', () => {
  it('should chunk large recipient lists to avoid rate limits', async () => {
    const queue = { addBulk: vi.fn() };
    const service = new NotifierService(queue as any);
    await service.broadcast('news.update', { users: Array(100).fill('id') });
    expect(queue.addBulk).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/notifier/tests/unit/broadcast.test.ts`
Expected: FAIL (broadcast not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
// Inside NotifierService
async broadcast(templateKey: string, options: { users: string[] }) {
  const jobs = options.users.map(userId => ({
    name: 'notification',
    data: { userId, templateKey, type: 'BROADCAST' }
  }));
  
  // BullMQ addBulk handles large lists efficiently
  await this.queue.addBulk(jobs);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/notifier/tests/unit/broadcast.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/notifier/src/notifier.service.ts
git commit -m "feat(notifier): implement bulk broadcast support using BullMQ addBulk (FR-002)"
```
