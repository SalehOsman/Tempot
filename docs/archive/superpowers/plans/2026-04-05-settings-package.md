# Settings Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `@tempot/settings` — a hybrid configuration system with static `.env` validation (zod) and dynamic database settings (CRUD with cache-manager caching and Event Bus emission).

**Architecture:** A `SettingsService` facade composes `StaticSettingsLoader` (startup-time env validation), `DynamicSettingsService` (type-safe CRUD with 5-min cache TTL and event emission), and `MaintenanceService` (maintenance mode + super admin bypass). Non-optional package — no toggle guard.

**Tech Stack:** TypeScript 5.9.3, Prisma 7.x, cache-manager 6.x via CacheService, neverthrow 8.2.0, zod ^4.3.6, Pino 9.x via @tempot/logger, @tempot/event-bus, Vitest 4.1.0 + Testcontainers 8.0.1.

**Key References:**
- Spec: `specs/018-settings-package/spec.md`
- Design doc: `docs/superpowers/specs/2026-04-05-settings-design.md`
- Data model: `specs/018-settings-package/data-model.md`
- Constitution: `.specify/memory/constitution.md`
- Package checklist: `docs/developer/package-creation-checklist.md`

**Design Decisions (from design doc):**
- DC-1: ESM module format with `"type": "module"`, `.js` import extensions
- DC-2: No toggle guard (non-optional package)
- DC-3: `AppError(code, details?)` constructor
- DC-4: CacheService API: `get<T>`, `set<T>`, `del` — TTL in ms (300_000)
- DC-5: Inline event payloads in TempotEvents (no imports from settings)
- DC-6: Mapped type for DYNAMIC_SETTING_DEFAULTS (not `Record<K, unknown>`)
- DC-7: Typed `SettingDelegate`/`SettingsPrismaClient` interfaces (not `Function`)
- DC-8: No graceful shutdown (YAGNI)

---

## File Structure

```
packages/settings/
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts                      # Barrel exports
│   ├── settings.types.ts             # All interfaces, types, defaults
│   ├── settings.errors.ts            # SETTINGS_ERRORS constant
│   ├── static-settings.loader.ts     # Zod-based .env validation
│   ├── settings.repository.ts        # SettingsRepositoryPort + SettingsRepository
│   ├── dynamic-settings.service.ts   # CRUD + cache + events
│   ├── maintenance.service.ts        # Maintenance mode + super admin
│   └── settings.service.ts           # Unified facade
├── tests/
│   ├── unit/
│   │   ├── settings.types.test.ts
│   │   ├── static-settings.loader.test.ts
│   │   ├── settings.repository.test.ts
│   │   ├── dynamic-settings.service.test.ts
│   │   ├── maintenance.service.test.ts
│   │   └── settings.service.test.ts
│   └── integration/
│       └── settings.integration.test.ts

Modified files (outside packages/settings/):
├── packages/database/prisma/schema.prisma   # Add Setting model
└── packages/event-bus/src/event-bus.events.ts  # Add 4 settings events
```

---

### Task 0: Package Scaffolding

**Goal:** Create the `packages/settings/` directory with all infrastructure files, passing the 10-point package-creation-checklist.

**Files:**
- Create: `packages/settings/.gitignore`
- Create: `packages/settings/tsconfig.json`
- Create: `packages/settings/package.json`
- Create: `packages/settings/vitest.config.ts`
- Create: `packages/settings/src/index.ts`
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

Match session-manager pattern exactly (`./dist`, `./src`, `noEmit: false`, `src/**/*` include):

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create `package.json`**

Key differences from plan.md:
1. Add `"type": "module"` (DC-1)
2. Use `{ "import": ..., "types": ... }` exports pattern (DC-1)
3. `@prisma/client` as direct dependency, not peer (DC-7, session-manager convention)
4. zod `^4.3.6` (not 3.24.4 — matches all other packages)

