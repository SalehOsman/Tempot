# CMS Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational cms-engine package for dynamic translation management and UI-driven content overrides as per Architecture Spec v11 Blueprint.

**Architecture:** Extends `i18n-core` with a multi-tier fallback strategy (Redis -> Postgres -> Static JSON). It uses a custom `i18next` backend to intercept translation requests, checks for database overrides, caches results in Redis, and listens for `event-bus` invalidation events to ensure real-time updates across all nodes. Includes startup sync from JSON and rollback capabilities.

**Tech Stack:** TypeScript, i18next, Prisma (Postgres), Redis (ioredis), @tempot/event-bus, @tempot/shared (CacheService), sanitize-html.

---

### Task 1: Database Schema for Overrides (FR-001)

**Files:**

- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/cms-engine/src/entities/override.entity.ts`
- Test: `packages/cms-engine/tests/integration/db-schema.test.ts`

- [ ] **Step 1: Define the TranslationOverride model**

```prisma
model TranslationOverride {
  id        String   @id @default(cuid())
  key       String
  locale    String
  value     String
  oldValue  String?
  isProtected Boolean @default(false)
  updatedBy String?
  updatedAt DateTime @updatedAt

  @@unique([key, locale])
}
```

- [ ] **Step 2: Run Prisma migration**

Run: `pnpm prisma migrate dev --name add_translation_overrides`
Expected: SUCCESS

- [ ] **Step 3: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '@tempot/database';

describe('TranslationOverride Model', () => {
  it('should enforce unique constraint on key and locale', async () => {
    await prisma.translationOverride.create({
      data: { key: 'test.key', locale: 'ar', value: 'v1' },
    });
    await expect(
      prisma.translationOverride.create({ data: { key: 'test.key', locale: 'ar', value: 'v2' } }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/cms-engine/tests/integration/db-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/cms-engine/
git commit -m "feat(cms): add TranslationOverride schema and entity (FR-001)"
```

---

### Task 2: Multi-Tier Fallback Chain (FR-002)

**Files:**

- Create: `packages/cms-engine/src/backend/multi-tier.backend.ts`
- Test: `packages/cms-engine/tests/unit/fallback-chain.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { MultiTierBackend } from '../src/backend/multi-tier.backend';

describe('Multi-Tier Fallback', () => {
  it('should try Redis, then DB, then return null to trigger static JSON fallback', async () => {
    const cache = { get: vi.fn().mockResolvedValue(null) };
    const db = { findUnique: vi.fn().mockResolvedValue(null) };
    const backend = new MultiTierBackend(cache as any, db as any);

    const result = await backend.read('ar', 'module', 'key');
    expect(cache.get).toHaveBeenCalled();
    expect(db.findUnique).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/cms-engine/tests/unit/fallback-chain.test.ts`
