# Design: Sentry Integration Package

**Date**: 2026-04-02
**Status**: Approved
**Approach**: Standalone Package (`@tempot/sentry`)

## Problem

Rule XXIV mandates a three-way link for every system error:

```
ERR-YYYYMMDD-XXXX → user-facing message ↔ Audit Log entry ↔ Sentry event
```

Two of three links are implemented:

| Link                           | Status      | Location                                                |
| ------------------------------ | ----------- | ------------------------------------------------------- |
| Error Reference → User message | Implemented | `@tempot/shared` (`AppError.referenceCode`)             |
| Error Reference → Audit Log    | Implemented | `@tempot/logger` (`AuditLogger.resolveReferenceCode()`) |
| Error Reference → Sentry event | **Missing** | —                                                       |

Section 30 of the architecture spec lists Sentry as an independent pluggable module with its own toggle (`TEMPOT_SENTRY`, default `false`).

## Solution

A standalone package `packages/sentry/` (`@tempot/sentry`) that:

1. Wraps `@sentry/node 8.x` behind the standard toggle pattern
2. Tags every Sentry event with its `ERR-YYYYMMDD-XXXX` reference code
3. Provides a `SentryReporter` class for error forwarding
4. Supports graceful shutdown (Rule XVII)

## Architecture

### Package Position

```
@tempot/shared ──→ @tempot/sentry ──→ Sentry Cloud (external)
                        ↑
                   @sentry/node 8.x
```

- `@tempot/sentry` depends on `@tempot/shared` (AppError, Result, createToggleGuard)
- `@tempot/sentry` does NOT depend on `@tempot/logger` (separation of concerns)
- Consumers (application layer, grammY error handler) import from `@tempot/sentry`

### File Structure

```
packages/sentry/
  .gitignore
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts              — public API re-exports
    sentry.client.ts      — SDK initialization and shutdown
    sentry.reporter.ts    — error reporting with reference code tagging
    sentry.toggle.ts      — toggle guard (TEMPOT_SENTRY)
    sentry.types.ts       — SentryConfig, SentryReporterDeps interfaces
    sentry.constants.ts   — tag names, defaults
    sentry.errors.ts      — error codes
  tests/
    unit/
      sentry.client.test.ts
      sentry.reporter.test.ts
      sentry.toggle.test.ts
```

## Public API

### `sentry.types.ts`

```typescript
export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
}

export interface SentryReporterDeps {
  isEnabled: () => boolean;
}
```

### `sentry.client.ts`

```typescript
/**
 * Initialize the Sentry SDK. No-op if TEMPOT_SENTRY=false.
 * Requires SENTRY_DSN env var when enabled.
 */
export function initSentry(config?: Partial<SentryConfig>): Result<void, AppError>;

/**
 * Flush pending events and close the Sentry SDK.
 * Rule XVII: Graceful Shutdown.
 */
export function closeSentry(timeoutMs?: number): AsyncResult<void>;
```

### `sentry.reporter.ts`

```typescript
export class SentryReporter {
  /**
   * Report an error to Sentry with its reference code as a tag.
   * Returns the Sentry event ID on success.
   * No-op if toggle is disabled.
   */
  report(error: AppError): Result<string | null, AppError>;

  /**
   * Report with an explicit reference code override.
   */
  reportWithReference(error: AppError, referenceCode: string): Result<string | null, AppError>;
}
```

## Toggle Behavior (Rule XVI)

| `TEMPOT_SENTRY`   | `initSentry()`                       | `report()`                                 |
| ----------------- | ------------------------------------ | ------------------------------------------ |
| `false` (default) | Returns `ok()` silently, no SDK init | Returns `err(sentry.disabled)`             |
| `true`            | Initializes `@sentry/node` SDK       | Forwards to Sentry with reference code tag |
| `true` but no DSN | Returns `err(sentry.dsn_missing)`    | Returns `err(sentry.not_initialized)`      |

## Error Codes (Rule XXII)