```json
{
  "name": "@tempot/settings",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@prisma/client": "^7.5.0",
    "@tempot/shared": "workspace:*",
    "@tempot/event-bus": "workspace:*",
    "@tempot/logger": "workspace:*",
    "neverthrow": "8.2.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0"
  }
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

Match session-manager pattern with `serviceCoverageThresholds` import and integration test timeouts:

```typescript
import { defineConfig, defineProject } from 'vitest/config';
import { serviceCoverageThresholds } from '../../vitest.config.base';

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
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      thresholds: serviceCoverageThresholds,
    },
  },
});
```

- [ ] **Step 6: Create `src/index.ts`** (empty barrel)

```typescript
// Barrel exports — populated as services are implemented
```

- [ ] **Step 7: Run `pnpm install` from workspace root**

```bash
pnpm install
```

This registers the new package in the workspace. Verify it appears in `pnpm list --filter @tempot/settings`.

- [ ] **Step 8: Run the 10-point package-creation-checklist**

Verify all 10 points from `docs/developer/package-creation-checklist.md`:

1. `.gitignore` exists with required patterns
2. `tsconfig.json` has `"outDir": "dist"`
3. `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`
4. `package.json` has `"exports"` field
5. `package.json` has `"build": "tsc"`
6. `vitest.config.ts` exists
7. `vitest` version is exact `"4.1.0"` (no caret)
8. No `console.*` in `src/` (only empty barrel)
9. No phantom dependencies (no imports yet)
10. No compiled artifacts in `src/`

- [ ] **Step 9: Run `pnpm --filter @tempot/settings build` — expect PASS**

- [ ] **Step 10: Run `pnpm --filter @tempot/settings test` — expect PASS (0 tests)**

- [ ] **Step 11: Commit**

```bash
git add packages/settings/ pnpm-lock.yaml
git commit -m "chore(settings): scaffold package — 10-point checklist passed"
```

---

### Task 1: Type Definitions and Error Codes

**Goal:** Define all shared types, interfaces, and error codes used across the settings package.

**Files:**
- Create: `packages/settings/src/settings.types.ts`
- Create: `packages/settings/src/settings.errors.ts`
- Test: `packages/settings/tests/unit/settings.types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/settings/tests/unit/settings.types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  DYNAMIC_SETTING_DEFAULTS,
  type StaticSettings,
  type JoinMode,
  type DynamicSettingKey,
  type DynamicSettingDefinitions,
  type DynamicSettingRecord,
  type SettingChangedPayload,
  type MaintenanceModePayload,
  type MaintenanceStatus,
} from '../../src/settings.types.js';
import { SETTINGS_ERRORS } from '../../src/settings.errors.js';

describe('Settings Type Definitions', () => {
  it('should export DYNAMIC_SETTING_DEFAULTS with all 6 known keys', () => {
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('join_mode', 'AUTO');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('maintenance_mode', false);
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('approval_role', '');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('backup_schedule', '');
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('log_retention_days', 90);
    expect(DYNAMIC_SETTING_DEFAULTS).toHaveProperty('dynamic_default_language', '');
  });

  it('should have exactly 6 dynamic setting keys', () => {
    expect(Object.keys(DYNAMIC_SETTING_DEFAULTS)).toHaveLength(6);
  });

  it('should enforce type safety — defaults match DynamicSettingDefinitions', () => {
    // Type-level test: if this compiles, the mapped type is correct
    const joinMode: DynamicSettingDefinitions['join_mode'] = DYNAMIC_SETTING_DEFAULTS.join_mode;
    const maintenanceMode: DynamicSettingDefinitions['maintenance_mode'] = DYNAMIC_SETTING_DEFAULTS.maintenance_mode;
    const logRetention: DynamicSettingDefinitions['log_retention_days'] = DYNAMIC_SETTING_DEFAULTS.log_retention_days;
    expect(joinMode).toBe('AUTO');
    expect(maintenanceMode).toBe(false);
    expect(logRetention).toBe(90);
  });
});

