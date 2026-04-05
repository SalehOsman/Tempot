# Settings Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `@tempot/settings` package — a hybrid configuration system providing typed access to static environment variables (validated at startup) and dynamic database settings (CRUD with caching and event-driven updates), as specified in Architecture Spec v11 Section 11.1–11.2.

**Architecture:** A `SettingsService` facade that composes two sub-services: `StaticSettingsLoader` (reads and validates `.env` via zod at startup) and `DynamicSettingsService` (CRUD operations on a `Setting` Prisma model with cache-manager caching via `@tempot/shared` CacheService and event emission via `@tempot/event-bus`). The package is non-optional — no toggle guard.

**Tech Stack:** TypeScript Strict Mode 5.9.3, Prisma 7.x (ORM), cache-manager 6.x via `@tempot/shared` CacheService, neverthrow 8.2.0 (Result pattern), Pino 9.x via `@tempot/logger`, `@tempot/event-bus` (event emission), zod (`.env` validation), Vitest 4.1.0 + Testcontainers 8.0.1 (testing).

**Design Constraints:**

- Non-optional package — no `createToggleGuard` needed (Section 11, D3 in spec.md)
- All public methods return `Result<T, AppError>` via neverthrow 8.2.0 (Rule XXI)
- No `any` types anywhere (Rule I)
- Repository pattern — no direct Prisma calls in the SettingsService (Rule XIV)
- Event-driven — setting changes emit events via Event Bus (Rule XV)
- No thrown exceptions in public APIs
- Cache key pattern: `settings:{key}` with 5-minute TTL
- Error code pattern: `settings.{category}.{detail}` (hierarchical dot-notation)

---

### Shared Type Definitions

These interfaces are used across all tasks and must be defined in `src/settings.types.ts`:

```typescript
/** Static settings validated from .env at startup */
export interface StaticSettings {
  botToken: string;
  databaseUrl: string;
  superAdminIds: number[];
  defaultLanguage: string;
  defaultCountry: string;
}

/** Join mode for the bot */
export type JoinMode = 'AUTO' | 'REQUEST' | 'INVITE_ONLY' | 'CLOSED';

/** Known dynamic setting keys with their value types */
export interface DynamicSettingDefinitions {
  join_mode: JoinMode;
  maintenance_mode: boolean;
  approval_role: string;
  backup_schedule: string;
  log_retention_days: number;
  dynamic_default_language: string;
}

/** Type-safe dynamic setting key */
export type DynamicSettingKey = keyof DynamicSettingDefinitions;

/** Database entity for a dynamic setting */
export interface DynamicSettingRecord {
  key: string;
  value: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Event payload for setting changes */
export interface SettingChangedPayload {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string | null;
}

/** Event payload for maintenance mode toggle */
export interface MaintenanceModePayload {
  enabled: boolean;
  changedBy: string | null;
}

/** Maintenance status check result */
export interface MaintenanceStatus {
  enabled: boolean;
  isSuperAdmin: (userId: number) => boolean;
}

/** Default values for all dynamic settings */
export const DYNAMIC_SETTING_DEFAULTS: Record<DynamicSettingKey, unknown> = {
  join_mode: 'AUTO' as JoinMode,
  maintenance_mode: false,
  approval_role: '',
  backup_schedule: '',
  log_retention_days: 90,
  dynamic_default_language: '',
};
```

---

### Task 0: Package Scaffolding (10-Point Checklist)

**Goal:** Create the `packages/settings/` directory with all required infrastructure files, passing all 10 points of the package-creation-checklist before any feature code is written.

**Files:**

- Create: `packages/settings/.gitignore`
- Create: `packages/settings/tsconfig.json`
- Create: `packages/settings/package.json`
- Create: `packages/settings/vitest.config.ts`
- Create: `packages/settings/src/index.ts` (empty barrel)
- Create: `packages/settings/tests/unit/` (directory)
- Create: `packages/settings/tests/integration/` (directory)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p packages/settings/src packages/settings/tests/unit packages/settings/tests/integration
```

- [ ] **Step 2: Create `.gitignore`**

```
# Compiled output
dist/
src/**/*.js
src/**/*.d.ts
src/**/*.js.map
src/**/*.d.ts.map

# Dependencies
node_modules/

# Generated
*.tsbuildinfo

# Test artifacts
tests/**/*.js
tests/**/*.d.ts
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create `package.json`**

```json
{
  "name": "@tempot/settings",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "neverthrow": "8.2.0",
    "zod": "3.24.4",
    "@tempot/shared": "workspace:*",
    "@tempot/event-bus": "workspace:*",
    "@tempot/logger": "workspace:*"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0"
  },
  "peerDependencies": {
    "@prisma/client": "7.x"
  }
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
        },
      }),
    ],
  },
});
```