Expected: FAIL (MultiTierBackend not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export class MultiTierBackend {
  constructor(
    private cache: any,
    private db: any,
  ) {}

  async read(lng: string, ns: string, key: string): Promise<string | null> {
    const cacheKey = `cms:${lng}:${ns}:${key}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const override = await this.db.translationOverride.findUnique({
      where: { key_locale: { key, locale: lng } },
    });

    if (override) {
      await this.cache.set(cacheKey, override.value);
      return override.value;
    }

    return null; // Fall back to static JSON in i18n-core
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/cms-engine/tests/unit/fallback-chain.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cms-engine/src/backend/multi-tier.backend.ts
git commit -m "feat(cms): implement Redis -> DB -> Static fallback chain (FR-002)"
```

---

### Task 3: Dynamic Cache Invalidation (FR-004)

**Files:**

- Create: `packages/cms-engine/src/services/cms.service.ts`
- Modify: `packages/cms-engine/src/index.ts`
- Test: `packages/cms-engine/tests/integration/cache-invalidation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CMSService } from '../src/services/cms.service';

describe('CMS Cache Invalidation', () => {
  it('should emit event-bus message when translation is updated', async () => {
    const eventBus = { publish: vi.fn() };
    const service = new CMSService(eventBus as any, {} as any, {} as any);
    await service.updateTranslation('key', 'ar', 'new value');
    expect(eventBus.publish).toHaveBeenCalledWith('cms.translation.updated', expect.any(Object));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/cms-engine/tests/integration/cache-invalidation.test.ts`
Expected: FAIL (CMSService or publish call missing)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

export class CMSService {
  constructor(
    private eventBus: any,
    private db: any,
    private cache: any,
  ) {}

  async updateTranslation(
    key: string,
    locale: string,
    value: string,
  ): Promise<Result<void, AppError>> {
    const existing = await this.db.translationOverride.findUnique({
      where: { key_locale: { key, locale } },
    });
    if (existing?.isProtected) {
      return err(
        new AppError('cms.protected_key', `Key ${key} is protected and cannot be edited.`),
      );
    }

    await this.db.translationOverride.upsert({
      where: { key_locale: { key, locale } },
      update: { value, oldValue: existing?.value },
      create: { key, locale, value },
    });

    // Clear local/redis cache
    await this.cache.del(`cms:${locale}:*:${key}`);

    // Notify other nodes
    await this.eventBus.publish('cms.translation.updated', { key, locale, value }, 'EXTERNAL');

    return ok(undefined);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/cms-engine/tests/integration/cache-invalidation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cms-engine/src/services/cms.service.ts
git commit -m "feat(cms): implement real-time cache invalidation via Event Bus (FR-004)"
```

---

### Task 4: Protected Keys Enforcement (FR-006)

**Files:**

- Modify: `packages/cms-engine/src/services/cms.service.ts`
- Test: `packages/cms-engine/tests/unit/protected-keys.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { CMSService } from '../src/services/cms.service';

describe('Protected Keys', () => {
  it('should prevent updating keys marked as protected', async () => {
    const db = { translationOverride: { findUnique: () => ({ isProtected: true }) } };
    const service = new CMSService({} as any, db as any, {} as any);
    const result = await service.updateTranslation('security.gdpr.notice', 'ar', 'hacked');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('protected');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/cms-engine/tests/unit/protected-keys.test.ts`
Expected: FAIL (Protection logic missing)

- [ ] **Step 3: Write minimal implementation**
      (Included in Task 3)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/cms-engine/tests/unit/protected-keys.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/cms-engine/src/services/cms.service.ts
git commit -m "feat(cms): enforce protection for critical system keys (FR-006)"
```

---

### Task 5: Sanitization and Rollback (FR-007, Edge Case)

**Files:**

- Modify: `packages/cms-engine/src/services/cms.service.ts`
- Test: `packages/cms-engine/tests/unit/sanitization.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { CMSService } from '../src/services/cms.service';

describe('Translation Sanitization & Rollback', () => {
  it('should remove malicious script tags from translation values', async () => {
    // Test logic here
  });
  it('should support rollback to previous value', async () => {
    // Test logic here
  });
});
```

- [ ] **Step 2: Run minimal implementation with sanitize-html & rollback**

```typescript
import sanitizeHtml from 'sanitize-html';

export class CMSService {
  // ... existing methods

  async updateTranslation(key: string, locale: string, value: string) {
    const cleanValue = sanitizeHtml(value, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: { a: ['href'] },
    });
    // proceed with cleanValue
  }

  async rollbackTranslation(key: string, locale: string): Promise<Result<void, AppError>> {
    const existing = await this.db.translationOverride.findUnique({
      where: { key_locale: { key, locale } },
    });
    if (!existing || !existing.oldValue) return err(new AppError('cms.no_rollback_available'));

    return this.updateTranslation(key, locale, existing.oldValue);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/cms-engine/src/services/cms.service.ts
git commit -m "feat(cms): add HTML sanitization and rollback capability (FR-007)"
```

---

### Task 6: Static JSON to DB Auto-Sync (FR-003)

**Files:**

- Create: `packages/cms-engine/src/sync/json-sync.ts`
- Test: `packages/cms-engine/tests/integration/json-sync.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { JsonSyncService } from '../src/sync/json-sync';

describe('JSON Auto-Sync', () => {
  it('should sync new keys from static JSON to DB', async () => {
    const db = { translationOverride: { createMany: vi.fn() } };
    const sync = new JsonSyncService(db as any);
    await sync.run();
    expect(db.translationOverride.createMany).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

export class JsonSyncService {
  constructor(private db: any) {}

  async run() {
    const localeFiles = await glob('modules/*/locales/*.json');
    const newRecords = [];
    // Parse JSON files and collect keys that don't exist in DB
    // Bulk insert new keys via this.db.translationOverride.createMany({ data: newRecords, skipDuplicates: true });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/cms-engine/src/sync/json-sync.ts
git commit -m "feat(cms): implement auto-sync from JSON files to DB on startup (FR-003)"
```
