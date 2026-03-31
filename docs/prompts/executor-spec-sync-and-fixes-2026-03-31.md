# Cross-Package Specification Sync & Code Fixes

**Severity:** P1 (high) — documentation–code drift and code defects across 5 packages
**Scope:** session-manager, i18n-core, regional-engine, storage-engine, ux-helpers
**Date:** 2026-03-31
**NOTE:** File renaming (Rule III) is explicitly OUT OF SCOPE for this prompt — it will be handled in a separate task.

---

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md`
- Workflow: `docs/developer/workflow-guide.md`
- Package Checklist: `docs/developer/package-creation-checklist.md`

## Toolchain

### Superpowers (Required Skills)

| Skill                            | Purpose                           | When to use                                         |
| -------------------------------- | --------------------------------- | --------------------------------------------------- |
| `using-git-worktrees`            | Isolated feature branch           | Phase 0: before any file changes                    |
| `dispatching-parallel-agents`    | Concurrent independent subagents  | Phase 1: dispatch 5 subagents (one per package)     |
| `test-driven-development`        | RED → GREEN → REFACTOR            | Phase 1: for any fix that changes runtime behavior  |
| `verification-before-completion` | Evidence-based final check        | Phase 2: run ALL tests + build, paste actual output |
| `requesting-code-review`         | Review fixes against constitution | Phase 2: review all changes against findings list   |

---

## Context

A verified analysis of 5 packages revealed:

1. **Spec drift** — spec.md, plan.md, and tasks.md contain outdated types, signatures, and file structures that no longer match the actual code
2. **Code defects** — unchecked Result values, missing shutdown hooks, hardcoded values violating Rule VI
3. **Missing tests** — performance tests required by NFRs, untested error paths, zero-coverage modules
4. **Missing ADRs** — design decisions made during implementation that lack formal ADR documentation

Each agent below MUST verify the current state of every file before making changes.
If a finding is already resolved, skip and report as "already resolved."

---

## Phase 0: Create Worktree

**Activate `using-git-worktrees`.** Branch: `fix/spec-sync-2026-03-31`

---

## Phase 1: Execute Fixes

**Activate `dispatching-parallel-agents`.** Dispatch 5 subagents — one per package.
Each subagent works ONLY within its assigned package scope. No cross-package file edits.

**Important for all agents:**

- For documentation updates: update spec.md/plan.md/tasks.md to match the ACTUAL CODE. The code is the source of truth.
- For code fixes: follow TDD (RED → GREEN → REFACTOR) per Constitution Rule XXXIV.
- Do NOT rename files. File renaming is out of scope.
- All code, comments, variables in English.
- Every public API returns `Result<T, AppError>` via neverthrow (unless an ADR exemption is documented).

---

### Agent 1: session-manager

**Package:** `packages/session-manager`
**Spec artifacts:** `specs/004-session-manager-package/`

#### Fix 1.1: Graceful Shutdown for BullMQ Worker (HIGH — Rule XVII violation)

The `createSessionWorker()` function in `src/worker.ts` creates a BullMQ `Worker` directly (line 54) but:

- Does NOT accept a `ShutdownManager` parameter
- Does NOT register `worker.close()` as a shutdown hook
- The `SessionWorkerOptions` interface (lines 14-23) is missing `shutdownManager`

**Fix:**

1. Import `ShutdownManager` from `@tempot/shared`
2. Add `shutdownManager?: ShutdownManager` to `SessionWorkerOptions` (after line 22)
3. After creating the worker (line 54), if `shutdownManager` is provided, register `worker.close()`:
   ```typescript
   const worker = new Worker(...);
   if (options.shutdownManager) {
     options.shutdownManager.register(async () => { await worker.close(); });
   }
   return worker;
   ```
4. Write a test in a new file `tests/unit/session.worker.test.ts` verifying:
   - Worker is created successfully with default options
   - `shutdownManager.register()` is called when `shutdownManager` is provided
   - The registered hook calls `worker.close()`

#### Fix 1.2: Unchecked Result Values in Provider (MEDIUM — Rule X violation)

In `src/provider.ts`, three Result values are silently discarded:

**a) Line 67:** `cache.expire()` result not checked

```typescript
// CURRENT (line 67):
await this.deps.cache.expire(key, DEFAULT_SESSION_TTL);

