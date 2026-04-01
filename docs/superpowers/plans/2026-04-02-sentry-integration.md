# Sentry Integration Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@tempot/sentry` package that wraps `@sentry/node 8.x` behind a `TEMPOT_SENTRY` toggle, completing the Rule XXIV three-way error reference link.

**Architecture:** Standalone package with inverted toggle (disabled by default). SDK initialization is conditional on `TEMPOT_SENTRY=true`. `SentryReporter` tags every Sentry event with the `ERR-YYYYMMDD-XXXX` reference code from `AppError`. Returns `ok(null)` when disabled — callers never need to handle "disabled" as an error.

**Tech Stack:** `@sentry/node 8.x`, `@tempot/shared` (AppError, Result, generateErrorReference), neverthrow 8.2.0, TypeScript 5.9.3, Vitest 4.1.0

**Spec:** `docs/superpowers/specs/2026-04-02-sentry-integration-design.md`

**Key references for implementer:**

- Toggle pattern: `packages/shared/src/toggle/toggle.guard.ts`
- Error reference generator: `packages/shared/src/error-reference/error-reference.generator.ts`
- AppError class: `packages/shared/src/shared.errors.ts`
- Package checklist: `docs/developer/package-creation-checklist.md`
- Existing package example: `packages/storage-engine/` (file structure, package.json, tsconfig, vitest.config)

---

## File Structure

| File                                                 | Responsibility                              |
| ---------------------------------------------------- | ------------------------------------------- |
| `packages/sentry/package.json`                       | Package config, deps, scripts               |
| `packages/sentry/tsconfig.json`                      | TypeScript config extending root            |
| `packages/sentry/vitest.config.ts`                   | Test runner config                          |
| `packages/sentry/.gitignore`                         | Ignore compiled output                      |
| `packages/sentry/src/index.ts`                       | Public API re-exports                       |
| `packages/sentry/src/sentry.constants.ts`            | Tag names, defaults (Rule VI)               |
| `packages/sentry/src/sentry.errors.ts`               | Error codes (Rule XXII)                     |
| `packages/sentry/src/sentry.types.ts`                | SentryConfig, SentryReporterDeps            |
| `packages/sentry/src/sentry.toggle.ts`               | Custom inverted toggle guard                |
| `packages/sentry/src/sentry.client.ts`               | SDK init + shutdown                         |
| `packages/sentry/src/sentry.reporter.ts`             | Error reporting with reference code tagging |
| `packages/sentry/tests/unit/sentry.toggle.test.ts`   | Toggle guard tests                          |
| `packages/sentry/tests/unit/sentry.client.test.ts`   | SDK init/close tests                        |
| `packages/sentry/tests/unit/sentry.reporter.test.ts` | Reporter tests                              |

---

### Task 1: Package Scaffolding

**Files:**

- Create: `packages/sentry/package.json`
- Create: `packages/sentry/tsconfig.json`
- Create: `packages/sentry/vitest.config.ts`
- Create: `packages/sentry/.gitignore`

- [ ] **Step 1: Create package directory**

```bash
mkdir -p packages/sentry/src packages/sentry/tests/unit
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "@tempot/sentry",
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
    "@sentry/node": "8.x",
    "@tempot/shared": "workspace:*",
    "neverthrow": "8.2.0"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

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

- [ ] **Step 4: Create vitest.config.ts**

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
    ],
  },
});
```

- [ ] **Step 5: Create .gitignore**

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

- [ ] **Step 6: Install dependencies**

Run: `pnpm install`
Expected: lockfile updates, `@sentry/node` resolves to 8.x

- [ ] **Step 7: Verify scaffolding**

Run: `ls packages/sentry/`
Expected: package.json, tsconfig.json, vitest.config.ts, .gitignore, src/, tests/

- [ ] **Step 8: Commit**

```bash
git add packages/sentry/
git commit -m "chore(sentry): scaffold @tempot/sentry package"
```

---

### Task 2: Constants, Error Codes, and Types

**Files:**

- Create: `packages/sentry/src/sentry.constants.ts`
- Create: `packages/sentry/src/sentry.errors.ts`
- Create: `packages/sentry/src/sentry.types.ts`
- Create: `packages/sentry/src/index.ts` (initial, re-exports only these)

- [ ] **Step 1: Create sentry.constants.ts**

