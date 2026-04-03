# Input Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@tempot/input-engine`, a dynamic multi-step conversation and form handling engine with 39 field types, partial save, cancel/timeout, conditional fields, AI extraction, and geo selection.

**Architecture:** Strategy pattern with `FieldHandlerRegistry` (Map<FieldType, FieldHandler>). `FormRunner` orchestrates the lifecycle: toggle guard -> schema validation -> session lock -> field iteration (render/parse/validate per handler) -> partial save -> events -> result. `ConversationsStorageAdapter` wraps CacheService for grammY conversations persistence.

**Tech Stack:** TypeScript 5.9.3 strict, grammY + @grammyjs/conversations 2.1.1, Zod 4 with z.globalRegistry, neverthrow 8.2.0, jsQR + jpeg-js + pngjs (QR decoding), vitest 4.1.0

**Worktree:** `F:\Tempot\.worktrees\input-engine` on branch `feature/011-input-engine-package`

**Design Doc:** `docs/superpowers/specs/2026-04-03-input-engine-design.md`

**Spec Artifacts:** `specs/011-input-engine-package/` (spec.md, plan.md, tasks.md, data-model.md, research.md)

**TDD:** RED → GREEN → REFACTOR. Every task writes the failing test first, then implements to make it pass. Code before tests = delete and redo (Constitution Rule XXXIV).

---

## Common Patterns (Reference for All Tasks)

### FieldHandler Pattern

Every field handler follows this structure:

```typescript
import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { FieldHandler } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { t } from '@tempot/i18n-core';

export class XxxFieldHandler implements FieldHandler {
  readonly fieldType = 'Xxx' as const;

  async render(
    conversation: unknown,
    ctx: unknown,
    metadata: FieldMetadata,
    formData: Record<string, unknown>,
  ): AsyncResult<void, AppError> {
    // Send prompt, build UI, wait for response
    return ok(undefined);
  }

  parseResponse(message: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    // Extract typed value from grammY Message
    return ok(value);
  }

  validate(value: unknown, schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    // Validate using Zod schema + custom rules
    return ok(validatedValue);
  }
}
```

### Test Pattern

> **Design Decision D2:** Three-Layer Testing — 70% pure validate/parse tests, 20% conversation mock tests, 10% FormRunner integration tests. See design doc for full rationale.

Every field handler test follows this structure:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { XxxFieldHandler } from '../../src/fields/category/xxx.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMockMetadata(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Xxx',
    i18nKey: 'test.field.xxx',
    ...overrides,
  } as FieldMetadata;
}

describe('XxxFieldHandler', () => {
  let handler: XxxFieldHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new XxxFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Xxx');
  });

  describe('validate', () => {
    it('returns ok for valid input', () => { ... });
    it('returns err for invalid input', () => { ... });
  });

  describe('parseResponse', () => {
    it('extracts value from message', () => { ... });
    it('returns err for missing data', () => { ... });
  });
});
```

### Import Path Convention

All imports use `.js` extensions for ESM compatibility:

```typescript
import { something } from './path/to/file.js';
```

### Result Pattern

```typescript
import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';

// Sync: Result<T, AppError>
function validate(input: string): Result<string, AppError> {
  if (!input) return err(new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED));
  return ok(input);
}

// Async: AsyncResult<T, AppError>  (= Promise<Result<T, AppError>>)
async function render(): AsyncResult<void, AppError> {
  return ok(undefined);
}
```

---

## Phase 1: Setup

### Task 0: Package Scaffolding

**Files:**

- Create: `packages/input-engine/.gitignore`
- Create: `packages/input-engine/tsconfig.json`
- Create: `packages/input-engine/package.json`
- Create: `packages/input-engine/vitest.config.ts`
- Create: `packages/input-engine/src/index.ts`

**Package Creation Checklist (all 10 points — `docs/developer/package-creation-checklist.md`):**

- [ ] **Step 1: Create `.gitignore`**

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

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "@tempot/input-engine",
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
    "neverthrow": "8.2.0",
    "@grammyjs/conversations": "^2.1.1",
    "zod": "^4.3.6",
    "@tempot/shared": "workspace:*",
    "@tempot/ux-helpers": "workspace:*",
    "@tempot/i18n-core": "workspace:*",
    "@tempot/session-manager": "workspace:*",
    "jsqr": "^1.4.0",
    "jpeg-js": "^0.4.4",
    "pngjs": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0",
    "grammy": "^1.41.1",
    "@types/pngjs": "^6.0.5"
  }
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

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
    ],
    coverage: {
      provider: 'v8',
      thresholds: serviceCoverageThresholds,
    },
  },
});
```

- [ ] **Step 5: Create empty barrel `src/index.ts`**

```typescript
// @tempot/input-engine barrel exports
// Will be populated as modules are implemented
```

- [ ] **Step 6: Run `pnpm install` in worktree root**

Run: `pnpm install` (from worktree root)
Expected: Installs new deps including @grammyjs/conversations, jsqr, jpeg-js, pngjs

- [ ] **Step 7: Verify build succeeds**

Run: `pnpm --filter @tempot/input-engine build`
Expected: Exit 0, dist/ created with index.js + index.d.ts

- [ ] **Step 8: Verify no `console.*` in src/ (Checklist Point 8)**

Run: `grep -rn "console\." packages/input-engine/src/`
Expected: No output (zero matches)

- [ ] **Step 9: Verify no phantom dependencies (Checklist Point 9)**

For each dependency in package.json, verify it is imported in `src/`. At scaffolding time only `src/index.ts` exists (empty barrel), so this step confirms the file has no stale imports. Full phantom dependency check runs at merge gate after all tasks are complete.

- [ ] **Step 10: Verify clean workspace (Checklist Point 10)**