describe('Settings Error Codes', () => {
  it('should export hierarchical error codes', () => {
    expect(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED).toBe('settings.static.validation_failed');
    expect(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY).toBe('settings.dynamic.unknown_key');
    expect(SETTINGS_ERRORS.REPOSITORY_ERROR).toBe('settings.repository.error');
    expect(SETTINGS_ERRORS.CACHE_INVALIDATION_FAILED).toBe('settings.cache.invalidation_failed');
  });

  it('should have all expected error codes', () => {
    const codes = Object.values(SETTINGS_ERRORS);
    expect(codes.length).toBeGreaterThanOrEqual(10);
    // All codes follow settings.{category}.{detail} pattern
    for (const code of codes) {
      expect(code).toMatch(/^settings\.\w+\.\w+$/);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm --filter @tempot/settings test
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Write `settings.types.ts`**

Create `packages/settings/src/settings.types.ts`:

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

/** Default values for all dynamic settings (type-safe via mapped type — DC-6) */
export const DYNAMIC_SETTING_DEFAULTS: { [K in DynamicSettingKey]: DynamicSettingDefinitions[K] } = {
  join_mode: 'AUTO',
  maintenance_mode: false,
  approval_role: '',
  backup_schedule: '',
  log_retention_days: 90,
  dynamic_default_language: '',
};
```

- [ ] **Step 4: Write `settings.errors.ts`**

Create `packages/settings/src/settings.errors.ts`:

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
  CACHE_READ_FAILED: 'settings.cache.read_failed',
  CACHE_INVALIDATION_FAILED: 'settings.cache.invalidation_failed',
  REPOSITORY_ERROR: 'settings.repository.error',
} as const;
```

- [ ] **Step 5: Run test — expect PASS**

```bash
pnpm --filter @tempot/settings test
```

Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/settings/src/settings.types.ts packages/settings/src/settings.errors.ts packages/settings/tests/unit/settings.types.test.ts
git commit -m "feat(settings): type definitions and error codes"
```

---

### Task 2: Static Settings Loader

**Goal:** Implement startup-time validation of required environment variables via zod, returning `Result<StaticSettings, AppError>`.

**Files:**
- Create: `packages/settings/src/static-settings.loader.ts`
- Test: `packages/settings/tests/unit/static-settings.loader.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/settings/tests/unit/static-settings.loader.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StaticSettingsLoader } from '../../src/static-settings.loader.js';
import { SETTINGS_ERRORS } from '../../src/settings.errors.js';

describe('StaticSettingsLoader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load all required settings when present', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '123,456,789';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

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
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '123';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });

  it('should return error when DATABASE_URL is missing', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['SUPER_ADMIN_IDS'] = '123';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });

  it('should parse empty SUPER_ADMIN_IDS as empty array', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([]);
    }
  });

  it('should return error for non-numeric SUPER_ADMIN_IDS', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = 'abc,def';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(SETTINGS_ERRORS.STATIC_VALIDATION_FAILED);
    }
  });

  it('should parse single SUPER_ADMIN_ID correctly', () => {
    process.env['BOT_TOKEN'] = 'test-token';
    process.env['DATABASE_URL'] = 'postgresql://localhost/test';
    process.env['SUPER_ADMIN_IDS'] = '42';
    process.env['DEFAULT_LANGUAGE'] = 'ar';
    process.env['DEFAULT_COUNTRY'] = 'EG';

    const result = StaticSettingsLoader.load();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.superAdminIds).toEqual([42]);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm --filter @tempot/settings test
```

Expected: FAIL — `static-settings.loader` module not found.

- [ ] **Step 3: Write `static-settings.loader.ts`**

Create `packages/settings/src/static-settings.loader.ts`:

**Important:** zod v4 has a slightly different API for `.transform()`. The `safeParse` method still exists. The `z.string().min(1)` pattern works the same. Use `z.string().transform()` for SUPER_ADMIN_IDS parsing.

```typescript
import { z } from 'zod';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { StaticSettings } from './settings.types.js';
import { SETTINGS_ERRORS } from './settings.errors.js';

const superAdminIdsSchema = z.string().transform((val) => {
  if (!val || val.trim() === '') return [];
  const parts = val.split(',').map((s) => s.trim());
  const parsed = parts.map(Number);
  if (parsed.some(isNaN)) {
    throw new Error('SUPER_ADMIN_IDS contains non-numeric values');
  }
  return parsed;
});

const staticSettingsSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPER_ADMIN_IDS: superAdminIdsSchema,
  DEFAULT_LANGUAGE: z.string().min(1, 'DEFAULT_LANGUAGE is required'),
  DEFAULT_COUNTRY: z.string().min(1, 'DEFAULT_COUNTRY is required'),
});