- [ ] **Step 6: Create `src/index.ts`** (empty barrel)

```typescript
// Barrel exports — populated as services are implemented
```

- [ ] **Step 7: Run 10-point package-creation-checklist**

Verify all 10 checks from `docs/developer/package-creation-checklist.md`:

1. `.gitignore` exists with required patterns ✓
2. `tsconfig.json` has `"outDir": "dist"` ✓
3. `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"` ✓
4. `package.json` has `"exports": { ".": "./dist/index.js" }` ✓
5. `package.json` has `"build": "tsc"` ✓
6. `vitest.config.ts` exists ✓
7. `vitest` version is exact `"4.1.0"` (no caret) ✓
8. No `console.*` in `src/` ✓ (empty barrel only)
9. No phantom dependencies ✓ (no imports yet)
10. No compiled artifacts in `src/` ✓ (clean workspace)

**DO NOT proceed to Task 1 until all 10 checks pass.**

- [ ] **Step 8: Commit**

```bash
git add packages/settings/
git commit -m "chore(settings): scaffold package — 10-point checklist passed"
```

---

### Task 1: Type Definitions and Error Codes

**Goal:** Define all shared types, interfaces, enums, and error codes used across the package.

**Files:**

- Create: `packages/settings/src/settings.types.ts`
- Create: `packages/settings/src/settings.errors.ts`
- Test: `packages/settings/tests/unit/settings.types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import {
  DYNAMIC_SETTING_DEFAULTS,
  type StaticSettings,
  type JoinMode,
  type DynamicSettingKey,
  type DynamicSettingRecord,
  type SettingChangedPayload,
  type MaintenanceStatus,
} from '../../src/settings.types';

describe('Settings Type Definitions', () => {
  it('should export DYNAMIC_SETTING_DEFAULTS with all known keys', () => {
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('join_mode', 'AUTO');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('maintenance_mode', false);
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('approval_role', '');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('backup_schedule', '');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('log_retention_days', 90);
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('dynamic_default_language', '');
  });

  it('should have 6 known dynamic setting keys', () => {
    expect(Object.keys(DYNAMIC_SETTING_DEFAULTS)).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Write `settings.types.ts`** with the interfaces from the Shared Type Definitions section above
- [ ] **Step 4: Write `settings.errors.ts`** with hierarchical error codes:

```typescript
/** Settings error codes — hierarchical per Rule XXII */
export const SETTINGS_ERRORS = {
  STATIC_MISSING_VARIABLE: 'settings.static.missing_variable',
  STATIC_INVALID_FORMAT: 'settings.static.invalid_format',
  STATIC_VALIDATION_FAILED: 'settings.static.validation_failed',
  DYNAMIC_NOT_FOUND: 'settings.dynamic.not_found',
  DYNAMIC_UNKNOWN_KEY: 'settings.dynamic.unknown_key',
  DYNAMIC_UPDATE_FAILED: 'settings.dynamic.update_failed',
  DYNAMIC_DELETE_FAILED: 'settings.dynamic.delete_failed',
  DYNAMIC_CREATE_FAILED: 'settings.dynamic.create_failed',
  CACHE_INVALIDATION_FAILED: 'settings.cache.invalidation_failed',
  REPOSITORY_ERROR: 'settings.repository.error',
} as const;
```

- [ ] **Step 5: Run test — expect PASS**
- [ ] **Step 6: Commit**

---

### Task 2: Static Settings Loader (.env Validation via Zod)

**Goal:** Implement startup-time validation of required environment variables with proper type parsing.

**Files:**

- Create: `packages/settings/src/static-settings.loader.ts`
- Test: `packages/settings/tests/unit/static-settings.loader.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StaticSettingsLoader } from '../../src/static-settings.loader';