```typescript
/** Sentry tag name for the ERR-YYYYMMDD-XXXX reference code. */
export const SENTRY_TAG_ERROR_REFERENCE = 'errorReference';

/** Sentry tag name for the Rule XXII dot-notation error code. */
export const SENTRY_TAG_ERROR_CODE = 'errorCode';

/** Sentry context name for AppError details. */
export const SENTRY_CONTEXT_APP_ERROR = 'appError';

/** Default error sample rate (1.0 = capture all errors). */
export const SENTRY_DEFAULT_SAMPLE_RATE = 1.0;

/** Default timeout in ms for flushing events on shutdown. */
export const SENTRY_DEFAULT_CLOSE_TIMEOUT_MS = 2000;

/** Environment variable name for the Sentry DSN. */
export const SENTRY_DSN_ENV_VAR = 'SENTRY_DSN';

/** Environment variable name for the Sentry toggle. */
export const SENTRY_TOGGLE_ENV_VAR = 'TEMPOT_SENTRY';
```

- [ ] **Step 2: Create sentry.errors.ts**

```typescript
/** Error codes for @tempot/sentry (Rule XXII dot-notation). */
export const SENTRY_ERRORS = {
  DSN_MISSING: 'sentry.dsn_missing',
  INIT_FAILED: 'sentry.init_failed',
  NOT_INITIALIZED: 'sentry.not_initialized',
  REPORT_FAILED: 'sentry.report_failed',
  CLOSE_FAILED: 'sentry.close_failed',
} as const;
```

- [ ] **Step 3: Create sentry.types.ts**

```typescript
/**
 * Configuration for Sentry SDK initialization.
 * DSN and environment are required when toggle is enabled.
 */
export interface SentryConfig {
  /** Sentry Data Source Name. */
  dsn: string;
  /** Deployment environment (e.g. 'production', 'staging'). */
  environment: string;
  /** Application release version. */
  release?: string;
  /** Error sample rate, 0.0-1.0. Defaults to SENTRY_DEFAULT_SAMPLE_RATE (1.0). */
  sampleRate?: number;
  /** Performance tracing sample rate, 0.0-1.0. Defaults to 0 (disabled). */
  tracesSampleRate?: number;
}
```

- [ ] **Step 4: Create index.ts (initial exports)**

```typescript
export * from './sentry.constants.js';
export * from './sentry.errors.js';
export * from './sentry.types.js';
```

- [ ] **Step 5: Verify build compiles**

Run: `pnpm --filter @tempot/sentry build`
Expected: tsc completes with no errors, `dist/` contains .js and .d.ts files

- [ ] **Step 6: Commit**

```bash
git add packages/sentry/src/
git commit -m "feat(sentry): add constants, error codes, and types"
```

---

### Task 3: Inverted Toggle Guard

**Files:**

- Create: `packages/sentry/src/sentry.toggle.ts`
- Create: `packages/sentry/tests/unit/sentry.toggle.test.ts`
- Modify: `packages/sentry/src/index.ts` (add export)

The standard `createToggleGuard` from `@tempot/shared` defaults to **enabled** (absence of env var = enabled). Sentry must default to **disabled** (Section 30). This task creates a custom toggle that inverts the default: enabled ONLY when `TEMPOT_SENTRY=true` explicitly.

- [ ] **Step 1: Write the failing toggle tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sentryToggle } from '../../src/sentry.toggle.js';