Run: `Get-ChildItem -Recurse packages/input-engine/src -Include *.js,*.d.ts`
Expected: No output (no compiled artifacts in src/)

- [ ] **Step 11: Commit scaffolding**

```
git add packages/input-engine/
git commit -m "feat(input-engine): scaffold package with dependencies (Task 0)"
```

---

## Phase 2: Foundation (Tasks 1-6)

### Task 1: Type Definitions, Contracts & Error Codes

**Files:**

- Create: `packages/input-engine/src/input-engine.types.ts`
- Create: `packages/input-engine/src/input-engine.contracts.ts`
- Create: `packages/input-engine/src/input-engine.errors.ts`
- Create: `packages/input-engine/tests/unit/input-engine.types.test.ts`

- [ ] **Step 1: Write types test**

```typescript
import { describe, it, expect } from 'vitest';
import type {
  FieldType,
  FieldMetadata,
  ChoiceOption,
  FieldCondition,
  MultiStepLevel,
  FormOptions,
  TimeSlot,
  CountryCode,
  NationalIDResult,
  ContactResult,
  SchedulePickerResult,
  EgyptianMobileResult,
  CurrencyAmountResult,
} from '../../src/input-engine.types.js';
import { DEFAULT_FORM_OPTIONS } from '../../src/input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type {
  StorageEngineClient,
  AIExtractionClient,
  RegionalClient,
  InputEngineLogger,
  InputEngineEventBus,
} from '../../src/input-engine.contracts.js';

describe('input-engine.types', () => {
  describe('FieldType union', () => {
    it('includes all 39 field types', () => {
      const allTypes: FieldType[] = [
        'ShortText',
        'LongText',
        'Email',
        'Phone',
        'URL',
        'RegexValidated',
        'Integer',
        'Float',
        'Currency',
        'Percentage',
        'CurrencyAmount',
        'SingleChoice',
        'MultipleChoice',
        'BooleanToggle',
        'SearchableList',
        'DatePicker',
        'TimePicker',
        'Location',
        'DateRange',
        'SchedulePicker',
        'Photo',
        'Document',
        'Video',
        'Audio',
        'FileGroup',
        'Contact',
        'ConditionalField',
        'AIExtractorField',
        'GeoSelectField',
        'GeoAddressField',
        'NationalID',
        'PassportNumber',
        'IBAN',
        'EgyptianMobile',
        'StarRating',
        'MultiStepChoice',
        'QRCode',
        'Toggle',
        'Tags',
      ];
      expect(allTypes).toHaveLength(39);
    });
  });

  describe('DEFAULT_FORM_OPTIONS', () => {
    it('has correct defaults', () => {
      expect(DEFAULT_FORM_OPTIONS.partialSave).toBe(false);
      expect(DEFAULT_FORM_OPTIONS.partialSaveTTL).toBe(86_400_000);
      expect(DEFAULT_FORM_OPTIONS.maxMilliseconds).toBe(600_000);
      expect(DEFAULT_FORM_OPTIONS.allowCancel).toBe(true);
      expect(DEFAULT_FORM_OPTIONS.formId).toBe('');
    });
  });

  describe('FieldMetadata interface', () => {
    it('accepts all required and optional properties', () => {
      const meta: FieldMetadata = {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: false,
        minLength: 2,
        maxLength: 100,
        extractData: true,
      };
      expect(meta.fieldType).toBe('ShortText');
    });
  });

  describe('Result types', () => {
    it('NationalIDResult has expected shape', () => {
      const result: NationalIDResult = {
        id: '12345678901234',
        birthDate: '1990-01-15',
        governorate: 'Cairo',
        gender: 'male',
      };
      expect(result.id).toBe('12345678901234');
    });

    it('ContactResult has expected shape', () => {
      const result: ContactResult = {
        phoneNumber: '+201234567890',
        firstName: 'Test',
      };
      expect(result.phoneNumber).toBe('+201234567890');
    });

    it('SchedulePickerResult has expected shape', () => {
      const result: SchedulePickerResult = {
        date: '2026-04-03',
        time: '14:30',
        slotId: 'slot-1',
      };
      expect(result.date).toBe('2026-04-03');
    });

    it('EgyptianMobileResult has expected shape', () => {
      const result: EgyptianMobileResult = {
        number: '01012345678',
        countryCode: '+20',
        operator: 'Vodafone',
      };
      expect(result.operator).toBe('Vodafone');
    });

    it('CurrencyAmountResult has expected shape', () => {
      const result: CurrencyAmountResult = {
        amount: 100.5,
        currency: 'EGP',
      };
      expect(result.currency).toBe('EGP');
    });
  });
});

describe('input-engine.errors', () => {
  it('exports INPUT_ENGINE_ERRORS with all error codes', () => {
    expect(INPUT_ENGINE_ERRORS.DISABLED).toBe('input-engine.disabled');
    expect(INPUT_ENGINE_ERRORS.SCHEMA_INVALID).toBe('input-engine.schema.invalid');
    expect(INPUT_ENGINE_ERRORS.FORM_CANCELLED).toBe('input-engine.form.cancelled');
    expect(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED).toBe(
      'input-engine.field.validation_failed',
    );
    expect(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED).toBe('input-engine.media.size_exceeded');
    expect(INPUT_ENGINE_ERRORS.IBAN_INVALID_CHECKSUM).toBe('input-engine.iban.invalid_checksum');
    expect(INPUT_ENGINE_ERRORS.QR_DECODE_FAILED).toBe('input-engine.qr.decode_failed');
    expect(INPUT_ENGINE_ERRORS.NATIONAL_ID_CHECKSUM_FAILED).toBe(
      'input-engine.national_id.checksum_failed',
    );
    expect(INPUT_ENGINE_ERRORS.TAGS_DUPLICATE).toBe('input-engine.tags.duplicate');
    expect(INPUT_ENGINE_ERRORS.CONTACT_NOT_SHARED).toBe('input-engine.contact.not_shared');
  });

  it('has hierarchical dot-separated codes', () => {
    const codes = Object.values(INPUT_ENGINE_ERRORS);
    codes.forEach((code) => {
      expect(code).toMatch(/^input-engine\./);
    });
  });
});

describe('input-engine.contracts', () => {
  it('structural interfaces accept compatible objects', () => {
    const logger: InputEngineLogger = {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    };
    expect(logger.info).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/input-engine test`