export class StaticSettingsLoader {
  static load(env: Record<string, string | undefined> = process.env): Result<StaticSettings, AppError> {
    const parsed = staticSettingsSchema.safeParse(env);
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

**Note:** The `env` parameter defaults to `process.env` but can be overridden for testing. The tests use `process.env` directly (matching spec behavior).

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm --filter @tempot/settings test
```

Expected: All tests pass (6 new + 5 from Task 1).

- [ ] **Step 5: Commit**

```bash
git add packages/settings/src/static-settings.loader.ts packages/settings/tests/unit/static-settings.loader.test.ts
git commit -m "feat(settings): static settings loader with zod validation"
```

---

### Task 3: Settings Repository

**Goal:** Implement the Prisma repository for dynamic settings with typed interfaces (DC-7), abstracting DB access per Rule XIV.

**Files:**
- Create: `packages/settings/src/settings.repository.ts`
- Test: `packages/settings/tests/unit/settings.repository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/settings/tests/unit/settings.repository.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsRepository } from '../../src/settings.repository.js';
import { SETTINGS_ERRORS } from '../../src/settings.errors.js';
import type { SettingsPrismaClient } from '../../src/settings.repository.js';

function createMockPrismaClient(): SettingsPrismaClient {
  return {
    setting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('SettingsRepository', () => {
  let mockPrisma: SettingsPrismaClient;
  let repo: SettingsRepository;

  const mockRecord = {
    key: 'join_mode',
    value: '"AUTO"',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repo = new SettingsRepository(mockPrisma);
  });

  describe('findByKey', () => {
    it('should return the setting when found', async () => {
      vi.mocked(mockPrisma.setting.findUnique).mockResolvedValue(mockRecord);

      const result = await repo.findByKey('join_mode');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockRecord);
      }
      expect(mockPrisma.setting.findUnique).toHaveBeenCalledWith({ where: { key: 'join_mode' } });
    });

    it('should return ok(null) when setting not found', async () => {
      vi.mocked(mockPrisma.setting.findUnique).mockResolvedValue(null);

      const result = await repo.findByKey('nonexistent');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it('should return err on Prisma error', async () => {
      vi.mocked(mockPrisma.setting.findUnique).mockRejectedValue(new Error('DB connection lost'));

      const result = await repo.findByKey('join_mode');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.REPOSITORY_ERROR);
      }
    });
  });

  describe('findAll', () => {
    it('should return all settings', async () => {
      vi.mocked(mockPrisma.setting.findMany).mockResolvedValue([mockRecord]);

      const result = await repo.findAll();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe('upsert', () => {
    it('should upsert a setting', async () => {
      const updated = { ...mockRecord, value: '"CLOSED"' };
      vi.mocked(mockPrisma.setting.upsert).mockResolvedValue(updated);

      const result = await repo.upsert('join_mode', '"CLOSED"', 'admin-1');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe('"CLOSED"');
      }
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'join_mode' },
        update: { value: '"CLOSED"', updatedBy: 'admin-1' },
        create: { key: 'join_mode', value: '"CLOSED"', createdBy: 'admin-1', updatedBy: 'admin-1' },
      });
    });

    it('should return err on Prisma error', async () => {
      vi.mocked(mockPrisma.setting.upsert).mockRejectedValue(new Error('constraint violation'));

      const result = await repo.upsert('join_mode', '"CLOSED"', null);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.REPOSITORY_ERROR);
      }
    });
  });

  describe('deleteByKey', () => {
    it('should delete a setting', async () => {
      vi.mocked(mockPrisma.setting.delete).mockResolvedValue(mockRecord);

      const result = await repo.deleteByKey('join_mode');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.key).toBe('join_mode');
      }
    });

    it('should return err on Prisma error', async () => {
      vi.mocked(mockPrisma.setting.delete).mockRejectedValue(new Error('record not found'));

      const result = await repo.deleteByKey('nonexistent');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.REPOSITORY_ERROR);
      }
    });
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm --filter @tempot/settings test
```

Expected: FAIL — `settings.repository` module not found.

- [ ] **Step 3: Write `settings.repository.ts`**

Create `packages/settings/src/settings.repository.ts`. Uses typed `SettingDelegate` and `SettingsPrismaClient` interfaces (DC-7) instead of `Record<string, Function>`. Imports `AsyncResult` from `@tempot/shared`.

```typescript
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { DynamicSettingRecord } from './settings.types.js';
import { SETTINGS_ERRORS } from './settings.errors.js';

/** Typed Prisma delegate for the Setting model (DC-7) */
export interface SettingDelegate {
  findUnique(args: { where: { key: string } }): Promise<DynamicSettingRecord | null>;
  findMany(): Promise<DynamicSettingRecord[]>;
  upsert(args: {
    where: { key: string };
    create: { key: string; value: string; createdBy: string | null; updatedBy: string | null };
    update: { value: string; updatedBy: string | null };
  }): Promise<DynamicSettingRecord>;
  delete(args: { where: { key: string } }): Promise<DynamicSettingRecord>;
}

/** Typed Prisma client subset for settings (DC-7) */
export interface SettingsPrismaClient {
  setting: SettingDelegate;
}

/** Port interface for settings repository (Rule XIV) */
export interface SettingsRepositoryPort {
  findByKey(key: string): AsyncResult<DynamicSettingRecord | null>;
  findAll(): AsyncResult<DynamicSettingRecord[]>;
  upsert(key: string, value: string, updatedBy: string | null): AsyncResult<DynamicSettingRecord>;
  deleteByKey(key: string): AsyncResult<DynamicSettingRecord>;
}

/** Prisma-based repository for dynamic settings */
export class SettingsRepository implements SettingsRepositoryPort {
  constructor(private readonly prisma: SettingsPrismaClient) {}