describe('sentryToggle', () => {
  beforeEach(() => {
    delete process.env.TEMPOT_SENTRY;
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
  });

  it('is disabled by default when env var is not set', () => {
    expect(sentryToggle.isEnabled()).toBe(false);
  });

  it('is disabled when env var is "false"', () => {
    process.env.TEMPOT_SENTRY = 'false';
    expect(sentryToggle.isEnabled()).toBe(false);
  });

  it('is enabled when env var is "true"', () => {
    process.env.TEMPOT_SENTRY = 'true';
    expect(sentryToggle.isEnabled()).toBe(true);
  });

  it('is disabled for any value other than "true"', () => {
    process.env.TEMPOT_SENTRY = 'yes';
    expect(sentryToggle.isEnabled()).toBe(false);
  });

  it('exposes envVar property', () => {
    expect(sentryToggle.envVar).toBe('TEMPOT_SENTRY');
  });

  it('exposes packageName property', () => {
    expect(sentryToggle.packageName).toBe('sentry');
  });

  it('responds to runtime env var changes', () => {
    expect(sentryToggle.isEnabled()).toBe(false);
    process.env.TEMPOT_SENTRY = 'true';
    expect(sentryToggle.isEnabled()).toBe(true);
    delete process.env.TEMPOT_SENTRY;
    expect(sentryToggle.isEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/sentry test`
Expected: FAIL — module `../../src/sentry.toggle.js` not found or `sentryToggle` not exported

- [ ] **Step 3: Write sentry.toggle.ts implementation**

```typescript
import { SENTRY_TOGGLE_ENV_VAR } from './sentry.constants.js';

/**
 * Inverted toggle guard for Sentry.
 *
 * Unlike the standard createToggleGuard (which defaults to enabled),
 * Sentry is DISABLED by default per Section 30 of the architecture spec.
 * Enabled ONLY when TEMPOT_SENTRY=true explicitly.
 */
export const sentryToggle = {
  isEnabled(): boolean {
    return process.env[SENTRY_TOGGLE_ENV_VAR] === 'true';
  },
  envVar: SENTRY_TOGGLE_ENV_VAR,
  packageName: 'sentry',
} as const;
```

- [ ] **Step 4: Add export to index.ts**

Add this line to `packages/sentry/src/index.ts`:

```typescript
export * from './sentry.toggle.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tempot/sentry test`
Expected: All 7 toggle tests PASS

- [ ] **Step 6: Verify build**

Run: `pnpm --filter @tempot/sentry build`
Expected: tsc completes with no errors

- [ ] **Step 7: Commit**

```bash
git add packages/sentry/
git commit -m "feat(sentry): add inverted toggle guard (default disabled)"
```

---

### Task 4: Sentry Client (SDK Init + Shutdown)

**Files:**

- Create: `packages/sentry/src/sentry.client.ts`
- Create: `packages/sentry/tests/unit/sentry.client.test.ts`
- Modify: `packages/sentry/src/index.ts` (add export)

- [ ] **Step 1: Write the failing client tests**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ok } from 'neverthrow';

// Mock @sentry/node BEFORE importing sentry.client
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  close: vi.fn().mockResolvedValue(true),
}));

import * as Sentry from '@sentry/node';
import { initSentry, closeSentry } from '../../src/sentry.client.js';

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
  });

  it('returns ok and does not call Sentry.init when disabled', () => {
    const result = initSentry();
    expect(result.isOk()).toBe(true);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('returns err when enabled but SENTRY_DSN is missing', () => {
    process.env.TEMPOT_SENTRY = 'true';
    const result = initSentry();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('sentry.dsn_missing');
    }
  });

  it('calls Sentry.init with correct config when enabled', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    const result = initSentry({ environment: 'test' });
    expect(result.isOk()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@sentry.io/123',
        environment: 'test',
      }),
    );
  });

  it('uses DSN from config parameter over env var', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://env@sentry.io/1';
    const result = initSentry({
      dsn: 'https://param@sentry.io/2',
      environment: 'staging',
    });
    expect(result.isOk()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://param@sentry.io/2',
      }),
    );
  });

  it('returns err when Sentry.init throws', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    vi.mocked(Sentry.init).mockImplementationOnce(() => {
      throw new Error('SDK init failed');
    });
    const result = initSentry();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('sentry.init_failed');
    }
  });

  it('applies default sample rate from constants', () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    initSentry();
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ sampleRate: 1.0 }));
  });
});