Expected: FAIL — modules not found

- [ ] **Step 3: Create `input-engine.types.ts`**

Exact code from plan.md lines 320-528. See `specs/011-input-engine-package/plan.md` lines 320-528 for the complete `FieldType` union, `FieldMetadata` interface, all result types, `FormOptions`, and `DEFAULT_FORM_OPTIONS`.

- [ ] **Step 4: Create `input-engine.contracts.ts`**

Exact code from plan.md lines 532-575. See `specs/011-input-engine-package/plan.md` for `StorageEngineClient`, `AIExtractionClient`, `RegionalClient`, `InputEngineLogger`, `InputEngineEventBus`.

- [ ] **Step 5: Create `input-engine.errors.ts`**

Exact code from plan.md lines 579-643 — the `INPUT_ENGINE_ERRORS` const object with 30 hierarchical error codes.

- [ ] **Step 6: Update barrel exports**

Add to `src/index.ts`:

```typescript
// Types
export type {
  FieldType,
  FieldMetadata,
  ChoiceOption,
  FieldCondition,
  MultiStepLevel,
  FormOptions,
  TimeSlot,
  CountryCode,
  NationalIDResult,
  ContactResult,
  SchedulePickerResult,
  EgyptianMobileResult,
  CurrencyAmountResult,
} from './input-engine.types.js';
export { DEFAULT_FORM_OPTIONS } from './input-engine.types.js';

// Contracts
export type {
  StorageEngineClient,
  AIExtractionClient,
  RegionalClient,
  InputEngineLogger,
  InputEngineEventBus,
} from './input-engine.contracts.js';

// Errors
export { INPUT_ENGINE_ERRORS } from './input-engine.errors.js';
```

- [ ] **Step 7: Run tests — expect PASS**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 8: Verify build**

Run: `pnpm --filter @tempot/input-engine build`
Expected: Exit 0

- [ ] **Step 9: Commit**

```
git commit -m "feat(input-engine): add types, contracts, and error codes (Task 1)"
```

---

### Task 2: Toggle Guard & Config

**Files:**

- Create: `packages/input-engine/src/input-engine.config.ts`
- Create: `packages/input-engine/src/input-engine.guard.ts`
- Create: `packages/input-engine/tests/unit/input-engine.config.test.ts`
- Create: `packages/input-engine/tests/unit/input-engine.guard.test.ts`

- [ ] **Step 1: Write config test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isInputEngineEnabled } from '../../src/input-engine.config.js';