// FIX: check result and alert degradation on failure
const expireResult = await this.deps.cache.expire(key, DEFAULT_SESSION_TTL);
if (expireResult.isErr()) {
  this.alertDegradation('expire', expireResult.error);
}
```

**b) Line 82:** `cache.set()` after DB fallback not checked

```typescript
// CURRENT (line 82):
await this.deps.cache.set(key, session, DEFAULT_SESSION_TTL);

// FIX:
const syncResult = await this.deps.cache.set(key, session, DEFAULT_SESSION_TTL);
if (syncResult.isErr()) {
  this.alertDegradation('syncToCache', syncResult.error);
}
```

**c) Lines 113-118:** `eventBus.publish()` result not checked

```typescript
// CURRENT (line 114):
await this.deps.eventBus.publish('session-manager.session.updated', { ... });

// FIX:
const publishResult = await this.deps.eventBus.publish('session-manager.session.updated', { ... });
if (publishResult.isErr()) {
  this.alertDegradation('publishSessionUpdate', publishResult.error);
}
```

For each fix, add corresponding unit tests in `tests/unit/provider.test.ts`:

- Test that `alertDegradation` is called when `cache.expire()` returns `err`
- Test that `alertDegradation` is called when `cache.set()` (sync-back) returns `err`
- Test that `alertDegradation` is called when `eventBus.publish()` returns `err`

#### Fix 1.3: Missing .js Extensions in Test Imports (HIGH — ESM compliance)

Some session-manager test files use relative imports without `.js` extensions, which fails under `--moduleResolution node16/nodenext`. Fix the following files:

- `tests/integration/session-integration.test.ts` — add `.js` to these imports:
  - `'../../src/types'` → `'../../src/types.js'`
  - `'../../src/provider'` → `'../../src/provider.js'`
  - `'../../src/repository'` → `'../../src/repository.js'`
  - `'../utils/test-redis'` → `'../utils/test-redis.js'`
  - `'../../src/constants'` → `'../../src/constants.js'`
- `tests/unit/context.test.ts` — add `.js`:
  - `'../../src/context'` → `'../../src/context.js'`
- `tests/unit/migration.test.ts` — add `.js`:
  - `'../../src/migrator'` → `'../../src/migrator.js'`
  - `'../../src/types'` → `'../../src/types.js'`
- `tests/utils/test-redis.ts` — add `.js`:
  - `'../../src/provider'` → `'../../src/provider.js'`

Note: `tests/unit/provider.test.ts` already has `.js` extensions — skip it.

#### Fix 1.4: Documentation Sync

**a) `specs/004-session-manager-package/spec.md` — update contract:**

- Find the `sessionContext` type definition. Update it to match the actual `ContextSession` interface in `src/context.ts` (NOT `Session`). The actual type is:
  ```typescript
  interface ContextSession {
    userId?: string;
    userRole?: string;
    timezone?: string;
    locale?: string;
    currencyCode?: string;
    countryCode?: string;
    [key: string]: unknown;
  }
  ```
  The spec currently says `AsyncLocalStorage<Session>` — change to `AsyncLocalStorage<ContextSession>`.

**b) `specs/004-session-manager-package/plan.md` — update file structure:**

- Find the directory structure section (around line 52-62). Update it to include all actual files: `repository.ts`, `worker.ts`, `migrator.ts`, `constants.ts`, and the actual test structure (`tests/unit/`, `tests/integration/`, `tests/utils/`).

**c) `specs/004-session-manager-package/tasks.md` — add missing task:**

- Add a task referencing the package creation checklist: `docs/developer/package-creation-checklist.md`
- Add a task for graceful shutdown hook integration (T-NEW)

---

### Agent 2: i18n-core

**Package:** `packages/i18n-core`
**Spec artifacts:** `specs/007-i18n-core-package/`

#### Fix 2.1: Hardcoded Language Configuration (HIGH — Rule VI violation)

`src/i18n.config.ts` hardcodes `lng: 'ar'`, `fallbackLng: 'en'`, `supportedLngs: ['ar', 'en']`.
`src/t.ts` line 39 independently hardcodes `'ar'` as the fallback.

**The spec (FR-006) requires:** "System MUST implement an automatic fallback mechanism to the `DEFAULT_LANGUAGE` defined in `.env`."

**Fix:**

1. In `src/i18n.config.ts`, read from environment with fallbacks:

   ```typescript
   const DEFAULT_LANGUAGE = process.env.TEMPOT_DEFAULT_LANGUAGE ?? 'ar';
   const FALLBACK_LANGUAGE = process.env.TEMPOT_FALLBACK_LANGUAGE ?? 'en';

   export const i18nConfig = {
     lng: DEFAULT_LANGUAGE,
     fallbackLng: FALLBACK_LANGUAGE,
     supportedLngs: [DEFAULT_LANGUAGE, FALLBACK_LANGUAGE].filter(
       (v, i, a) => a.indexOf(v) === i, // deduplicate
     ),
     interpolation: { escapeValue: false },
   };
   ```

2. In `src/t.ts` line 39, replace `'ar'` with a reference to the config:
   ```typescript
   import { i18nConfig } from './i18n.config.js';
   // ...
   const lang: string = typeof rawLang === 'string' ? rawLang : i18nConfig.lng;
   ```
3. Update tests in `tests/unit/i18n-config.test.ts`:
   - Test that defaults are `'ar'` and `'en'` when env vars are not set
   - Test that env vars override the defaults (use `vi.stubEnv` or similar)
4. Update tests in `tests/unit/t.test.ts`:
   - Test that the fallback language matches `i18nConfig.lng` rather than hardcoded `'ar'`

#### Fix 2.2: Create ADR for t() Returning string (MEDIUM)

The `t()` function returns `string` instead of `Result<string, AppError>`. This is a deliberate design decision (i18next always returns a string, never fails) but lacks formal documentation.

**Create** `docs/architecture/adr/ADR-032-i18n-t-returns-string.md`:

```markdown
# ADR-032: Translation function t() returns string directly