  async findByKey(key: string): AsyncResult<DynamicSettingRecord | null> {
    try {
      const result = await this.prisma.setting.findUnique({ where: { key } });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async findAll(): AsyncResult<DynamicSettingRecord[]> {
    try {
      const results = await this.prisma.setting.findMany();
      return ok(results);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async upsert(key: string, value: string, updatedBy: string | null): AsyncResult<DynamicSettingRecord> {
    try {
      const result = await this.prisma.setting.upsert({
        where: { key },
        update: { value, updatedBy },
        create: { key, value, createdBy: updatedBy, updatedBy },
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async deleteByKey(key: string): AsyncResult<DynamicSettingRecord> {
    try {
      const result = await this.prisma.setting.delete({ where: { key } });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm --filter @tempot/settings test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/settings/src/settings.repository.ts packages/settings/tests/unit/settings.repository.test.ts
git commit -m "feat(settings): repository with typed Prisma client interface"
```

---

### Task 4: Dynamic Settings Service

**Goal:** Implement the dynamic settings service with type-safe CRUD, cache-manager caching (5-min TTL, immediate invalidation), event emission, JSON serialization, and graceful degradation.

**Files:**
- Create: `packages/settings/src/dynamic-settings.service.ts`
- Test: `packages/settings/tests/unit/dynamic-settings.service.test.ts`

**Key design points:**
- Constructor takes: `SettingsRepositoryPort`, `CacheService`, `EventBusOrchestrator`, `Logger`
- `get<K>(key)`: cache → DB → default. JSON.parse for deserialization.
- `set<K>(key, value, updatedBy?)`: check if key existed → upsert → JSON.stringify → invalidate cache → emit created/updated event (+ maintenance.toggled if maintenance_mode)
- `delete(key)`: get old value → delete → invalidate cache → emit deleted event
- Cache failure fallback: if cache fails, fall through to DB directly (NFR-005)
- DB failure fallback: return DYNAMIC_SETTING_DEFAULTS[key] (NFR-004)

- [ ] **Step 1: Write the failing test**

Create `packages/settings/tests/unit/dynamic-settings.service.test.ts`:

The test needs mocks for: `SettingsRepositoryPort`, `CacheService`, `EventBusOrchestrator`, and a logger.

Test cases:
1. `get()` — cache hit returns cached value (no DB call)
2. `get()` — cache miss, DB hit returns parsed JSON value and populates cache
3. `get()` — cache miss, DB miss returns DYNAMIC_SETTING_DEFAULTS[key]
4. `get()` — cache failure, falls through to DB (NFR-005)
5. `get()` — DB failure returns DYNAMIC_SETTING_DEFAULTS[key] (NFR-004)
6. `get()` — unknown key returns error
7. `set()` — upserts DB, invalidates cache, emits `settings.setting.updated`
8. `set()` — new key emits `settings.setting.created` instead
9. `set('maintenance_mode', true)` — additionally emits `settings.maintenance.toggled`
10. `delete()` — deletes DB, invalidates cache, emits `settings.setting.deleted`
11. Event emission failure does not fail the write operation

Write comprehensive tests covering all 11 cases. Each test must use `vi.fn()` mocks and verify exact method calls.

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm --filter @tempot/settings test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `dynamic-settings.service.ts`**

Create `packages/settings/src/dynamic-settings.service.ts`:

```typescript
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { CacheService } from '@tempot/shared';
import type { EventBusOrchestrator } from '@tempot/event-bus';
import type { Logger } from 'pino';
import type {
  DynamicSettingKey,
  DynamicSettingDefinitions,
} from './settings.types.js';
import { DYNAMIC_SETTING_DEFAULTS } from './settings.types.js';
import type { SettingsRepositoryPort } from './settings.repository.js';
import { SETTINGS_ERRORS } from './settings.errors.js';

const CACHE_PREFIX = 'settings:';
const CACHE_TTL_MS = 300_000; // 5 minutes

const VALID_KEYS = new Set<string>(Object.keys(DYNAMIC_SETTING_DEFAULTS));

export class DynamicSettingsService {
  constructor(
    private readonly repository: SettingsRepositoryPort,
    private readonly cache: CacheService,
    private readonly eventBus: EventBusOrchestrator,
    private readonly logger: Logger,
  ) {}

  async get<K extends DynamicSettingKey>(key: K): AsyncResult<DynamicSettingDefinitions[K]> {
    if (!VALID_KEYS.has(key)) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY, { key }));
    }

    // Try cache first
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheResult = await this.cache.get<string>(cacheKey);

    if (cacheResult.isOk() && cacheResult.value != null) {
      return ok(JSON.parse(cacheResult.value) as DynamicSettingDefinitions[K]);
    }

    // Cache miss or cache failure — fall through to DB (NFR-005)
    if (cacheResult.isErr()) {
      this.logger.warn({ key, error: cacheResult.error.code }, 'Cache read failed, falling through to DB');
    }

    // Try DB
    const dbResult = await this.repository.findByKey(key);

    if (dbResult.isErr()) {
      // DB failure — return default (NFR-004)
      this.logger.warn({ key, error: dbResult.error.code }, 'DB read failed, returning default');
      return ok(DYNAMIC_SETTING_DEFAULTS[key]);
    }

    if (dbResult.value === null) {
      // No row — return default
      return ok(DYNAMIC_SETTING_DEFAULTS[key]);
    }

    // Parse JSON from DB value
    const parsedValue = JSON.parse(dbResult.value.value) as DynamicSettingDefinitions[K];

    // Populate cache (best-effort)
    const setCacheResult = await this.cache.set(cacheKey, dbResult.value.value, CACHE_TTL_MS);
    if (setCacheResult.isErr()) {
      this.logger.warn({ key }, 'Failed to populate cache after DB read');
    }

    return ok(parsedValue);
  }

  async set<K extends DynamicSettingKey>(
    key: K,
    value: DynamicSettingDefinitions[K],
    updatedBy: string | null = null,
  ): AsyncResult<void> {
    if (!VALID_KEYS.has(key)) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY, { key }));
    }

    const serializedValue = JSON.stringify(value);

    // Check if key existed before (for created vs updated discrimination)
    const existingResult = await this.repository.findByKey(key);
    const existed = existingResult.isOk() && existingResult.value !== null;
    const oldValue = existed && existingResult.isOk()
      ? JSON.parse(existingResult.value!.value)
      : DYNAMIC_SETTING_DEFAULTS[key];

    // Upsert DB
    const upsertResult = await this.repository.upsert(key, serializedValue, updatedBy);
    if (upsertResult.isErr()) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UPDATE_FAILED, upsertResult.error));
    }

    // Invalidate cache
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const delResult = await this.cache.del(cacheKey);
    if (delResult.isErr()) {
      this.logger.warn({ key }, 'Cache invalidation failed after set');
    }

    // Emit events (fire-and-forget — failures logged, not propagated)
    try {
      const eventName = existed ? 'settings.setting.updated' : 'settings.setting.created';
      await this.eventBus.publish(eventName, {
        key,
        oldValue,
        newValue: value,
        changedBy: updatedBy,
      });

      // Additional event for maintenance mode
      if (key === 'maintenance_mode') {
        await this.eventBus.publish('settings.maintenance.toggled', {
          enabled: value as boolean,
          changedBy: updatedBy,
        });
      }
    } catch (error: unknown) {
      this.logger.warn({ key, error }, 'Event emission failed after set');
    }

    return ok(undefined);
  }

  async delete(key: DynamicSettingKey, deletedBy: string | null = null): AsyncResult<void> {
    if (!VALID_KEYS.has(key)) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY, { key }));
    }