describe('closeSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEMPOT_SENTRY;
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
  });

  it('returns ok when disabled (no-op)', async () => {
    const result = await closeSentry();
    expect(result.isOk()).toBe(true);
    expect(Sentry.close).not.toHaveBeenCalled();
  });

  it('calls Sentry.close with timeout when enabled', async () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    initSentry();
    const result = await closeSentry(3000);
    expect(result.isOk()).toBe(true);
    expect(Sentry.close).toHaveBeenCalledWith(3000);
  });

  it('uses default timeout when none provided', async () => {
    process.env.TEMPOT_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://key@sentry.io/123';
    initSentry();
    const result = await closeSentry();
    expect(result.isOk()).toBe(true);
    expect(Sentry.close).toHaveBeenCalledWith(2000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/sentry test`
Expected: FAIL — `initSentry` / `closeSentry` not found

- [ ] **Step 3: Write sentry.client.ts implementation**

```typescript
import * as Sentry from '@sentry/node';
import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { sentryToggle } from './sentry.toggle.js';
import { SENTRY_ERRORS } from './sentry.errors.js';
import type { SentryConfig } from './sentry.types.js';
import {
  SENTRY_DEFAULT_SAMPLE_RATE,
  SENTRY_DEFAULT_CLOSE_TIMEOUT_MS,
  SENTRY_DSN_ENV_VAR,
} from './sentry.constants.js';

let initialized = false;

/**
 * Initialize the Sentry SDK.
 * No-op if TEMPOT_SENTRY is not 'true'.
 * Requires SENTRY_DSN env var (or config.dsn) when enabled.
 */
export function initSentry(config?: Partial<SentryConfig>): Result<void, AppError> {
  if (!sentryToggle.isEnabled()) {
    return ok(undefined);
  }

  const dsn = config?.dsn ?? process.env[SENTRY_DSN_ENV_VAR];
  if (!dsn) {
    return err(
      new AppError(SENTRY_ERRORS.DSN_MISSING, {
        envVar: SENTRY_DSN_ENV_VAR,
      }),
    );
  }

  try {
    Sentry.init({
      dsn,
      environment: config?.environment ?? 'production',
      release: config?.release,
      sampleRate: config?.sampleRate ?? SENTRY_DEFAULT_SAMPLE_RATE,
      tracesSampleRate: config?.tracesSampleRate ?? 0,
    });
    initialized = true;
    return ok(undefined);
  } catch (error: unknown) {
    return err(new AppError(SENTRY_ERRORS.INIT_FAILED, { error }));
  }
}

/**
 * Flush pending events and close the Sentry SDK.
 * Rule XVII: Graceful Shutdown.
 * AsyncResult<void> = Promise<Result<void, AppError>>
 */
export async function closeSentry(timeoutMs?: number): AsyncResult<void> {
  if (!sentryToggle.isEnabled() || !initialized) {
    return ok(undefined);
  }

  try {
    await Sentry.close(timeoutMs ?? SENTRY_DEFAULT_CLOSE_TIMEOUT_MS);
    initialized = false;
    return ok(undefined);
  } catch (error: unknown) {
    return err(new AppError(SENTRY_ERRORS.CLOSE_FAILED, { error }));
  }
}

/** Check if the SDK has been initialized. */
export function isSentryInitialized(): boolean {
  return initialized;
}
```

- [ ] **Step 4: Add export to index.ts**

Add to `packages/sentry/src/index.ts`:

```typescript
export * from './sentry.client.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tempot/sentry test`
Expected: All client tests + toggle tests PASS

- [ ] **Step 6: Verify build**

Run: `pnpm --filter @tempot/sentry build`
Expected: tsc completes with no errors

- [ ] **Step 7: Commit**

```bash
git add packages/sentry/
git commit -m "feat(sentry): add SDK init and graceful shutdown"
```

---

### Task 5: Sentry Reporter (Error Reporting + Reference Code Tagging)

**Files:**

- Create: `packages/sentry/src/sentry.reporter.ts`
- Create: `packages/sentry/tests/unit/sentry.reporter.test.ts`
- Modify: `packages/sentry/src/index.ts` (add export)

This is the core of Rule XXIV — the reporter tags every Sentry event with its `ERR-YYYYMMDD-XXXX` reference code, completing the three-way link.

- [ ] **Step 1: Write the failing reporter tests**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppError, generateErrorReference } from '@tempot/shared';

// Mock @sentry/node
const mockCaptureException = vi.fn().mockReturnValue('event-id-123');
const mockWithScope = vi.fn().mockImplementation((callback: (scope: unknown) => void) => {
  const mockScope = {
    setTag: vi.fn(),
    setContext: vi.fn(),
  };
  callback(mockScope);
  return mockScope;
});

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  close: vi.fn().mockResolvedValue(true),
  captureException: mockCaptureException,
  withScope: mockWithScope,
}));

import { SentryReporter } from '../../src/sentry.reporter.js';
import { initSentry } from '../../src/sentry.client.js';
import {
  SENTRY_TAG_ERROR_REFERENCE,
  SENTRY_TAG_ERROR_CODE,
  SENTRY_CONTEXT_APP_ERROR,
} from '../../src/sentry.constants.js';