describe('StaticSettingsLoader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load all required settings when present', () => {
    process.env.BOT_TOKEN = 'test-token';
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.SUPER_ADMIN_IDS = '123,456,789';
    process.env.DEFAULT_LANGUAGE = 'ar';
    process.env.DEFAULT_COUNTRY = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.botToken).toBe('test-token');
      expect(result.value.databaseUrl).toBe('postgresql://localhost/test');
      expect(result.value.superAdminIds).toEqual([123, 456, 789]);
      expect(result.value.defaultLanguage).toBe('ar');
      expect(result.value.defaultCountry).toBe('EG');
    }
  });

  it('should return error when BOT_TOKEN is missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.SUPER_ADMIN_IDS = '123';
    process.env.DEFAULT_LANGUAGE = 'ar';
    process.env.DEFAULT_COUNTRY = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('settings.static.validation_failed');
    }
  });

  it('should parse empty SUPER_ADMIN_IDS as empty array', () => {
    process.env.BOT_TOKEN = 'test-token';
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.SUPER_ADMIN_IDS = '';
    process.env.DEFAULT_LANGUAGE = 'ar';
    process.env.DEFAULT_COUNTRY = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([]);
    }
  });

  it('should return error for non-numeric SUPER_ADMIN_IDS', () => {
    process.env.BOT_TOKEN = 'test-token';
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.SUPER_ADMIN_IDS = 'abc,def';
    process.env.DEFAULT_LANGUAGE = 'ar';
    process.env.DEFAULT_COUNTRY = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('settings.static.validation_failed');
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Write `static-settings.loader.ts`** using zod for schema validation:

```typescript
import { z } from 'zod';
import { ok, err, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { StaticSettings } from './settings.types';
import { SETTINGS_ERRORS } from './settings.errors';

const superAdminIdsSchema = z.string().transform((val) => {
  if (!val || val.trim() === '') return [];
  const ids = val.split(',').map((s) => s.trim());
  const parsed = ids.map(Number);
  if (parsed.some(isNaN)) throw new Error('SUPER_ADMIN_IDS contains non-numeric values');
  return parsed;
});

const staticSettingsSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPER_ADMIN_IDS: superAdminIdsSchema,
  DEFAULT_LANGUAGE: z.string().min(1, 'DEFAULT_LANGUAGE is required').default('ar'),
  DEFAULT_COUNTRY: z.string().min(1, 'DEFAULT_COUNTRY is required').default('EG'),
});

export class StaticSettingsLoader {
  static load(): Result<StaticSettings, AppError> {
    const parsed = staticSettingsSchema.safeParse(process.env);
    if (!parsed.success) {
      return err(new AppError(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED, parsed.error.format()));
    }
    return ok({
      botToken: parsed.data.BOT_TOKEN,
      databaseUrl: parsed.data.DATABASE_URL,
      superAdminIds: parsed.data.SUPER_ADMIN_IDS,
      defaultLanguage: parsed.data.DEFAULT_LANGUAGE,
      defaultCountry: parsed.data.DEFAULT_COUNTRY,
    });
  }
}
```

- [ ] **Step 4: Run test — expect PASS**
- [ ] **Step 5: Commit**

---

### Task 3: Settings Repository (Database Abstraction)

**Goal:** Implement the repository layer for dynamic settings, abstracting Prisma access per Rule XIV.

**Files:**

- Create: `packages/settings/src/settings.repository.ts`
- Test: `packages/settings/tests/unit/settings.repository.test.ts`

- [ ] **Step 1: Write the failing test** (with mocked Prisma client)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SettingsRepository } from '../../src/settings.repository';

const mockPrismaClient = {
  setting: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
};

describe('SettingsRepository', () => {
  const repo = new SettingsRepository(mockPrismaClient as any);

  it('should find a setting by key', async () => {
    mockPrismaClient.setting.findUnique.mockResolvedValue({
      key: 'join_mode',
      value: '"AUTO"',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
    });

    const result = await repo.findByKey('join_mode');
    expect(result.isOk()).toBe(true);
  });

  it('should return ok(null) when setting not found', async () => {
    mockPrismaClient.setting.findUnique.mockResolvedValue(null);

    const result = await repo.findByKey('nonexistent');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it('should upsert a setting', async () => {
    mockPrismaClient.setting.upsert.mockResolvedValue({
      key: 'join_mode',
      value: '"CLOSED"',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
    });

    const result = await repo.upsert('join_mode', '"CLOSED"', null);
    expect(result.isOk()).toBe(true);
  });

  it('should delete a setting', async () => {
    mockPrismaClient.setting.delete.mockResolvedValue({
      key: 'join_mode',
      value: '"AUTO"',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
    });

    const result = await repo.deleteByKey('join_mode');
    expect(result.isOk()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Write `settings.repository.ts`**

```typescript
import { ok, err, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { DynamicSettingRecord } from './settings.types';
import { SETTINGS_ERRORS } from './settings.errors';

type AsyncResult<T> = Promise<Result<T, AppError>>;

export interface SettingsRepositoryPort {
  findByKey(key: string): AsyncResult<DynamicSettingRecord | null>;
  findAll(): AsyncResult<DynamicSettingRecord[]>;
  upsert(key: string, value: string, updatedBy: string | null): AsyncResult<DynamicSettingRecord>;
  deleteByKey(key: string): AsyncResult<DynamicSettingRecord>;
}

export class SettingsRepository implements SettingsRepositoryPort {
  constructor(private readonly prisma: { setting: Record<string, Function> }) {}

  async findByKey(key: string): AsyncResult<DynamicSettingRecord | null> {
    try {
      const result = await this.prisma.setting.findUnique({ where: { key } });
      return ok(result as DynamicSettingRecord | null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async findAll(): AsyncResult<DynamicSettingRecord[]> {
    try {
      const results = await this.prisma.setting.findMany();
      return ok(results as DynamicSettingRecord[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async upsert(
    key: string,
    value: string,
    updatedBy: string | null,
  ): AsyncResult<DynamicSettingRecord> {
    try {
      const result = await this.prisma.setting.upsert({
        where: { key },
        update: { value, updatedBy },
        create: { key, value, createdBy: updatedBy, updatedBy },
      });
      return ok(result as DynamicSettingRecord);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async deleteByKey(key: string): AsyncResult<DynamicSettingRecord> {
    try {
      const result = await this.prisma.setting.delete({ where: { key } });
      return ok(result as DynamicSettingRecord);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }
}
```

- [ ] **Step 4: Run test — expect PASS**
- [ ] **Step 5: Commit**

---

### Task 4: Dynamic Settings Service (CRUD + Cache + Events)

**Goal:** Implement the dynamic settings service with type-safe CRUD, cache-manager caching (5-min TTL, immediate invalidation), and event emission.

**Files:**

- Create: `packages/settings/src/dynamic-settings.service.ts`
- Test: `packages/settings/tests/unit/dynamic-settings.service.test.ts`

- [ ] **Step 1: Write the failing test**

Tests must cover:

- Get a known dynamic setting → returns value from DB (cache miss)
- Get a known dynamic setting again → returns from cache (no DB call)
- Update a setting → invalidates cache → emits `settings.setting.updated` event
- Get a setting with no DB row → returns default value
- Get an unknown key → returns error
- Maintenance mode toggle → emits `settings.maintenance.toggled` event in addition to `settings.setting.updated`

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Write `dynamic-settings.service.ts`**

Key design:

- Constructor takes: `SettingsRepositoryPort`, `CacheService`, `EventBusOrchestrator`, `Logger`
- `get<K extends DynamicSettingKey>(key: K)` → `AsyncResult<DynamicSettingDefinitions[K]>`
- `set<K extends DynamicSettingKey>(key: K, value: DynamicSettingDefinitions[K], updatedBy?)` → `AsyncResult<void>`
- `delete(key: DynamicSettingKey)` → `AsyncResult<void>`
- Cache key: `settings:{key}`, TTL: 300000ms (5 minutes)
- On `set()`: upsert DB → invalidate cache → emit `settings.setting.updated`
- On `set('maintenance_mode', ...)`: also emit `settings.maintenance.toggled`
- On `delete()`: delete DB → invalidate cache → emit `settings.setting.updated`

- [ ] **Step 4: Run test — expect PASS**
- [ ] **Step 5: Commit**

---

### Task 5: Maintenance Mode Helper

**Goal:** Provide a dedicated method for checking maintenance status and super admin bypass.

**Files:**

- Create: `packages/settings/src/maintenance.service.ts`
- Test: `packages/settings/tests/unit/maintenance.service.test.ts`

- [ ] **Step 1: Write the failing test**

Tests must cover:

- Maintenance disabled → status returns `{ enabled: false, isSuperAdmin: fn }`
- Maintenance enabled → status returns `{ enabled: true, isSuperAdmin: fn }`
- `isSuperAdmin(userId)` returns `true` for IDs in SUPER_ADMIN_IDS
- `isSuperAdmin(userId)` returns `false` for IDs not in SUPER_ADMIN_IDS

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Write `maintenance.service.ts`**

```typescript
import { ok, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { MaintenanceStatus, StaticSettings } from './settings.types';
import type { DynamicSettingsService } from './dynamic-settings.service';

type AsyncResult<T> = Promise<Result<T, AppError>>;

export class MaintenanceService {
  constructor(
    private readonly dynamicSettings: DynamicSettingsService,
    private readonly staticSettings: StaticSettings,
  ) {}

  async getStatus(): AsyncResult<MaintenanceStatus> {
    const enabledResult = await this.dynamicSettings.get('maintenance_mode');
    if (enabledResult.isErr()) {
      return ok({
        enabled: false,
        isSuperAdmin: (userId: number) => this.staticSettings.superAdminIds.includes(userId),
      });
    }

    return ok({
      enabled: enabledResult.value,
      isSuperAdmin: (userId: number) => this.staticSettings.superAdminIds.includes(userId),
    });
  }
}
```

- [ ] **Step 4: Run test — expect PASS**
- [ ] **Step 5: Commit**

---

### Task 6: Unified SettingsService Facade

**Goal:** Create the unified facade that composes static + dynamic + maintenance services.

**Files:**

- Create: `packages/settings/src/settings.service.ts`
- Test: `packages/settings/tests/unit/settings.service.test.ts`

- [ ] **Step 1: Write the failing test**

Tests must cover:

- `getStatic()` → returns `StaticSettings`
- `getDynamic(key)` → delegates to `DynamicSettingsService`
- `setDynamic(key, value)` → delegates to `DynamicSettingsService`
- `getMaintenanceStatus()` → delegates to `MaintenanceService`
- `isMaintenanceMode()` → returns boolean

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Write `settings.service.ts`**

Constructor takes all dependencies. Exposes:

- `getStatic(): Result<StaticSettings, AppError>` (sync — returns cached result from startup)
- `getDynamic<K>(key: K): AsyncResult<DynamicSettingDefinitions[K]>`
- `setDynamic<K>(key: K, value: DynamicSettingDefinitions[K], updatedBy?): AsyncResult<void>`
- `deleteDynamic(key: DynamicSettingKey): AsyncResult<void>`
- `getMaintenanceStatus(): AsyncResult<MaintenanceStatus>`

- [ ] **Step 4: Run test — expect PASS**
- [ ] **Step 5: Commit**

---

### Task 7: Prisma Schema Addition

**Goal:** Add the `Setting` model to the Prisma schema.

**Files:**

- Update: `packages/database/prisma/schema.prisma`
- Test: Prisma validation (`npx prisma validate`)

- [ ] **Step 1: Add Setting model**

```prisma
model Setting {
  key         String    @id
  value       String
  description String?

  // Audit fields (Constitution Rule XXVII)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String?
  updatedBy   String?

  @@map("settings")
}
```

Note: No `isDeleted`/`deletedAt`/`deletedBy` soft-delete fields — settings are hard-deleted (they return to defaults when no row exists, so soft-delete adds no value).

- [ ] **Step 2: Run `npx prisma validate`** — expect PASS
- [ ] **Step 3: Run `npx prisma generate`** — expect PASS
- [ ] **Step 4: Commit**

---

### Task 8: Event Registration

**Goal:** Register settings events in the `TempotEvents` interface.

**Files:**

- Update: `packages/event-bus/src/event-bus.events.ts`

- [ ] **Step 1: Add settings event types**

```typescript
// In TempotEvents interface:
'settings.setting.updated': SettingChangedPayload;
'settings.setting.created': SettingChangedPayload;
'settings.setting.deleted': SettingChangedPayload;
'settings.maintenance.toggled': MaintenanceModePayload;
```

- [ ] **Step 2: Verify build passes**
- [ ] **Step 3: Commit**

---

### Task 9: Barrel Exports (`src/index.ts`)

**Goal:** Export all public types, services, and constants.

**Files:**

- Update: `packages/settings/src/index.ts`

- [ ] **Step 1: Write barrel exports**

```typescript
// Types
export type {
  StaticSettings,
  JoinMode,
  DynamicSettingKey,
  DynamicSettingDefinitions,
  DynamicSettingRecord,
  SettingChangedPayload,
  MaintenanceModePayload,
  MaintenanceStatus,
} from './settings.types';
export { DYNAMIC_SETTING_DEFAULTS } from './settings.types';

// Error codes
export { SETTINGS_ERRORS } from './settings.errors';

// Services
export { StaticSettingsLoader } from './static-settings.loader';
export { SettingsRepository } from './settings.repository';
export type { SettingsRepositoryPort } from './settings.repository';
export { DynamicSettingsService } from './dynamic-settings.service';
export { MaintenanceService } from './maintenance.service';
export { SettingsService } from './settings.service';
```

- [ ] **Step 2: Run all tests — expect ALL PASS**
- [ ] **Step 3: Run 10-point checklist final verification**
- [ ] **Step 4: Commit**

---

### Task 10: Integration Tests (Testcontainers)

**Goal:** Test the full flow with a real PostgreSQL database.

**Files:**

- Create: `packages/settings/tests/integration/settings.integration.test.ts`

- [ ] **Step 1: Write integration test**

Tests must cover:

- Full flow: initialize → set a dynamic setting → read it → update it → verify cache invalidation → verify event emission
- First deployment: empty DB → all defaults returned
- Maintenance mode: enable → check status → disable → check status

- [ ] **Step 2: Run integration test — expect PASS**
- [ ] **Step 3: Commit**