    // Get old value for event payload
    const existingResult = await this.repository.findByKey(key);
    const oldValue = existingResult.isOk() && existingResult.value !== null
      ? JSON.parse(existingResult.value.value)
      : DYNAMIC_SETTING_DEFAULTS[key];

    // Delete from DB
    const deleteResult = await this.repository.deleteByKey(key);
    if (deleteResult.isErr()) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_DELETE_FAILED, deleteResult.error));
    }

    // Invalidate cache
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const delResult = await this.cache.del(cacheKey);
    if (delResult.isErr()) {
      this.logger.warn({ key }, 'Cache invalidation failed after delete');
    }

    // Emit event (fire-and-forget)
    try {
      await this.eventBus.publish('settings.setting.deleted', {
        key,
        oldValue,
        newValue: DYNAMIC_SETTING_DEFAULTS[key],
        changedBy: deletedBy,
      });
    } catch (error: unknown) {
      this.logger.warn({ key, error }, 'Event emission failed after delete');
    }

    return ok(undefined);
  }
}
```

**Important implementation notes for the implementer:**
- The `EventBusOrchestrator` type must be imported correctly. Check `packages/event-bus/src/index.ts` for the exact export name and its `publish` method signature.
- The `CacheService` type is from `@tempot/shared`. Its methods return `AsyncResult`.
- The `Logger` type is from `pino`. It's used via `@tempot/logger` but the type import is `from 'pino'`.
- When the `eventBus.publish` call returns a Result (not throws), handle it as a Result not with try/catch. Check the actual EventBusOrchestrator API to determine whether `publish` returns `AsyncResult<void>` or `Promise<void>`.

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm --filter @tempot/settings test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/settings/src/dynamic-settings.service.ts packages/settings/tests/unit/dynamic-settings.service.test.ts
git commit -m "feat(settings): dynamic settings service with cache and events"
```

---

### Task 5: Maintenance Service

**Goal:** Implement the maintenance mode helper that provides `getStatus(): AsyncResult<MaintenanceStatus>`.