## Status

Accepted

## Context

The project uses neverthrow's Result pattern for all functions that can fail (Constitution Rule X). The `t()` function wraps `i18next.t()`, which by design always returns a string — either the translated text or the key name itself as a fallback. The function cannot fail in a way that would benefit from Result wrapping.

## Decision

The `t()` function in `@tempot/i18n-core` returns `string` directly, not `Result<string, AppError>`.

## Rationale

1. `i18next.t()` guarantees a return value (translation or key name)
2. `t()` is called at extremely high frequency (every user-facing message)
3. Wrapping in Result would force `.unwrapOr()` at every call site with no meaningful error handling
4. The "failure" mode (missing translation → return key name) is a valid i18next behavior, not an error

## Consequences

- `t()` is exempt from the Result pattern requirement
- Missing translation keys surface as visible key names in UI (detectable by QA/cms:check)
- No `AppError` is produced for missing translations — detection relies on `cms:check` tooling
```

#### Fix 2.3: Performance Test for SC-002 (MEDIUM)

The spec defines SC-002: "Translation key retrieval and rendering overhead must be < 1ms per message."

**Create** `tests/unit/i18n.performance.test.ts` (or add to an existing test file):

```typescript
describe('SC-002: translation performance', () => {
  it('should resolve translation key in < 1ms', () => {
    // Initialize i18next with actual resources
    // Call t() 100 times, measure average
    // Assert average < 1ms per call
  });
});
```

#### Fix 2.4: Documentation Sync

**a) `specs/007-i18n-core-package/plan.md`:**

- **Task 4 (around line 179):** Currently truncated (just `...` and empty code fences). Fill in the actual implementation details from `scripts/cms-check.ts`:
  - `detectHardcodedStrings(dir: string)` — scans `.ts` files for hardcoded Arabic strings
  - `validateLocaleFiles(dir: string)` — validates locale JSON files against a Zod schema
  - Returns `CmsCheckResult` with `violations` and `validationErrors`
- **Tech stack (around line 9):** Remove `i18next-fs-backend` (never used — the loader uses `glob` + `fs.readFile` instead). Add `i18next-parser`.
- **`loadModuleLocales()` signature (around line 98):** Update to match actual code: `async function loadModuleLocales(): Promise<Result<void, AppError>>` (no `i18n` parameter, uses global i18next import)

**b) `specs/007-i18n-core-package/tasks.md`:**

- **Tech stack (around line 7):** Add `@tempot/session-manager` to the tech stack list (it's a dependency used in `t.ts`)
- **T009 file path:** Change `src/helpers.ts` to `src/locale-info.ts` (actual file name)
- **T010 test file path:** Change `tests/unit/t-function.test.ts` to `tests/unit/t.test.ts` (actual file name)

**c) `specs/007-i18n-core-package/spec.md`:**

- **FR-006 (around line 71):** Add a note clarifying the env var names: `TEMPOT_DEFAULT_LANGUAGE` (default: `ar`) and `TEMPOT_FALLBACK_LANGUAGE` (default: `en`)

---

### Agent 3: regional-engine

**Package:** `packages/regional-engine`
**Spec artifacts:** `specs/009-regional-engine/`

#### Fix 3.1: GeoSelectField Uses name_ar Instead of i18nKey (HIGH — i18n gap)

`src/geo-select.field.ts` lines 16 and 25 hardcode `state.name_ar` and `city.name_ar` as labels, bypassing the i18n system. The `i18nKey` field exists on both `GeoState` and `GeoCity` interfaces but is never used for display.

**Fix:** The `GeoSelectField` cannot translate directly because `regional-engine` does not depend on `i18n-core`. Instead, pass the `i18nKey` so consumers can translate:

1. Update the `GeoOption` interface (or create one if it doesn't exist) to include `i18nKey`:
   ```typescript
   export interface GeoOption {
     label: string; // Keep for backward compat — use name_ar as default
     value: string;
     i18nKey: string; // NEW — allows consumers to translate
   }
   ```
2. In `buildStateMenu` and `buildCityMenu`, populate `i18nKey`:
   ```typescript
   states.map((state) => ({
     label: state.name_ar,
     value: state.id,
     i18nKey: state.i18nKey,
   })),
   ```
3. Update existing tests in the corresponding test file to verify `i18nKey` is populated in the returned options.

#### Fix 3.2: NFR-001 Performance Test (MEDIUM)

The spec defines NFR-001: "Timezone conversion and formatting must complete in < 5ms per call."
NFR-002 (<50ms for geo) IS tested. NFR-001 is NOT.

**Add** performance tests to the existing test files:

In `tests/unit/date-service.test.ts`:

```typescript
describe('performance (NFR-001)', () => {
  it('should format date in < 5ms', () => {
    const date = new Date('2025-03-15T12:00:00Z');
    const start = performance.now();
    service.format(date, 'LL', { locale: 'ar', tz: 'Africa/Cairo' });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });
});
```

In `tests/unit/format-service.test.ts`:

```typescript
describe('performance (NFR-001)', () => {
  it('should format currency in < 5ms', () => {
    const start = performance.now();
    service.formatCurrency(1234.56, 'EGP', 'ar');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });
});
```

#### Fix 3.3: Documentation Sync

**a) `specs/009-regional-engine/spec.md`:**

- **D4 section (around lines 112-125)** and **Key Entities (around lines 189-190):** Add `i18nKey: string` to both `GeoState` and `GeoCity` interfaces. Currently missing — the plan and code both have it, but the spec does not.

**b) `specs/009-regional-engine/plan.md`:**

- **DateService.format() signature (around line 346-350):** Update from 4 positional parameters to the actual options object pattern:
  ```typescript
  format(
    date: Date | string | number,
    formatStr: string,
    options?: DateFormatOptions, // { locale?: string; tz?: string }
  ): Result<string, AppError>
  ```
- Update any test examples in the plan that call `format()` with 4 arguments to use the options object pattern.
- **GeoService data loading (around lines 638-680):** Update to reflect actual implementation (lazy `readFileSync` with corrupt data detection instead of static import).
- **RegionalService session field mapping:** Update `store.lang` → `store.locale`, `store.currency` → `store.currencyCode`, `store.country` → `store.countryCode`.

**c) `specs/009-regional-engine/tasks.md`:**

- Update GeoState/GeoCity acceptance criteria to include `i18nKey: string`

---

### Agent 4: storage-engine

**Package:** `packages/storage-engine`
**Spec artifacts:** `specs/010-storage-engine-package/`

#### Fix 4.1: Graceful Shutdown for Purge Queue (HIGH — Rule XVII violation)

`src/jobs/purge.job.ts` line 46-48: `createPurgeQueue()` calls `queueFactory(PURGE_QUEUE_NAME)` without passing `shutdownManager`. The queue is never registered for graceful shutdown.

**Fix:**

1. Accept `ShutdownManager` parameter:

   ```typescript
   import type { ShutdownManager } from '@tempot/shared';

   export function createPurgeQueue(shutdownManager?: ShutdownManager): Result<Queue, AppError> {
     return queueFactory(PURGE_QUEUE_NAME, { shutdownManager });
   }
   ```

2. Fix the return type from `Result<unknown, AppError>` to `Result<Queue, AppError>` (import `Queue` from `bullmq`).
3. Update `index.ts` barrel export if the function signature changed.
4. Update existing test in `tests/unit/purge-job.test.ts`:
   - Test that `createPurgeQueue()` passes `shutdownManager` to `queueFactory` when provided
   - Test that `createPurgeQueue()` works without `shutdownManager` (backward compat)

#### Fix 4.2: Telegram isEncrypted Flag (MEDIUM — data integrity)

`src/storage.service.ts` line 147:

```typescript
isEncrypted: this.provider.type === 's3' || this.provider.type === 'drive',
```

Per the spec (D5, line 85): "Telegram: Files are encrypted in transit (HTTPS) and at rest by Telegram servers." The current code sets `isEncrypted: false` for Telegram uploads.

**Fix:**

```typescript
isEncrypted: this.provider.type === 's3' || this.provider.type === 'drive' || this.provider.type === 'telegram',
```

Add a test in `tests/unit/storage-service.test.ts`:

- Verify that uploading via the Telegram provider sets `isEncrypted: true` on the attachment record

#### Fix 4.3: Unused config Field in StorageServiceDeps (LOW)

`src/storage.service.ts`: The `StorageServiceDeps` interface accepts `config: StorageConfig` but the constructor never assigns or uses it. Either:

- Remove `config` from `StorageServiceDeps` and from any test stubs that pass it, OR
- Assign it to `this.config` if there are plans to use it

Check the spec to determine which approach. If the spec references config being used at the service level, keep it. Otherwise, remove it.

#### Fix 4.4: Redis Degradation Test for Purge (MEDIUM)

Add a test in `tests/unit/purge-job.test.ts`:

```typescript
it('should log warning when eventBus.publish fails during purge', async () => {
  // Setup: eventBus.publish returns err(AppError)
  // Act: processPurge(deps)
  // Assert: logger.warn called with STORAGE_ERRORS.EVENT_PUBLISH_FAILED
  // Assert: processPurge still returns ok (fire-and-log pattern)
});
```

This test already partially exists (it tests the `purgeRecord` → `provider.delete` failure path). Add the specific `eventBus.publish` failure scenario.

#### Fix 4.5: Documentation Sync

**a) `specs/010-storage-engine-package/spec.md`:**

- **D5 (around line 84):** Change "An `EncryptionStrategy` interface is defined" to "An `EncryptionStrategy` interface will be defined when ai-core introduces sensitive data" (accurate deferred wording)
- **D5 Telegram:** Verify the spec correctly states Telegram encrypts at rest (it does) — no change needed here

**b) `specs/010-storage-engine-package/plan.md` (if it exists):**

- Update `StorageServiceDeps` to show minimal interfaces pattern (not concrete classes)
- Update `resolveEncryptionStatus()` section to match the inlined boolean expression in actual code
- Fix `DateService.format()` if referenced (4 params → options object)

**c) `specs/010-storage-engine-package/tasks.md`:**

- Add TDD instruction to task descriptions. The Constitution mandates RED → GREEN → REFACTOR but task descriptions don't enforce it. Add to each task's first acceptance criterion:
  ```
  - [ ] Tests written FIRST (RED phase) before implementation
  ```

---

### Agent 5: ux-helpers

**Package:** `packages/ux-helpers`
**Spec artifacts:** `specs/012-ux-helpers-package/`

#### Fix 5.1: Unused Error Constant LABEL_NO_EMOJI (MEDIUM — Rule VIII zombie code)

`src/errors.ts` defines `LABEL_NO_EMOJI` but it is never referenced anywhere in the source code. The spec (FR-005, Rule LXVI) requires emoji prefix enforcement on inline keyboard buttons, but the `InlineBuilder` does not validate for emoji presence.

**Investigate:** Check if `InlineBuilder` should enforce emoji prefix per the spec. If yes:

1. Add emoji validation in `InlineBuilder.addButton()` that uses `LABEL_NO_EMOJI`
2. Write tests for the emoji enforcement

If the spec does NOT require runtime enforcement (and the constant was a placeholder):

1. Remove `LABEL_NO_EMOJI` from `errors.ts` per Rule VIII (no zombie code)
2. Update any tests that reference it

**Important:** Read the spec carefully before deciding. If spec says "SHOULD" not "MUST" for emoji prefix, document your decision.

#### Fix 5.2: Coverage Configuration (LOW)

`vitest.config.ts` has no coverage configuration. The spec NFR-008 requires 80%+ coverage.

Check what other packages use for coverage config. If a monorepo-level coverage config exists (root `vitest.config.ts` or `vitest.workspace.ts`), this may be inherited. If not, add:

```typescript
test: {
  coverage: {
    provider: 'v8',
    thresholds: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
},
```

**Note:** Only add package-level coverage config if the monorepo does NOT already provide it. Check `vitest.workspace.ts` first.

#### Fix 5.3: Missing Test Cases (MEDIUM)

Add the following edge case tests:

**a) `tests/unit/callback-data.encoder.test.ts`:**

- Test encoding parts that contain the `:` separator character — verify it doesn't corrupt data or document that `:` is disallowed in parts

**b) `tests/unit/list.formatter.test.ts`:**

- Test with >10 items (spec line 205 says items 11+ should use text numbers instead of emoji)

**c) `tests/unit/feedback.handler.test.ts`:**

- Test behavior when `sendLoading` fails — verify the action still executes (or document the expected behavior)

#### Fix 5.4: Documentation Sync

**a) `specs/012-ux-helpers-package/spec.md`:**

- Verify that the `InlineBuilder` section accurately describes the emoji prefix requirement
- Verify `FeedbackHandler` spec matches actual behavior (particularly `sendLoading` error handling)
- Verify `ConfirmationBuilder` button label validation requirements match code
- Update any interface definitions or method signatures that differ from actual code

---

## Phase 2: Verification

**Activate `verification-before-completion`.**

1. Run the full test suite from the monorepo root:

   ```bash
   pnpm test
   ```

   Paste the full output as evidence.

2. Run the build:

   ```bash
   pnpm build
   ```

   Paste the output. The pre-existing `TS2322` error in `storage-engine/src/providers/s3.provider.ts` is a known issue — it is acceptable if this is the only build error.

3. Verify no regressions across all 5 packages.

**Activate `requesting-code-review`.** Review all changes against:

- The findings list in this prompt
- The constitution (especially Rules VI, VII, VIII, X, XVII, XXXIV, XXXIX)

---

## Constraints

- Do NOT rename files. File renaming (Rule III compliance) is handled in a separate task.
- Fix ONLY the issues listed in this prompt. No "while I'm here" changes.
- Every code fix follows TDD: write failing test FIRST, then fix, then verify.
- For documentation-only changes (spec/plan/tasks sync): no tests needed, just accurate content.
- If any finding is already resolved in the current codebase, skip and report as "already resolved."
- If a fix requires changing shared code (`packages/shared/`), document the blast radius before proceeding.
- No `@ts-ignore`, no `eslint-disable`, no `any` types.

## Final Report

When all phases complete, report per agent:

- Fixes applied (with file:line references)
- Tests added (count and descriptions)
- Documentation updates (files changed)
- Skipped items (already resolved)
- Test suite output (full evidence)
- Build output