| Code                     | Meaning                                    |
| ------------------------ | ------------------------------------------ |
| `sentry.disabled`        | Package disabled via `TEMPOT_SENTRY=false` |
| `sentry.dsn_missing`     | `SENTRY_DSN` env var not set when enabled  |
| `sentry.init_failed`     | `Sentry.init()` threw an exception         |
| `sentry.not_initialized` | `report()` called before `initSentry()`    |
| `sentry.report_failed`   | `Sentry.captureException()` failed         |

## Reference Code Tagging (Rule XXIV)

When `SentryReporter.report(error)` is called:

1. Extract `error.referenceCode` (or generate one if missing)
2. Call `Sentry.withScope(scope => { ... })`:
   - Set tag: `errorReference` = `ERR-YYYYMMDD-XXXX`
   - Set tag: `errorCode` = `error.code` (Rule XXII dot-notation)
   - Set context: `appError` = `{ code, i18nKey, details }`
3. Call `Sentry.captureException(error)`
4. Return the event ID

This completes the three-way link:

```
User sees:  "حدث خطأ. الرقم المرجعي: ERR-20260402-K7M2"
Audit Log:  { referenceCode: "ERR-20260402-K7M2", status: "FAILED" }
Sentry:     tags.errorReference = "ERR-20260402-K7M2"  ← this package
```

## Shutdown (Rule XVII)

`closeSentry()` calls `Sentry.close(timeoutMs)` to flush pending events. The application layer registers this with `ShutdownManager`. Default timeout: 2000ms.

## Constants (Rule VI)

All magic values externalized to `sentry.constants.ts`:

```typescript
export const SENTRY_TAG_ERROR_REFERENCE = 'errorReference';
export const SENTRY_TAG_ERROR_CODE = 'errorCode';
export const SENTRY_CONTEXT_APP_ERROR = 'appError';
export const SENTRY_DEFAULT_SAMPLE_RATE = 1.0;
export const SENTRY_DEFAULT_CLOSE_TIMEOUT_MS = 2000;
export const SENTRY_DSN_ENV_VAR = 'SENTRY_DSN';
```

## Dependencies

| Dependency       | Version   | Purpose                                                     |
| ---------------- | --------- | ----------------------------------------------------------- |
| `@sentry/node`   | `8.x`     | Error tracking SDK (Section 35.5)                           |
| `@tempot/shared` | workspace | AppError, Result, createToggleGuard, generateErrorReference |

No dependency on `@tempot/logger` — the Sentry package operates independently.

## Testing Strategy

All unit tests use **mocked `@sentry/node`** — no real DSN needed.

| Test File                 | Coverage                                                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sentry.client.test.ts`   | init with valid config, init when disabled (no-op), missing DSN error, close flushes, close when not initialized                                                              |
| `sentry.reporter.test.ts` | report sets reference code tag, report generates reference if missing, report when disabled returns err, reportWithReference uses explicit code, error code tag set correctly |
| `sentry.toggle.test.ts`   | default disabled, enabled when true, responds to runtime changes                                                                                                              |

## Out of Scope

- **Integration tests with real Sentry** — requires external account setup
- **Automatic wiring to grammY error handler** — application layer responsibility
- **Performance monitoring / tracing** — Sentry 8.x supports it but outside current scope
- **Sentry alerts configuration** — done in Sentry dashboard, not in code

## Compliance Matrix

| Rule                            | How Satisfied                                   |
| ------------------------------- | ----------------------------------------------- |
| XXIV (Error Reference)          | Reference code tagged on every Sentry event     |
| XVI (Pluggable)                 | `TEMPOT_SENTRY` toggle, default `false`         |
| XVII (Shutdown)                 | `closeSentry()` flushes pending events          |
| XXI (Result Pattern)            | All public methods return `Result<T, AppError>` |
| XXII (Error Codes)              | `sentry.*` dot-notation codes                   |
| VI (No Hardcoded)               | All values in `sentry.constants.ts`             |
| LXXII-LXXVIII (Package Quality) | Follows package creation checklist              |