**Files:**
- Create: `packages/settings/src/maintenance.service.ts`
- Test: `packages/settings/tests/unit/maintenance.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/settings/tests/unit/maintenance.service.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { MaintenanceService } from '../../src/maintenance.service.js';
import type { DynamicSettingsService } from '../../src/dynamic-settings.service.js';
import type { StaticSettings } from '../../src/settings.types.js';

function createMockDynamicService(): { get: ReturnType<typeof vi.fn> } {
  return { get: vi.fn() };
}

const mockStaticSettings: StaticSettings = {
  botToken: 'test-token',
  databaseUrl: 'postgresql://localhost/test',
  superAdminIds: [111, 222],
  defaultLanguage: 'ar',
  defaultCountry: 'EG',
};

describe('MaintenanceService', () => {
  it('should return enabled: false when maintenance_mode is false', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(false));
    const service = new MaintenanceService(mockDynamic as unknown as DynamicSettingsService, mockStaticSettings);

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.enabled).toBe(false);
    }
  });

  it('should return enabled: true when maintenance_mode is true', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(true));
    const service = new MaintenanceService(mockDynamic as unknown as DynamicSettingsService, mockStaticSettings);

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.enabled).toBe(true);
    }
  });

  it('should return isSuperAdmin(111) as true', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(false));
    const service = new MaintenanceService(mockDynamic as unknown as DynamicSettingsService, mockStaticSettings);

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isSuperAdmin(111)).toBe(true);
      expect(result.value.isSuperAdmin(222)).toBe(true);
    }
  });

  it('should return isSuperAdmin(999) as false', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(ok(false));
    const service = new MaintenanceService(mockDynamic as unknown as DynamicSettingsService, mockStaticSettings);

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isSuperAdmin(999)).toBe(false);
    }
  });

  it('should default to enabled: false when maintenance_mode read fails', async () => {
    const mockDynamic = createMockDynamicService();
    mockDynamic.get.mockResolvedValue(err(new AppError('settings.dynamic.unknown_key')));
    const service = new MaintenanceService(mockDynamic as unknown as DynamicSettingsService, mockStaticSettings);

    const result = await service.getStatus();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.enabled).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm --filter @tempot/settings test
```

- [ ] **Step 3: Write `maintenance.service.ts`**

Create `packages/settings/src/maintenance.service.ts`:

```typescript
import { ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { MaintenanceStatus, StaticSettings } from './settings.types.js';
import type { DynamicSettingsService } from './dynamic-settings.service.js';

export class MaintenanceService {
  constructor(
    private readonly dynamicSettings: DynamicSettingsService,
    private readonly staticSettings: StaticSettings,
  ) {}

  async getStatus(): AsyncResult<MaintenanceStatus> {
    const enabledResult = await this.dynamicSettings.get('maintenance_mode');

    const enabled = enabledResult.isOk() ? enabledResult.value : false;

    return ok({
      enabled,
      isSuperAdmin: (userId: number) => this.staticSettings.superAdminIds.includes(userId),
    });
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm --filter @tempot/settings test
```

- [ ] **Step 5: Commit**

```bash
git add packages/settings/src/maintenance.service.ts packages/settings/tests/unit/maintenance.service.test.ts
git commit -m "feat(settings): maintenance service with super admin bypass"
```

---

### Task 6: SettingsService Facade

**Goal:** Create the unified facade that composes static + dynamic + maintenance services.

**Files:**
- Create: `packages/settings/src/settings.service.ts`
- Test: `packages/settings/tests/unit/settings.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/settings/tests/unit/settings.service.test.ts`:

Test cases:
1. `getStatic()` returns the static settings
2. `getDynamic(key)` delegates to DynamicSettingsService
3. `setDynamic(key, value, updatedBy)` delegates to DynamicSettingsService
4. `deleteDynamic(key)` delegates to DynamicSettingsService
5. `getMaintenanceStatus()` delegates to MaintenanceService

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Write `settings.service.ts`**

Create `packages/settings/src/settings.service.ts`:

```typescript
import type { Result } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type {
  StaticSettings,
  DynamicSettingKey,
  DynamicSettingDefinitions,
  MaintenanceStatus,
} from './settings.types.js';
import type { DynamicSettingsService } from './dynamic-settings.service.js';
import type { MaintenanceService } from './maintenance.service.js';

export class SettingsService {
  constructor(
    private readonly staticResult: Result<StaticSettings, AppError>,
    private readonly dynamicSettings: DynamicSettingsService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  getStatic(): Result<StaticSettings, AppError> {
    return this.staticResult;
  }

  getDynamic<K extends DynamicSettingKey>(key: K): AsyncResult<DynamicSettingDefinitions[K]> {
    return this.dynamicSettings.get(key);
  }

  setDynamic<K extends DynamicSettingKey>(
    key: K,
    value: DynamicSettingDefinitions[K],
    updatedBy: string | null = null,
  ): AsyncResult<void> {
    return this.dynamicSettings.set(key, value, updatedBy);
  }

  deleteDynamic(key: DynamicSettingKey, deletedBy: string | null = null): AsyncResult<void> {
    return this.dynamicSettings.delete(key, deletedBy);
  }

  getMaintenanceStatus(): AsyncResult<MaintenanceStatus> {
    return this.maintenanceService.getStatus();
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/settings/src/settings.service.ts packages/settings/tests/unit/settings.service.test.ts
git commit -m "feat(settings): unified settings service facade"
```

---

### Task 7: Prisma Schema Addition

**Goal:** Add the `Setting` model to the Prisma schema.

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Add Setting model to schema.prisma**

Add after the last model in the file:

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

No soft-delete fields — hard-delete returns settings to defaults.

- [ ] **Step 2: Run `npx prisma validate`**

```bash
npx prisma validate
```