describe('isInputEngineEnabled', () => {
  const originalEnv = process.env.TEMPOT_INPUT_ENGINE;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.TEMPOT_INPUT_ENGINE;
    } else {
      process.env.TEMPOT_INPUT_ENGINE = originalEnv;
    }
  });

  it('returns true when env var is not set', () => {
    delete process.env.TEMPOT_INPUT_ENGINE;
    expect(isInputEngineEnabled()).toBe(true);
  });

  it('returns true when env var is "true"', () => {
    process.env.TEMPOT_INPUT_ENGINE = 'true';
    expect(isInputEngineEnabled()).toBe(true);
  });

  it('returns false when env var is "false"', () => {
    process.env.TEMPOT_INPUT_ENGINE = 'false';
    expect(isInputEngineEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Write guard test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { guardEnabled } from '../../src/input-engine.guard.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';

describe('guardEnabled', () => {
  it('calls fn and returns its result when enabled is true', async () => {
    const fn = vi.fn().mockResolvedValue(ok('result'));
    const result = await guardEnabled(true, fn);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('result');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('returns err(DISABLED) without calling fn when enabled is false', async () => {
    const fn = vi.fn();
    const result = await guardEnabled(false, fn);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.DISABLED);
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

- [ ] **Step 4: Create `input-engine.config.ts`**

```typescript
/** Check if input-engine is enabled (Rule XVI) */
export function isInputEngineEnabled(): boolean {
  return process.env.TEMPOT_INPUT_ENGINE !== 'false';
}
```

- [ ] **Step 5: Create `input-engine.guard.ts`**

```typescript
import { err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from './input-engine.errors.js';

/** Toggle guard — wraps async operations with enabled check (Rule XVI) */
export function guardEnabled<T>(
  enabled: boolean,
  fn: () => AsyncResult<T, AppError>,
): AsyncResult<T, AppError> {
  if (!enabled) {
    return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.DISABLED)));
  }
  return fn();
}
```

- [ ] **Step 6: Update barrel exports**

```typescript
// Config
export { isInputEngineEnabled } from './input-engine.config.js';

// Guard
export { guardEnabled } from './input-engine.guard.js';
```

- [ ] **Step 7: Run tests — expect PASS**
- [ ] **Step 8: Commit**

```
git commit -m "feat(input-engine): add toggle guard and config (Task 2)"
```

---

### Task 3: Conversations Storage Adapter (Design Decision D4)

**Files:**

- Create: `packages/input-engine/src/storage/conversations-storage.adapter.ts`
- Create: `packages/input-engine/tests/unit/conversations-storage.adapter.test.ts`

- [ ] **Step 1: Write storage adapter test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { ConversationsStorageAdapter } from '../../src/storage/conversations-storage.adapter.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMockCache() {
  return {
    get: vi.fn().mockResolvedValue(ok(undefined)),
    set: vi.fn().mockResolvedValue(ok(undefined)),
    del: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

function createMockLogger(): InputEngineLogger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

describe('ConversationsStorageAdapter', () => {
  let adapter: ConversationsStorageAdapter;
  let cache: ReturnType<typeof createMockCache>;
  let logger: InputEngineLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = createMockCache();
    logger = createMockLogger();
    adapter = new ConversationsStorageAdapter(cache as never, logger);
  });

  describe('read', () => {
    it('returns stored value on cache hit', async () => {
      const state = { version: [0, 0], state: { conv1: [] } };
      cache.get.mockResolvedValue(ok(state));
      const result = await adapter.read('chat:123');
      expect(result).toEqual(state);
      expect(cache.get).toHaveBeenCalledWith('chat:123');
    });

    it('returns undefined on cache miss', async () => {
      cache.get.mockResolvedValue(ok(undefined));
      const result = await adapter.read('chat:123');
      expect(result).toBeUndefined();
    });

    it('returns undefined on cache error (graceful degradation)', async () => {
      cache.get.mockResolvedValue(err(new AppError('cache.failed')));
      const result = await adapter.read('chat:123');
      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_RESTORE_FAILED }),
      );
    });
  });

  describe('write', () => {
    it('writes value to cache with TTL', async () => {
      const state = { version: [0, 0], state: {} };
      await adapter.write('chat:123', state);
      expect(cache.set).toHaveBeenCalledWith('chat:123', state, 86_400_000);
    });

    it('logs warning on cache error but does not throw', async () => {
      cache.set.mockResolvedValue(err(new AppError('cache.failed')));
      await expect(adapter.write('chat:123', {})).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes key from cache', async () => {
      await adapter.delete('chat:123');
      expect(cache.del).toHaveBeenCalledWith('chat:123');
    });

    it('logs warning on cache error but does not throw', async () => {
      cache.del.mockResolvedValue(err(new AppError('cache.failed')));
      await expect(adapter.delete('chat:123')).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Create `conversations-storage.adapter.ts`**

Use exact code from plan.md lines 692-751. Key: `CacheAdapter` structural interface, `ConversationsStorageAdapter` class with `read`, `write`, `delete`, graceful degradation on all errors.

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**

```
git commit -m "feat(input-engine): add conversations storage adapter (Task 3)"
```

---

### Task 4: FieldHandler Interface & Registry

**Files:**

- Create: `packages/input-engine/src/fields/field.handler.ts`
- Create: `packages/input-engine/tests/unit/field.handler.test.ts`

- [ ] **Step 1: Write field handler test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from 'neverthrow';
import type { FieldHandler } from '../../src/fields/field.handler.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldType, FieldMetadata } from '../../src/input-engine.types.js';

function createMockHandler(fieldType: FieldType): FieldHandler {
  return {
    fieldType,
    render: vi.fn().mockResolvedValue(ok(undefined)),
    parseResponse: vi.fn().mockReturnValue(ok('parsed')),
    validate: vi.fn().mockReturnValue(ok('valid')),
  };
}

describe('FieldHandlerRegistry', () => {
  let registry: FieldHandlerRegistry;

  beforeEach(() => {
    registry = new FieldHandlerRegistry();
  });

  it('registers and retrieves a handler', () => {
    const handler = createMockHandler('ShortText');
    registry.register(handler);
    expect(registry.get('ShortText')).toBe(handler);
  });

  it('returns undefined for unregistered type', () => {
    expect(registry.get('ShortText')).toBeUndefined();
  });

  it('has() returns true for registered type', () => {
    registry.register(createMockHandler('Email'));
    expect(registry.has('Email')).toBe(true);
    expect(registry.has('Phone')).toBe(false);
  });

  it('getRegisteredTypes() returns all registered types', () => {
    registry.register(createMockHandler('ShortText'));
    registry.register(createMockHandler('Email'));
    registry.register(createMockHandler('Phone'));
    expect(registry.getRegisteredTypes()).toEqual(['ShortText', 'Email', 'Phone']);
  });

  it('overwrites existing handler for same type', () => {
    const handler1 = createMockHandler('ShortText');
    const handler2 = createMockHandler('ShortText');
    registry.register(handler1);
    registry.register(handler2);
    expect(registry.get('ShortText')).toBe(handler2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Create `field.handler.ts`**

Use exact code from plan.md lines 762-817: `FieldHandler` interface + `FieldHandlerRegistry` class.

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**

```
git commit -m "feat(input-engine): add FieldHandler interface and registry (Task 4)"
```

---

### Task 5: Schema Validator

**Files:**

- Create: `packages/input-engine/src/runner/schema.validator.ts`
- Create: `packages/input-engine/tests/unit/schema.validator.test.ts`

- [ ] **Step 1: Write schema validator test**

Test cases needed:

- Valid schema with multiple fields passes validation
- Returns err for duplicate field names
- Returns err for unknown field types
- Returns err for circular conditional dependencies (A depends on B, B depends on A)
- Returns err for missing i18n keys (empty string)
- Returns ok for schema with conditional fields (no circular deps)

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { SchemaValidator } from '../../src/runner/schema.validator.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

// Helper: register schema with metadata in Zod 4 global registry
// Design Decision D3: Zod 4 global registry uses reference-based keys (like WeakMap).
// Each test creates new schema instances → unique references → no cross-test pollution.
// No afterEach cleanup needed for z.globalRegistry.
function registerField(schema: z.ZodType, metadata: FieldMetadata): z.ZodType {
  z.globalRegistry.register(schema, { 'input-engine': metadata });
  return schema;
}

describe('SchemaValidator', () => {
  it('validates a well-formed schema', () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const emailSchema = registerField(z.string(), {
      fieldType: 'Email',
      i18nKey: 'form.email',
    } as FieldMetadata);
    const formSchema = z.object({ name: nameSchema, email: emailSchema });

    const registry = new FieldHandlerRegistry();
    // Register mock handlers for the types used
    registry.register({
      fieldType: 'ShortText',
      render: async () => ({}) as never,
      parseResponse: () => ({}) as never,
      validate: () => ({}) as never,
    });
    registry.register({
      fieldType: 'Email',
      render: async () => ({}) as never,
      parseResponse: () => ({}) as never,
      validate: () => ({}) as never,
    });

    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);
    expect(result.isOk()).toBe(true);
  });

  it('returns err for missing i18n key', () => {
    const schema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: '',
    } as FieldMetadata);
    const formSchema = z.object({ name: schema });

    const registry = new FieldHandlerRegistry();
    registry.register({
      fieldType: 'ShortText',
      render: async () => ({}) as never,
      parseResponse: () => ({}) as never,
      validate: () => ({}) as never,
    });

    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.SCHEMA_INVALID);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
- [ ] **Step 3: Implement `schema.validator.ts`**

Key logic:

1. Extract field metadata from Zod registry for each property in the z.object schema
2. Check for duplicate field names
3. Check for empty i18n keys
4. Check for unknown field types (not in registry)
5. Check for circular conditional dependencies using DFS cycle detection

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**

```
git commit -m "feat(input-engine): add schema validator (Task 5)"
```

---

### Task 6: FormRunner Core

**Files:**

- Create: `packages/input-engine/src/runner/form.runner.ts`
- Create: `packages/input-engine/tests/unit/form.runner.test.ts`

- [ ] **Step 1: Write FormRunner test**

Test cases:

- Returns err(DISABLED) when toggle is off
- Returns err(SCHEMA_INVALID) for invalid schema
- Returns err(FORM_ALREADY_ACTIVE) when activeConversation is set
- Successfully runs a simple 2-field form (mock handlers return ok values)
- Skips conditional fields when condition is not met
- Emits form.started and form.completed events
- Emits form.cancelled when cancel is triggered
- Returns err(FIELD_MAX_RETRIES) after maxRetries exceeded

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement `form.runner.ts`**

Key: `runForm()` function that accepts Zod 4 schema, FormOptions, and dependency injection (conversation, ctx, registry, cache, logger, eventBus, sessionProvider). Implements the 8-step lifecycle from the design doc.

The `runForm()` function signature:

```typescript
export async function runForm<T>(
  conversation: unknown,
  ctx: unknown,
  schema: z.ZodObject<z.ZodRawShape>,
  deps: FormRunnerDeps,
  options?: FormOptions,
): AsyncResult<T, AppError>;
```

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**

```
git commit -m "feat(input-engine): add FormRunner core (Task 6)"
```

---

## Phase 3: Text Fields (Tasks 7-12)

All text handlers follow the same pattern. The `validate` method checks string constraints (minLength, maxLength, pattern). The `parseResponse` extracts `message.text`. The `render` sends an i18n prompt via `ctx.reply()`.

### Task 7: ShortText Field Handler

**Files:**

- Create: `packages/input-engine/src/fields/text/short-text.field.ts`
- Create: `packages/input-engine/tests/unit/short-text.field.test.ts`

- [ ] **Step 1: Write test**

4 test cases: valid input, too short, too long, empty input. Plus fieldType check.

- [ ] **Step 2: Run test — FAIL**
- [ ] **Step 3: Implement handler**

`validate`: Check `minLength` (default 1), `maxLength` (default 255). Return trimmed string.
`parseResponse`: Extract `message.text`, return err if undefined.
`render`: `ctx.reply(t(metadata.i18nKey))`, use `conversation.form.build()` with custom validator.

- [ ] **Step 4: Run tests — PASS**
- [ ] **Step 5: Commit**

### Task 8: LongText Field Handler

**Files:** `src/fields/text/long-text.field.ts` + `tests/unit/long-text.field.test.ts`

Same as ShortText but `maxLength` default is 4096 (Telegram message limit). 4 tests.

### Task 9: Email Field Handler

**Files:** `src/fields/text/email.field.ts` + `tests/unit/email.field.test.ts`

`validate`: RFC 5322 basic email regex. `parseResponse`: extract text, trim, lowercase. 6 tests: valid email, no @, no domain, empty, spaces trimmed, uppercase normalized.

### Task 10: Phone Field Handler

**Files:** `src/fields/text/phone.field.ts` + `tests/unit/phone.field.test.ts`

`validate`: International phone regex `^\+?[1-9]\d{1,14}$` (E.164). 5 tests: valid with +, valid without +, letters rejected, too short, too long.

### Task 11: URL Field Handler

**Files:** `src/fields/text/url.field.ts` + `tests/unit/url.field.test.ts`

`validate`: `URL` constructor try/catch. 4 tests: valid https, valid http, invalid string, missing protocol.

### Task 12: RegexValidated Field Handler

**Files:** `src/fields/text/regex-validated.field.ts` + `tests/unit/regex-validated.field.test.ts`

`validate`: Uses `metadata.pattern` regex. 4 tests: matching input, non-matching input, no pattern configured, empty input.

**Commit after each handler or batch commit after all 6:**

```
git commit -m "feat(input-engine): add text field handlers - ShortText, LongText, Email, Phone, URL, RegexValidated (Tasks 7-12)"
```

---

## Phase 3 continued: Number Fields (Tasks 13-16, 41)

### Task 13: Integer Field Handler

**Files:** `src/fields/numbers/integer.field.ts` + `tests/unit/integer.field.test.ts`

`parseResponse`: `parseInt(text, 10)`. `validate`: Check `isNaN`, `min`, `max`. 6 tests: valid, decimal rejected, non-numeric, min boundary, max boundary, negative.

### Task 14: Float Field Handler

**Files:** `src/fields/numbers/float.field.ts` + `tests/unit/float.field.test.ts`

`parseResponse`: `parseFloat(text)`. `validate`: Check `isNaN`, `isFinite`, `min`, `max`. 5 tests.

### Task 15: Currency Field Handler

**Files:** `src/fields/numbers/currency.field.ts` + `tests/unit/currency.field.test.ts`

`validate`: Exactly 2 decimal places, positive, min/max. Normalize Arabic numerals (٠-٩ → 0-9). 6 tests.

### Task 16: Percentage Field Handler

**Files:** `src/fields/numbers/percentage.field.ts` + `tests/unit/percentage.field.test.ts`

`validate`: Range 0-100, strip trailing `%` if present. 5 tests.

### Task 41: CurrencyAmount Field Handler

**Files:** `src/fields/numbers/currency-amount.field.ts` + `tests/unit/currency-amount.field.test.ts`

`validate`: Parse amount, validate against `metadata.currency` or `metadata.allowedCurrencies`. Returns `CurrencyAmountResult`. `parseResponse`: Extract text, normalize Arabic numerals. 6 tests.

**Commit:**

```
git commit -m "feat(input-engine): add number field handlers - Integer, Float, Currency, Percentage, CurrencyAmount (Tasks 13-16, 41)"
```

---

## Phase 3 continued: Choice Fields (Tasks 17-18)

### Task 17: SingleChoice Field Handler

**Files:** `src/fields/choice/single-choice.field.ts` + `tests/unit/single-choice.field.test.ts`

`render`: Use `createInlineKeyboard()` from ux-helpers. Each option is a button. Use callback data format `ie:{formId}:{fieldIndex}:{value}`.
`parseResponse`: Decode callback data, extract selected value.
`validate`: Check value is in `metadata.options`. 6 tests.

### Task 18: BooleanToggle Field Handler

**Files:** `src/fields/choice/boolean-toggle.field.ts` + `tests/unit/boolean-toggle.field.test.ts`

`render`: Two inline buttons (Yes/No with i18n). `validate`: Returns boolean. 4 tests.

**Commit:**

```
git commit -m "feat(input-engine): add choice field handlers - SingleChoice, BooleanToggle (Tasks 17-18)"
```

---

## Phase 4: Complex Choice Fields (Tasks 19-21)

### Task 19: MultipleChoice Field Handler

**Files:** `src/fields/choice/multiple-choice.field.ts` + `tests/unit/multiple-choice.field.test.ts`

`render`: Inline keyboard with toggle checkmarks, "Done" button. Track selected values. `validate`: Check `minSelections`, `maxSelections`. 8 tests.

### Task 20: SearchableList Field Handler

**Files:** `src/fields/choice/searchable-list.field.ts` + `tests/unit/searchable-list.field.test.ts`

`render`: Prompt for search text, filter options, show paginated results via `buildPagination()`. 8 tests.

### Task 21: Callback Data Utils

**Files:** `src/utils/callback-data.utils.ts` + `tests/unit/callback-data.utils.test.ts` (if not already covered)

`encodeFormCallback(formId, fieldIndex, value)` and `decodeFormCallback(data)`. Wraps `encodeCallbackData`/`decodeCallbackData` from ux-helpers with `ie:` prefix. Uses `crypto.randomUUID().slice(0, 8)` for formId generation. 6 tests.

**Commit:**

```
git commit -m "feat(input-engine): add complex choice handlers and callback utils (Tasks 19-21)"
```

---

## Phase 5: Smart Fields (Tasks 22-23)

### Task 22: ConditionalField Handler

**Files:** `src/fields/smart/conditional.field.ts` + `tests/unit/conditional.field.test.ts`

`render`: Evaluate `metadata.conditions` against `formData`. If condition met, delegate to the actual inner field handler. If not met, skip (return `ok`). 6 tests: condition met → render inner, condition not met → skip, multiple conditions (AND logic).

### Task 23: AIExtractorField Handler

**Files:** `src/fields/smart/ai-extractor.field.ts` + `tests/unit/ai-extractor.field.test.ts`

`render`: Send freeform text prompt, extract structured data via `AIExtractionClient`. Show confirmation to user. If AI unavailable, fall back to manual individual field entry. 8 tests.

**Commit:**

```
git commit -m "feat(input-engine): add smart field handlers - ConditionalField, AIExtractorField (Tasks 22-23)"
```

---

## Phase 6: Geo Fields (Tasks 24-25)

### Task 24: GeoSelectField Handler

**Files:** `src/fields/geo/geo-select.field.ts` + `tests/unit/geo-select.field.test.ts`

`render`: Multi-step hierarchical selection (state → city) using `RegionalClient`. Falls back to text input if RegionalClient unavailable. 6 tests.

### Task 25: GeoAddressField Handler

**Files:** `src/fields/geo/geo-address.field.ts` + `tests/unit/geo-address.field.test.ts`

`render`: Freeform address text input + optional location sharing. 4 tests.

**Commit:**

```
git commit -m "feat(input-engine): add geo field handlers (Tasks 24-25)"
```

---

## Phase 7: Identity Fields (Tasks 26-27, 42-43)

### Task 26: NationalID Field Handler (Enhanced)

**Files:** `src/fields/identity/national-id.field.ts` + `tests/unit/national-id.field.test.ts`

`validate`: 14-digit Egyptian national ID. Checksum validation (Luhn-like). When `extractData: true`, extract birth date (digits 2-7), governorate (digits 8-9), gender (digit 13 odd=male, even=female). Return `NationalIDResult`. Hardcoded `GOVERNORATE_CODES` const. Future date validation. 12 tests.

### Task 27: PassportNumber Field Handler

**Files:** `src/fields/identity/passport.field.ts` + `tests/unit/passport.field.test.ts`

`validate`: 6-9 alphanumeric characters, uppercase. 4 tests.

### Task 42: IBAN Field Handler

**Files:** `src/fields/identity/iban.field.ts` + `tests/unit/iban.field.test.ts`

`validate`: Strip spaces, uppercase. Check `IBAN_LENGTHS` map for country-specific length. MOD-97 checksum. If `metadata.allowedCountries` set, verify country code. 8 tests: valid EG IBAN, valid DE IBAN, invalid checksum, wrong length, US (no IBAN), country not allowed, spaces stripped, lowercase normalized.

### Task 43: EgyptianMobile Field Handler

**Files:** `src/fields/identity/egyptian-mobile.field.ts` + `tests/unit/egyptian-mobile.field.test.ts`

`validate`: Match `01[0125]\d{8}` pattern. Operator detection from 3rd digit: 0=Vodafone, 1=Etisalat, 2=Orange, 5=WE. Returns `EgyptianMobileResult`. 6 tests.

**Commit:**

```
git commit -m "feat(input-engine): add identity field handlers - NationalID, Passport, IBAN, EgyptianMobile (Tasks 26-27, 42-43)"
```

---

## Phase 7 continued: Interactive Fields (Tasks 28-29, 45-47)

### Task 28: StarRating Field Handler

**Files:** `src/fields/interactive/star-rating.field.ts` + `tests/unit/star-rating.field.test.ts`

`render`: Inline keyboard with 1-5 star buttons using EMOJI_NUMBERS or star emojis. `validate`: Integer 1-5 (or custom min/max). 4 tests.

### Task 29: MultiStepChoice Field Handler

**Files:** `src/fields/interactive/multi-step-choice.field.ts` + `tests/unit/multi-step-choice.field.test.ts`

`render`: Cascading inline menus using `metadata.levels`. Each level selection triggers next level. Callback data: `L{level}:{optionIndex}`. Back button to go to previous level. 8 tests.

### Task 45: QRCode Field Handler

**Files:** `src/fields/interactive/qr-code.field.ts` + `tests/unit/qr-code.field.test.ts`

`render`: Prompt user to send photo of QR code. Use `conversation.waitFor(':photo')`.
`parseResponse`: Download photo, detect format (JPEG magic bytes `0xFF 0xD8` / PNG magic bytes `0x89 0x50`), decode with `jpeg-js` or `pngjs`, extract RGBA pixels, pass to `jsQR`. Return decoded string.
`validate`: If `metadata.expectedFormat` is `'url'`, validate decoded string is URL. If `'json'`, validate JSON.parse. 6 tests: valid QR in JPEG, no QR found, format mismatch (expected URL got text), valid JSON format, photo with no QR, invalid image buffer.

**Important test note:** Mock `jsQR` at module level with `vi.mock('jsqr', ...)`. Mock `jpeg-js` and `pngjs` similarly.

### Task 46: Toggle Field Handler

**Files:** `src/fields/interactive/toggle.field.ts` + `tests/unit/toggle.field.test.ts`

`render`: Single inline button showing current state with checkmark/cross prefix. Tapping toggles the value. Shows `metadata.onLabel` / `metadata.offLabel` with `✓` / `✗` prefix. `validate`: Returns boolean. 4 tests.

### Task 47: Tags Field Handler

**Files:** `src/fields/interactive/tags.field.ts` + `tests/unit/tags.field.test.ts`

`render`: Prompt for tag text input. Show current tags as inline buttons (tap to remove). "Add" button for new tag, "Done" button to confirm. `validate`: Check `minTags`, `maxTags`, `maxTagLength`, no duplicates. Uses `metadata.predefinedTags` if available. 8 tests.

**Commit:**

```
git commit -m "feat(input-engine): add interactive field handlers - StarRating, MultiStepChoice, QRCode, Toggle, Tags (Tasks 28-29, 45-47)"
```

---

## Phase 8: Media Fields (Tasks 30-34, 48)

### Task 30: Photo Field Handler

**Files:** `src/fields/media/photo.field.ts` + `tests/unit/photo.field.test.ts`

`render`: Prompt for photo via `conversation.waitFor(':photo')`. `parseResponse`: Get largest `PhotoSize`. `validate`: Check `maxSizeKB` via file_size, optionally upload via `StorageEngineClient`. 6 tests.

### Task 31: Document Field Handler

**Files:** `src/fields/media/document.field.ts` + `tests/unit/document.field.test.ts`

`render`: `conversation.waitFor(':document')`. `validate`: Check `allowedExtensions`, `maxSizeKB`. 6 tests.

### Task 32: Video Field Handler

**Files:** `src/fields/media/video.field.ts` + `tests/unit/video.field.test.ts`

`render`: `conversation.waitFor(':video')`. `validate`: Check `maxSizeKB`, `maxDurationSeconds`. 5 tests.

### Task 33: Audio Field Handler

**Files:** `src/fields/media/audio.field.ts` + `tests/unit/audio.field.test.ts`

Same as Video but for audio. `conversation.waitFor(':audio')`. 5 tests.

### Task 34: FileGroup Field Handler

**Files:** `src/fields/media/file-group.field.ts` + `tests/unit/file-group.field.test.ts`

`render`: Multi-file upload. Loop collecting files until user sends "Done" or hits `maxFiles`. `validate`: Check `minFiles`, `maxFiles`, each file against `maxSizeKB` and `allowedTypes`. 8 tests.

### Task 48: Contact Field Handler

**Files:** `src/fields/media/contact.field.ts` + `tests/unit/contact.field.test.ts`

`render`: Send ReplyKeyboardMarkup with `request_contact: true`. Wait for `conversation.waitFor(':contact')`. Remove reply keyboard after. `parseResponse`: Extract `phone_number`, `first_name`, `last_name`, `user_id` from `message.contact`. Returns `ContactResult`. `validate`: Check phone_number is non-empty. 6 tests.

**Commit:**

```
git commit -m "feat(input-engine): add media field handlers - Photo, Document, Video, Audio, FileGroup, Contact (Tasks 30-34, 48)"
```

---

## Phase 9: Time/Place Fields (Tasks 35-38, 44)

### Task 35: DatePicker Field Handler

**Files:** `src/fields/time-place/date-picker.field.ts` + `tests/unit/date-picker.field.test.ts`

`render`: Inline keyboard calendar showing month grid. Navigation buttons (prev/next month). User taps a day. `validate`: Parse date, check against `min` (earliest date) and `max` (latest date). Format: ISO 8601. 8 tests.

### Task 36: TimePicker Field Handler

**Files:** `src/fields/time-place/time-picker.field.ts` + `tests/unit/time-picker.field.test.ts`

`render`: Text input or inline keyboard with hour/minute selection. Support `metadata.use12Hour`. `validate`: Parse HH:MM format. 5 tests.

### Task 37: Location Field Handler

**Files:** `src/fields/time-place/location.field.ts` + `tests/unit/location.field.test.ts`

`render`: `conversation.waitFor(':location')`. `parseResponse`: Extract `latitude`, `longitude`. 4 tests.

### Task 38: DateRange Field Handler

**Files:** `src/fields/time-place/date-range.field.ts` + `tests/unit/date-range.field.test.ts`

`render`: Two sequential DatePicker prompts (start date → end date). `validate`: End date >= start date. Reuses DatePicker logic. Depends on Task 35. 6 tests.

### Task 44: SchedulePicker Field Handler

**Files:** `src/fields/time-place/schedule-picker.field.ts` + `tests/unit/schedule-picker.field.test.ts`

`render`: First select date (calendar), then show available time slots for that date. Slots from `metadata.availableSlots` or `metadata.slotDataSource`. Returns `SchedulePickerResult`. `validate`: Check slot is available. 6 tests.

**Commit:**

```
git commit -m "feat(input-engine): add time/place field handlers - DatePicker, TimePicker, Location, DateRange, SchedulePicker (Tasks 35-38, 44)"
```

---

## Phase 10: Cross-Cutting & Polish (Tasks 39-40)

### Task 39: Event Registration

**Files:**

- Modify: `packages/event-bus/src/event-bus.events.ts`

- [ ] **Step 1: Add input-engine events to TempotEvents interface**

Add 5 events with INLINE payload types (NO imports from @tempot/input-engine):

```typescript
// Input Engine events
'input-engine.form.started': {
  formId: string;
  userId: string;
  chatId: number;
  fieldCount: number;
  timestamp: Date;
};
'input-engine.form.completed': {
  formId: string;
  userId: string;
  fieldCount: number;
  durationMs: number;
  hadPartialSave: boolean;
};
'input-engine.form.cancelled': {
  formId: string;
  userId: string;
  fieldsCompleted: number;
  totalFields: number;
  reason: 'user_cancel' | 'timeout' | 'max_retries';
};
'input-engine.form.resumed': {
  formId: string;
  userId: string;
  resumedFromField: number;
  totalFields: number;
};
'input-engine.field.validated': {
  formId: string;
  userId: string;
  fieldType: string;
  fieldName: string;
  valid: boolean;
  retryCount: number;
};
```

- [ ] **Step 2: Verify event-bus tests still pass**

Run: `pnpm --filter @tempot/event-bus test`
Expected: PASS

- [ ] **Step 3: Commit**

```
git commit -m "feat(event-bus): register input-engine events in TempotEvents (Task 39)"
```

---

### Task 40: Barrel Exports

**Files:**

- Modify: `packages/input-engine/src/index.ts`

- [ ] **Step 1: Write comprehensive barrel exports**

Export all types, contracts, errors, config, guard, FormRunner, FieldHandlerRegistry, all 39 field handlers, storage adapter, callback utils. All with `.js` extensions. Use `export type { ... }` for interfaces/types.

- [ ] **Step 2: Verify build succeeds**

Run: `pnpm --filter @tempot/input-engine build`
Expected: Exit 0

- [ ] **Step 3: Run all tests**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```
git commit -m "feat(input-engine): add barrel exports (Task 40)"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `pnpm --filter @tempot/input-engine test` — ALL PASS
- [ ] `pnpm --filter @tempot/input-engine build` — Exit 0
- [ ] `pnpm --filter @tempot/event-bus test` — ALL PASS (no regression)
- [ ] No `console.*` in `src/` (Rule LXXIV)
- [ ] No `any` types (Rule)
- [ ] All imports use `.js` extensions
- [ ] All public APIs return `Result<T, AppError>` (Rule XXII)
- [ ] All user-facing text uses `t()` from i18n-core (Rule XXXIX)
- [ ] 0 phantom dependencies (every import maps to package.json)
- [ ] `pnpm spec:validate 011-input-engine-package` — 0 CRITICAL

---

## Task Dependency Summary

```
Phase 1: Task 0 (scaffolding)
  ↓
Phase 2: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 (sequential)
  ↓
Phase 3-9: Tasks 7-38, 41-48 (parallel after Phase 2, except DateRange→DatePicker)
  ↓
Phase 10: Task 39 (events) + Task 40 (barrel) — depends on all above
```