describe('SentryReporter', () => {
  let reporter: SentryReporter;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
    reporter = new SentryReporter();
  });

  afterEach(() => {
    delete process.env.TEMPOT_SENTRY;
    delete process.env.SENTRY_DSN;
  });

  describe('report', () => {
    it('returns ok(null) when toggle is disabled', () => {
      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('sets errorReference tag from error.referenceCode', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      (error as { referenceCode: string }).referenceCode = 'ERR-20260402-ABCD';

      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setTag).toHaveBeenCalledWith(
        SENTRY_TAG_ERROR_REFERENCE,
        'ERR-20260402-ABCD',
      );
    });

    it('generates reference code when error has none', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      const refCodeCall = mockScope.setTag.mock.calls.find(
        (c: string[]) => c[0] === SENTRY_TAG_ERROR_REFERENCE,
      );
      expect(refCodeCall).toBeDefined();
      expect(refCodeCall![1]).toMatch(/^ERR-\d{8}-[A-Z0-9]{4}$/);
    });

    it('sets errorCode tag from error.code', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('auth.permission_denied');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setTag).toHaveBeenCalledWith(
        SENTRY_TAG_ERROR_CODE,
        'auth.permission_denied',
      );
    });

    it('sets appError context with code, i18nKey, and details', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('db.query_failed', { table: 'users' });
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setContext).toHaveBeenCalledWith(
        SENTRY_CONTEXT_APP_ERROR,
        expect.objectContaining({
          code: 'db.query_failed',
          i18nKey: 'errors.db.query_failed',
        }),
      );
    });

    it('returns the Sentry event ID on success', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('event-id-123');
    });

    it('returns err when captureException throws', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      mockWithScope.mockImplementationOnce(() => {
        throw new Error('Sentry SDK crash');
      });

      const error = new AppError('test.error');
      const result = reporter.report(error);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('sentry.report_failed');
      }
    });
  });

  describe('reportWithReference', () => {
    it('uses the explicit reference code instead of error.referenceCode', () => {
      process.env.TEMPOT_SENTRY = 'true';
      process.env.SENTRY_DSN = 'https://key@sentry.io/123';
      initSentry();

      const error = new AppError('test.error');
      (error as { referenceCode: string }).referenceCode = 'ERR-20260402-ORIG';

      const result = reporter.reportWithReference(error, 'ERR-20260402-OVRD');
      expect(result.isOk()).toBe(true);

      const scopeCallback = mockWithScope.mock.calls[0][0];
      const mockScope = { setTag: vi.fn(), setContext: vi.fn() };
      scopeCallback(mockScope);

      expect(mockScope.setTag).toHaveBeenCalledWith(
        SENTRY_TAG_ERROR_REFERENCE,
        'ERR-20260402-OVRD',
      );
    });

    it('returns ok(null) when disabled', () => {
      const error = new AppError('test.error');
      const result = reporter.reportWithReference(error, 'ERR-20260402-XXXX');
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/sentry test`
Expected: FAIL — `SentryReporter` not found

- [ ] **Step 3: Write sentry.reporter.ts implementation**

```typescript
import * as Sentry from '@sentry/node';
import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError, generateErrorReference } from '@tempot/shared';
import { sentryToggle } from './sentry.toggle.js';
import { isSentryInitialized } from './sentry.client.js';
import { SENTRY_ERRORS } from './sentry.errors.js';
import {
  SENTRY_TAG_ERROR_REFERENCE,
  SENTRY_TAG_ERROR_CODE,
  SENTRY_CONTEXT_APP_ERROR,
} from './sentry.constants.js';

/**
 * Reports errors to Sentry with Rule XXIV reference code tagging.
 *
 * Completes the three-way link:
 * ERR-YYYYMMDD-XXXX → user message ↔ Audit Log ↔ Sentry event
 */
export class SentryReporter {
  /**
   * Report an error to Sentry with its reference code as a tag.
   * Returns the Sentry event ID on success, null if disabled.
   */
  report(error: AppError): Result<string | null, AppError> {
    if (!sentryToggle.isEnabled()) {
      return ok(null);
    }

    if (!isSentryInitialized()) {
      return err(new AppError(SENTRY_ERRORS.NOT_INITIALIZED));
    }

    const referenceCode = error.referenceCode ?? generateErrorReference();
    return this.captureWithScope(error, referenceCode);
  }

  /**
   * Report with an explicit reference code override.
   * Returns null if disabled.
   */
  reportWithReference(error: AppError, referenceCode: string): Result<string | null, AppError> {
    if (!sentryToggle.isEnabled()) {
      return ok(null);
    }

    if (!isSentryInitialized()) {
      return err(new AppError(SENTRY_ERRORS.NOT_INITIALIZED));
    }

    return this.captureWithScope(error, referenceCode);
  }

  private captureWithScope(
    error: AppError,
    referenceCode: string,
  ): Result<string | null, AppError> {
    try {
      let eventId: string | undefined;

      Sentry.withScope((scope) => {
        scope.setTag(SENTRY_TAG_ERROR_REFERENCE, referenceCode);
        scope.setTag(SENTRY_TAG_ERROR_CODE, error.code);
        scope.setContext(SENTRY_CONTEXT_APP_ERROR, {
          code: error.code,
          i18nKey: error.i18nKey,
          details: error.details ?? null,
        });
        eventId = Sentry.captureException(error);
      });

      return ok(eventId ?? null);
    } catch (captureError: unknown) {
      return err(
        new AppError(SENTRY_ERRORS.REPORT_FAILED, {
          originalError: error.code,
          captureError,
        }),
      );
    }
  }
}
```

- [ ] **Step 4: Add export to index.ts**

Add to `packages/sentry/src/index.ts`:

```typescript
export * from './sentry.reporter.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tempot/sentry test`
Expected: All tests PASS (toggle + client + reporter)

- [ ] **Step 6: Verify build**

Run: `pnpm --filter @tempot/sentry build`
Expected: tsc completes with no errors

- [ ] **Step 7: Commit**

```bash
git add packages/sentry/
git commit -m "feat(sentry): add SentryReporter with Rule XXIV reference code tagging"
```

---

### Task 6: Final Verification and Package Checklist

**Files:**

- No new files — verification only

This task runs through the full package creation checklist (10 items from `docs/developer/package-creation-checklist.md`) and final quality gates.

- [ ] **Step 1: Checklist item 1 — .gitignore exists**

Run: `ls packages/sentry/.gitignore`
Expected: file exists

- [ ] **Step 2: Checklist item 2 — tsconfig has outDir: dist**

Run: `grep '"outDir"' packages/sentry/tsconfig.json`
Expected: `"outDir": "dist"`

- [ ] **Step 3: Checklist items 3-4 — main, types, exports point to dist/**

Run: `grep -E '"main"|"types"|"exports"' packages/sentry/package.json`
Expected: all reference `dist/`

- [ ] **Step 4: Checklist item 5 — build script**

Run: `grep '"build"' packages/sentry/package.json`
Expected: `"build": "tsc"`

- [ ] **Step 5: Checklist item 6 — vitest.config.ts exists**

Run: `ls packages/sentry/vitest.config.ts`
Expected: file exists

- [ ] **Step 6: Checklist item 7 — exact vitest version**

Run: `grep '"vitest"' packages/sentry/package.json`
Expected: `"vitest": "4.1.0"` (no caret)

- [ ] **Step 7: Checklist item 8 — no console.\* in src/**

Run: `grep -rn "console\." packages/sentry/src/`
Expected: no output

- [ ] **Step 8: Checklist item 9 — no phantom dependencies**

Verify every dep in package.json is imported in src/:

- `@sentry/node` → imported in `sentry.client.ts` and `sentry.reporter.ts`
- `@tempot/shared` → imported in `sentry.client.ts` and `sentry.reporter.ts`
- `neverthrow` → imported in `sentry.client.ts` and `sentry.reporter.ts`

- [ ] **Step 9: Checklist item 10 — clean workspace (no .js in src/)**

Run: `Get-ChildItem packages/sentry/src -Recurse -Include "*.js","*.d.ts"`
Expected: no output

- [ ] **Step 10: Run full test suite**

Run: `pnpm --filter @tempot/sentry test`
Expected: All tests PASS

- [ ] **Step 11: Run full build**

Run: `pnpm --filter @tempot/sentry build`
Expected: tsc completes with no errors, `dist/` populated

- [ ] **Step 12: ESLint check**

Run: `pnpm --filter @tempot/sentry exec eslint src/`
Expected: no errors (max-lines: 200, max-lines-per-function: 50, max-params: 3)

- [ ] **Step 13: Commit if any fixes were needed**

If any checklist item required fixes:

```bash
git add packages/sentry/
git commit -m "fix(sentry): address package checklist findings"
```