Expected: "The Prisma schema is valid."

- [ ] **Step 3: Run `npx prisma generate`**

```bash
npx prisma generate
```

Expected: "Generated Prisma Client"

- [ ] **Step 4: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(database): add Setting model for dynamic settings"
```

---

### Task 8: Event Registration

**Goal:** Register the 4 settings events in the `TempotEvents` interface with inline payloads (DC-5).

**Files:**
- Modify: `packages/event-bus/src/event-bus.events.ts`

- [ ] **Step 1: Add settings events to TempotEvents**

Add before the closing `}` of the `TempotEvents` interface in `packages/event-bus/src/event-bus.events.ts`:

```typescript
  // Settings events
  'settings.setting.updated': {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string | null;
  };
  'settings.setting.created': {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string | null;
  };
  'settings.setting.deleted': {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string | null;
  };
  'settings.maintenance.toggled': {
    enabled: boolean;
    changedBy: string | null;
  };
```

All payloads are inline (no imports from `@tempot/settings`) — DC-5.

- [ ] **Step 2: Build the event-bus package to verify type compilation**

```bash
pnpm --filter @tempot/event-bus build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/event-bus/src/event-bus.events.ts
git commit -m "feat(event-bus): register settings events with inline payloads"
```

---

### Task 9: Barrel Exports

**Goal:** Wire up all public exports in `src/index.ts` using the `export *` pattern with `.js` extensions.

**Files:**
- Modify: `packages/settings/src/index.ts`

- [ ] **Step 1: Write barrel exports**

Replace the empty barrel in `packages/settings/src/index.ts`:

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
} from './settings.types.js';
export { DYNAMIC_SETTING_DEFAULTS } from './settings.types.js';

// Error codes
export { SETTINGS_ERRORS } from './settings.errors.js';

// Repository
export { SettingsRepository } from './settings.repository.js';
export type { SettingsRepositoryPort, SettingsPrismaClient, SettingDelegate } from './settings.repository.js';

// Services
export { StaticSettingsLoader } from './static-settings.loader.js';
export { DynamicSettingsService } from './dynamic-settings.service.js';
export { MaintenanceService } from './maintenance.service.js';
export { SettingsService } from './settings.service.js';
```

- [ ] **Step 2: Run all tests — expect ALL PASS**

```bash
pnpm --filter @tempot/settings test
```

- [ ] **Step 3: Run build — expect PASS**

```bash
pnpm --filter @tempot/settings build
```

- [ ] **Step 4: Run 10-point checklist final verification**

Verify all 10 points from `docs/developer/package-creation-checklist.md` still pass:
1-7: Infrastructure checks (unchanged from Task 0)
8: No `console.*` in `src/` — verify with grep
9: No phantom dependencies — all deps in package.json are imported
10: No compiled artifacts in `src/` — clean workspace

- [ ] **Step 5: Commit**

```bash
git add packages/settings/src/index.ts
git commit -m "feat(settings): barrel exports with full public API surface"
```

---

### Task 10: Integration Tests

**Goal:** Test the full settings lifecycle against a real PostgreSQL database via Testcontainers.

**Files:**
- Create: `packages/settings/tests/integration/settings.integration.test.ts`

**Dependencies:** Requires `@testcontainers/postgresql` in devDependencies. If not already present, add it.

- [ ] **Step 1: Check if Testcontainers PostgreSQL is available**

```bash
pnpm --filter @tempot/settings list @testcontainers/postgresql
```

If missing, add it:

```bash
pnpm --filter @tempot/settings add -D @testcontainers/postgresql@11.13.0
```

Also check how session-manager or database packages set up Testcontainers for integration tests — use the same pattern.

- [ ] **Step 2: Write integration test**

Create `packages/settings/tests/integration/settings.integration.test.ts`:

Test cases:
1. Full CRUD flow: set → get (returns new value) → update → get (returns updated) → delete → get (returns default)
2. Default values: empty database returns all defaults from DYNAMIC_SETTING_DEFAULTS
3. Cache invalidation: write → read returns fresh value (not stale cached value)
4. Maintenance mode: enable → check status.enabled is true → disable → check enabled is false
5. Super admin check: verify isSuperAdmin works against static settings

Use Testcontainers to spin up PostgreSQL, run Prisma migrations, and create a PrismaClient. Create real CacheService and EventBusOrchestrator instances (or mock them if the integration test focuses on repository+service interaction).

**Reference:** Check `packages/database/tests/integration/` or `packages/session-manager/tests/integration/` for the exact Testcontainers setup pattern used in this project.

- [ ] **Step 3: Run integration test — expect PASS**

```bash
pnpm --filter @tempot/settings test
```

- [ ] **Step 4: Commit**

```bash
git add packages/settings/tests/integration/settings.integration.test.ts
git commit -m "test(settings): integration tests with testcontainers postgresql"
```
