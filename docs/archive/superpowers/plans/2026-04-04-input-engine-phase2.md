# Input Engine Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 UX & Integration features (optional skip, cancel, validation errors, progress, back navigation, confirmation, storage integration, AI extraction) to @tempot/input-engine — all additive and backward-compatible with 448 existing tests.

**Architecture:** Pure function renderers (action-buttons, progress, validation-error, confirmation) compose single-message prompts. `field.iterator.ts` restructured from `for` to `while` loop for bidirectional navigation. Media handlers gain optional storage upload. AI extractor gains full extraction-confirmation flow.

**Tech Stack:** TypeScript Strict Mode, neverthrow (Result pattern), Zod 4, grammY conversations, Vitest

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/runner/action-buttons.builder.ts` | Pure function: `buildActionButtons()` — returns action button rows based on context |
| `src/runner/validation-error.renderer.ts` | Pure function: `renderValidationError()` — i18n error text with retry context |
| `src/runner/progress.renderer.ts` | Pure functions: `computeDynamicTotal()`, `renderProgress()` |
| `src/runner/confirmation.renderer.ts` | Pure functions: `formatFieldValue()`, `buildConfirmationSummary()` |
| `src/runner/confirmation.handler.ts` | `handleConfirmationLoop()` — confirmation display + edit flow logic |
| `src/fields/media/storage-upload.helper.ts` | `uploadToStorage()` — shared Telegram download + storage upload |

### Modified Files

| File | Changes |
|------|---------|
| `src/input-engine.types.ts` | Add `showProgress`, `showConfirmation` to FormOptions; add `FIELD_SKIPPED_SENTINEL` |
| `src/input-engine.errors.ts` | Add `NAVIGATE_BACK` error code |
| `src/runner/form.runner.ts` | Add `t`, `storageClient`, `aiClient` to FormRunnerDeps; wire confirmation step |
| `src/runner/field.iterator.ts` | While loop, skip/cancel/back handling, progress/error wiring |
| `src/runner/event.emitter.ts` | Add `emitFieldSkipped()` |
| `src/fields/field.handler.ts` | Add `previousValue` to RenderContext |
| `src/fields/media/photo.field.ts` | Storage upload integration |
| `src/fields/media/document.field.ts` | Storage upload integration |
| `src/fields/media/video.field.ts` | Storage upload integration |
| `src/fields/media/audio.field.ts` | Storage upload integration |
| `src/fields/media/file-group.field.ts` | Storage upload integration |
| `src/fields/smart/ai-extractor.field.ts` | Full AI extraction flow |
| `src/index.ts` | Export new Phase 2 types/constants |
| `../../event-bus/src/event-bus.events.ts` | Add `input-engine.field.skipped` event type |

### Test Files

| File | New/Modified |
|------|-------------|
| `tests/unit/action-buttons.builder.test.ts` | New |
| `tests/unit/input-engine.types.test.ts` | Modified |
| `tests/unit/form.runner.test.ts` | Modified |
| `tests/unit/field.iterator.test.ts` | Modified |
| `tests/unit/validation-error.renderer.test.ts` | New |
| `tests/unit/progress.renderer.test.ts` | New |
| `tests/unit/confirmation.renderer.test.ts` | New |
| `tests/unit/confirmation.handler.test.ts` | New |
| `tests/unit/storage-upload.helper.test.ts` | New |
| `tests/unit/photo.field.test.ts` | Modified |
| `tests/unit/document.field.test.ts` | Modified |
| `tests/unit/video.field.test.ts` | Modified |
| `tests/unit/audio.field.test.ts` | Modified |
| `tests/unit/file-group.field.test.ts` | Modified |
| `tests/unit/ai-extractor.field.test.ts` | Modified |

---

## Execution Order (CRITICAL)

Tasks 51, 52, 53, 54, 55 all modify `field.iterator.ts`. Despite being logically independent, they MUST be sequential to avoid merge conflicts:

**54 (while loop) → 51 (skip) → 52 (cancel) → 53 (error) → 55 (progress) → 56 (keep current) → 57 (confirmation)**

Tasks 49 and 50 are entry points that can run in parallel. Tasks 58 and 59 are independent and can run after Task 50.

**Final order: 49 → 50 → 54 → 51 → 52 → 53 → 55 → 56 → 57 → 58 → 59 → 60**

---

## Conventions

All code in this codebase follows these patterns — subagents MUST follow them:

- **Result pattern**: `Result<T, AppError>` / `AsyncResult<T, AppError>` via neverthrow. Never throw.
- **Imports**: Use `import { ok, err } from 'neverthrow'` and `import { AppError } from '@tempot/shared'`
- **Error codes**: `INPUT_ENGINE_ERRORS.CODE_NAME` from `input-engine.errors.ts`
- **Callback data**: `encodeFormCallback(formId, fieldIndex, value)` from `utils/callback-data.helper.ts`
- **Event emission**: `emitEvent(deps, eventName, payload)` — fire-and-log, never propagate failures
- **File naming**: `{feature}.{type}.ts` (e.g., `action-buttons.builder.ts`)
- **ESLint**: max-lines: 200, max-lines-per-function: 50, max-params: 3
- **No `any`**, no `eslint-disable`, no `@ts-ignore`, no `console.*`
- **Test command**: `pnpm --filter @tempot/input-engine test`
- **Working directory**: `F:\Tempot\.worktrees\input-engine-phase2`

---

### Task 49: Action Buttons Builder

**Files:**
- Create: `packages/input-engine/src/runner/action-buttons.builder.ts`
- Test: `packages/input-engine/tests/unit/action-buttons.builder.test.ts`

**Context:** This is a pure function that builds action button rows for field prompts. It uses the existing `encodeFormCallback` from `utils/callback-data.helper.ts` to encode callback data in `ie:{formId}:{fieldIndex}:{action}` format. The `t` function is a simple i18n translation function `(key: string, params?: Record<string, unknown>) => string` — when absent, the raw key is returned.

**Spec deviation note:** The spec says to use `encodeCallbackData` from `@tempot/ux-helpers`, but `encodeFormCallback` in `utils/callback-data.helper.ts` already produces the exact `ie:{formId}:{fieldIndex}:{value}` format used by input-engine. Using `@tempot/ux-helpers.encodeCallbackData` would require manually splitting/joining parts and the result would be identical. We use the existing input-engine utility for consistency with all other callback data in this package.

- [ ] **Step 1: Write failing tests for buildActionButtons**

Create `tests/unit/action-buttons.builder.test.ts` with these test cases:
1. Optional field shows Skip button
2. Non-optional field hides Skip button
3. First field (`isFirstField: true`) hides Back button
4. Non-first field shows Back button
5. `allowCancel: true` shows Cancel button
6. `allowCancel: false` hides Cancel button
7. All buttons use `t()` for text (verify t is called)
8. Callback data uses `encodeFormCallback` format

The test should import `buildActionButtons`, `ACTION_CALLBACKS`, `ActionButtonContext`, `ActionButtonRow` from the source file.

Mock `t` as `(key: string) => key` (returns key as-is).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/action-buttons.builder.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement action-buttons.builder.ts**

Create `src/runner/action-buttons.builder.ts`:

```typescript
import { encodeFormCallback } from '../utils/callback-data.helper.js';

/** Callback action constants */
export const ACTION_CALLBACKS = {
  SKIP: '__skip__',
  CANCEL: '__cancel__',
  BACK: '__back__',
  KEEP_CURRENT: '__keep_current__',
} as const;

/** Context for building action buttons */
export interface ActionButtonContext {
  formId: string;
  fieldIndex: number;
  isOptional: boolean;
  isFirstField: boolean;
  allowCancel: boolean;
}

/** A row of action buttons */
export interface ActionButtonRow {
  buttons: Array<{ text: string; callbackData: string }>;
}

/** Translation function type */
type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/** Default translate — returns raw key */
function defaultT(key: string): string {
  return key;
}

/** Build action button rows based on field context. Pure function. */
export function buildActionButtons(
  ctx: ActionButtonContext,
  t: TranslateFunction = defaultT,
): ActionButtonRow[] {
  const rows: ActionButtonRow[] = [];
  const navButtons: Array<{ text: string; callbackData: string }> = [];

  if (!ctx.isFirstField) {
    navButtons.push({
      text: t('input-engine.actions.back'),
      callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.BACK),
    });
  }

  if (ctx.isOptional) {
    navButtons.push({
      text: t('input-engine.actions.skip'),
      callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.SKIP),
    });
  }

  if (navButtons.length > 0) rows.push({ buttons: navButtons });

  if (ctx.allowCancel) {
    rows.push({
      buttons: [
        {
          text: t('input-engine.actions.cancel'),
          callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.CANCEL),
        },
      ],
    });
  }

  return rows;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/action-buttons.builder.test.ts`
Expected: PASS

- [ ] **Step 5: Run full test suite to verify no regression**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All 448+ tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/input-engine/src/runner/action-buttons.builder.ts packages/input-engine/tests/unit/action-buttons.builder.test.ts
git commit -m "feat(input-engine): add action buttons builder (Task 49)

Pure function buildActionButtons() returns Skip/Back/Cancel button rows
based on ActionButtonContext. Uses encodeFormCallback for callback data.
All button text uses t() for i18n."
```

---

### Task 50: FormOptions & FormRunnerDeps Updates

**Files:**
- Modify: `packages/input-engine/src/input-engine.types.ts` (lines 191-206)
- Modify: `packages/input-engine/src/runner/form.runner.ts` (lines 26-40)
- Test: `packages/input-engine/tests/unit/input-engine.types.test.ts` (modify)
- Test: `packages/input-engine/tests/unit/form.runner.test.ts` (modify)

**Context:** Add `showProgress` and `showConfirmation` to `FormOptions` with defaults `true`. Add optional `t`, `storageClient`, `aiClient` to `FormRunnerDeps`. All new fields are optional — existing callers unaffected.

- [ ] **Step 1: Write failing tests for new FormOptions defaults**

Add tests to existing `tests/unit/input-engine.types.test.ts`:
1. `DEFAULT_FORM_OPTIONS.showProgress` is `true`
2. `DEFAULT_FORM_OPTIONS.showConfirmation` is `true`

Add tests to existing `tests/unit/form.runner.test.ts`:
3. `FormRunnerDeps` accepts `t` as optional
4. `FormRunnerDeps` accepts `storageClient` as optional
5. `FormRunnerDeps` accepts `aiClient` as optional

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/input-engine.types.test.ts tests/unit/form.runner.test.ts`
Expected: FAIL

- [ ] **Step 3: Update input-engine.types.ts**

In `src/input-engine.types.ts`, modify `FormOptions` (around line 191) to add:
```typescript
export interface FormOptions {
  partialSave?: boolean;
  partialSaveTTL?: number;
  maxMilliseconds?: number;
  allowCancel?: boolean;
  formId?: string;
  showProgress?: boolean;      // NEW — default true
  showConfirmation?: boolean;  // NEW — default true
}
```

Update `DEFAULT_FORM_OPTIONS` (around line 200):
```typescript
export const DEFAULT_FORM_OPTIONS: Required<FormOptions> = {
  partialSave: false,
  partialSaveTTL: 86_400_000,
  maxMilliseconds: 600_000,
  allowCancel: true,
  formId: '',
  showProgress: true,       // NEW
  showConfirmation: true,   // NEW
};
```

Also add the `FIELD_SKIPPED_SENTINEL` constant (needed by Task 51):
```typescript
/** Sentinel value returned by processField to signal field was skipped */
export const FIELD_SKIPPED_SENTINEL = Symbol.for('input-engine.field.skipped');
```

- [ ] **Step 4: Update form.runner.ts FormRunnerDeps**

In `src/runner/form.runner.ts`, add imports and update the interface (around line 26):
```typescript
import type { StorageEngineClient, AIExtractionClient } from '../input-engine.contracts.js';
```

Add to `FormRunnerDeps` after `renderPrompt`:
```typescript
  t?: (key: string, params?: Record<string, unknown>) => string;
  storageClient?: StorageEngineClient;
  aiClient?: AIExtractionClient;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass (448+ including new ones)

- [ ] **Step 6: Commit**

```bash
git add packages/input-engine/src/input-engine.types.ts packages/input-engine/src/runner/form.runner.ts packages/input-engine/tests/unit/input-engine.types.test.ts packages/input-engine/tests/unit/form.runner.test.ts
git commit -m "feat(input-engine): add Phase 2 FormOptions and FormRunnerDeps fields (Task 50)

Add showProgress and showConfirmation to FormOptions (both default true).
Add optional t, storageClient, aiClient to FormRunnerDeps.
Add FIELD_SKIPPED_SENTINEL constant for skip signaling."
```

---

### Task 54: Bidirectional Field Iteration (While Loop)

**Files:**
- Modify: `packages/input-engine/src/runner/field.iterator.ts` (lines 138-200)
- Modify: `packages/input-engine/src/input-engine.errors.ts` (add NAVIGATE_BACK)
- Test: `packages/input-engine/tests/unit/field.iterator.test.ts` (modify)

**Context:** This is the MOST critical task. It restructures `iterateFields` from `for (let i = 0; ...)` to `while (index < fieldNames.length)` with mutable index. Adds `NAVIGATE_BACK` internal error code. The `processField` function's public interface stays the same — the only change is how the iterator handles the sentinel. Back navigation walks backward past condition-false fields (D25).

**IMPORTANT:** This task does NOT yet handle skip, cancel, or keep-current callbacks — those are added in subsequent tasks. This task ONLY restructures the loop and adds back navigation support.

**Spec deviation note:** The spec's Task 54 acceptance criteria includes "RenderContext includes previousValue for the handler." We intentionally defer `previousValue` to Task 56 (which depends on Task 54) because: (1) Task 54's scope is the while-loop restructure + back navigation mechanics, (2) `previousValue` requires `RenderContext` changes and keep-current button wiring that belong in Task 56, (3) the execution order is 54→56 and both must complete before Task 57. The spec's acceptance criterion is fully satisfied once both Task 54 + Task 56 are complete.

- [ ] **Step 1: Add NAVIGATE_BACK error code**

In `src/input-engine.errors.ts`, add after FIELD_TYPE_UNKNOWN (line 20):
```typescript
  NAVIGATE_BACK: 'input-engine.field.navigate_back',
```

- [ ] **Step 2: Write failing tests for while loop and back navigation**

Add tests to existing `tests/unit/field.iterator.test.ts`:
1. `iterateFields` still processes all fields forward (basic sanity after refactor)
2. All 448 existing tests still pass (regression check — run full suite)
3. Back navigation: when `processField` returns `err(NAVIGATE_BACK)`, index decrements
4. Back navigation removes field from `completedFieldNames` and `formData`
5. Back on first field: ignored (index stays 0)
6. Back past conditional: re-evaluates, skips condition-false fields
7. `formData` updated correctly after back navigation

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/field.iterator.test.ts`
Expected: New tests FAIL (back navigation not yet implemented)

- [ ] **Step 4: Restructure iterateFields to while loop**

In `src/runner/field.iterator.ts`, replace the `for` loop (lines 143-198) with:

```typescript
export async function iterateFields(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  progress: FormProgress,
): AsyncResult<void, AppError> {
  const fieldNames = Object.keys(input.schema.shape);
  const evDeps: EventEmitterDeps = { eventBus: deps.eventBus, logger: deps.logger };
  progress.totalFields = fieldNames.length;

  let index = 0;
  while (index < fieldNames.length) {
    const fieldName = fieldNames[index]!;

    // Deadline check
    if (Date.now() - progress.startTime > progress.maxMilliseconds) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FORM_TIMEOUT, {
          formId: progress.formId,
          elapsedMs: Date.now() - progress.startTime,
          maxMs: progress.maxMilliseconds,
        }),
      );
    }

    if (progress.completedFieldNames.includes(fieldName)) {
      index++;
      continue;
    }

    const fieldSchema = input.schema.shape[fieldName] as z.ZodType;
    const metadata = getFieldMetadata(fieldSchema);

    if (!shouldRenderField(metadata, progress.formData)) {
      deps.logger.debug({ msg: 'Skipping conditional field', formId: progress.formId, fieldName });
      index++;
      continue;
    }

    const ctxOrErr = buildFieldContext(deps, progress, {
      fieldName,
      metadata,
      fieldSchema,
      fieldIndex: index,
    });
    if (ctxOrErr instanceof AppError) return err(ctxOrErr);

    const result = await processField(input, ctxOrErr, deps);

    // Handle back navigation sentinel
    if (result.isErr() && result.error.code === INPUT_ENGINE_ERRORS.NAVIGATE_BACK) {
      const backResult = navigateBack(index, fieldNames, progress, input.schema, deps);
      index = backResult;
      continue;
    }

    if (result.isErr()) return err(result.error);

    progress.formData[fieldName] = result.value;
    progress.fieldsCompleted++;
    progress.completedFieldNames.push(fieldName);
    await maybeSaveProgress(deps, progress);

    await emitEvent(evDeps, 'input-engine.field.validated', {
      formId: progress.formId,
      userId: deps.userId,
      fieldType: metadata.fieldType,
      fieldName,
      valid: true,
      retryCount: ctxOrErr.retryCount,
    });

    index++;
  }

  return ok(undefined);
}
```

- [ ] **Step 5: Implement navigateBack helper function**

Add to `field.iterator.ts` (before `iterateFields`):

```typescript
/** Navigate back to previous user-answered field, skipping condition-false fields */
function navigateBack(
  currentIndex: number,
  fieldNames: string[],
  progress: FormProgress,
  schema: z.ZodObject<z.ZodRawShape>,
  deps: FormRunnerDeps,
): number {
  if (currentIndex === 0) return 0;

  // Walk backward to find last completed field
  let targetIndex = currentIndex - 1;
  while (targetIndex >= 0) {
    const targetField = fieldNames[targetIndex]!;
    const targetSchema = schema.shape[targetField] as z.ZodType;
    const targetMeta = getFieldMetadata(targetSchema);

    // Skip condition-false fields (D25)
    if (!shouldRenderField(targetMeta, progress.formData)) {
      targetIndex--;
      continue;
    }

    // Found the target — remove it from completed
    if (progress.completedFieldNames.includes(targetField)) {
      const idx = progress.completedFieldNames.indexOf(targetField);
      progress.completedFieldNames.splice(idx, 1);
      delete progress.formData[targetField];
      progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
    }

    break;
  }

  // Also clean up any conditional fields that became hidden after removing data
  cleanConditionalFields(targetIndex + 1, fieldNames, progress, schema, deps);

  return Math.max(0, targetIndex);
}

/** Remove conditional fields that are no longer visible after back navigation */
function cleanConditionalFields(
  startIndex: number,
  fieldNames: string[],
  progress: FormProgress,
  schema: z.ZodObject<z.ZodRawShape>,
  deps: FormRunnerDeps,
): void {
  for (let i = startIndex; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i]!;
    const fieldSchema = schema.shape[fieldName] as z.ZodType;
    const metadata = getFieldMetadata(fieldSchema);

    if (!shouldRenderField(metadata, progress.formData)) {
      const idx = progress.completedFieldNames.indexOf(fieldName);
      if (idx !== -1) {
        progress.completedFieldNames.splice(idx, 1);
        delete progress.formData[fieldName];
        progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
        deps.logger.debug({ msg: 'Removed conditional field after back', fieldName });
      }
    }
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/input-engine/src/runner/field.iterator.ts packages/input-engine/src/input-engine.errors.ts packages/input-engine/tests/unit/field.iterator.test.ts
git commit -m "feat(input-engine): restructure to while loop with back navigation (Task 54)

Restructure iterateFields from for loop to while loop with mutable index.
Add NAVIGATE_BACK internal error code. Implement navigateBack() that walks
backward past condition-false fields and cleans up conditional state."
```

---

### Task 51: Optional Field Skip

**Files:**
- Modify: `packages/input-engine/src/runner/field.iterator.ts`
- Modify: `packages/input-engine/src/runner/event.emitter.ts`
- Modify: `packages/event-bus/src/event-bus.events.ts` (cross-package)
- Test: `packages/input-engine/tests/unit/field.iterator.test.ts` (modify)

**Context:** When `metadata.optional === true`, processField may return `ok(FIELD_SKIPPED_SENTINEL)`. The iterator then sets `formData[fieldName] = undefined` and emits `input-engine.field.skipped`. Auto-skip on maxRetries for optional fields. `FIELD_SKIPPED_SENTINEL` was added in Task 50.

**IMPORTANT:** This task does NOT modify `processField` to detect `__skip__` callbacks yet — the actual detection of skip/cancel/back callbacks in `processField` will come when we integrate the action buttons into the render flow. For now, the iterator handles the sentinel if it receives one.

- [ ] **Step 1: Add field.skipped event to event-bus (cross-package gap fix)**

In `packages/event-bus/src/event-bus.events.ts`, add after line 105 (before closing `}`):
```typescript
  'input-engine.field.skipped': {
    formId: string;
    userId: string;
    fieldName: string;
    fieldType: string;
    reason: 'user_skip' | 'max_retries_skip';
  };
```

- [ ] **Step 2: Add emitFieldSkipped to event.emitter.ts**

In `src/runner/event.emitter.ts`, add payload interface and emit function:

```typescript
interface FieldSkippedPayload {
  formId: string;
  userId: string;
  fieldName: string;
  fieldType: string;
  reason: 'user_skip' | 'max_retries_skip';
}

export async function emitFieldSkipped(
  deps: EventEmitterDeps,
  payload: FieldSkippedPayload,
): Promise<void> {
  await emitEvent(deps, 'input-engine.field.skipped', {
    ...payload,
    timestamp: new Date(),
  });
}
```

Also export `FieldSkippedPayload` type from the file.

- [ ] **Step 3: Write failing tests for skip handling**

Add tests to `tests/unit/field.iterator.test.ts`:
1. When processField returns `ok(FIELD_SKIPPED_SENTINEL)`, `formData[fieldName]` is `undefined`
2. Skip marks field as completed in `completedFieldNames`
3. Skip emits `input-engine.field.skipped` with reason `user_skip`
4. Non-optional field + maxRetries exhaustion returns `err(FIELD_MAX_RETRIES)` (existing behavior preserved)
5. Optional field + maxRetries exhaustion: auto-skip with reason `max_retries_skip`

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/field.iterator.test.ts`
Expected: New tests FAIL

- [ ] **Step 5: Implement skip handling in iterateFields**

In `src/runner/field.iterator.ts`, in the `while` loop after `processField` returns:

Import `FIELD_SKIPPED_SENTINEL` from `../input-engine.types.js` and `emitFieldSkipped` from `./event.emitter.js`.

After `if (result.isErr()) return err(result.error);` check, add:

```typescript
    // Handle skip sentinel
    if (result.value === FIELD_SKIPPED_SENTINEL) {
      progress.formData[fieldName] = undefined;
      progress.fieldsCompleted++;
      progress.completedFieldNames.push(fieldName);
      await maybeSaveProgress(deps, progress);
      await emitFieldSkipped(evDeps, {
        formId: progress.formId,
        userId: deps.userId,
        fieldName,
        fieldType: metadata.fieldType,
        reason: 'user_skip',
      });
      index++;
      continue;
    }
```

- [ ] **Step 6: Implement auto-skip on maxRetries for optional fields**

In `processField`, modify the maxRetries exhaustion block. Currently it always returns `err(FIELD_MAX_RETRIES)`. Change to:

```typescript
  // After retry loop exhaustion:
  if (ctx.metadata.optional) {
    return ok(FIELD_SKIPPED_SENTINEL);
  }
  return err(
    new AppError(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES, { ... }),
  );
```

Import `FIELD_SKIPPED_SENTINEL` at the top of the file.

For auto-skip, the iterator needs to detect this case and emit with reason `max_retries_skip`. Add logic in the skip sentinel handler:

```typescript
    // In the skip sentinel handler, determine reason
    const skipReason = ctxOrErr.retryCount >= ctxOrErr.maxRetries ? 'max_retries_skip' : 'user_skip';
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add packages/input-engine/src/runner/field.iterator.ts packages/input-engine/src/runner/event.emitter.ts packages/event-bus/src/event-bus.events.ts packages/input-engine/tests/unit/field.iterator.test.ts
git commit -m "feat(input-engine): add optional field skip with event emission (Task 51)

Handle FIELD_SKIPPED_SENTINEL in iterator — sets formData to undefined,
marks complete, emits input-engine.field.skipped. Auto-skip optional
fields on maxRetries exhaustion. Cross-package: add field.skipped to
event-bus events."
```

---

### Task 52: Cancel Button Interception

**Files:**
- Modify: `packages/input-engine/src/runner/field.iterator.ts`
- Test: `packages/input-engine/tests/unit/field.iterator.test.ts` (modify)

**Context:** Detect `__cancel__` callback and `/cancel` text command. When `allowCancel: true`, either path returns `err(FORM_CANCELLED)`. When `allowCancel: false`, `/cancel` is treated as normal input. The cancel button is already included in `buildActionButtons` from Task 49 — this task handles the interception logic.

**NOTE:** Cancel interception should happen in the iterator's response handling, not in processField's retry loop. We need to detect the cancel signal from the user response before or after `parseResponse`.

- [ ] **Step 1: Write failing tests**

Add tests to `tests/unit/field.iterator.test.ts`:
1. When processField response contains `__cancel__` callback, returns `err(FORM_CANCELLED)`
2. When user text is `/cancel` and `allowCancel: true`, returns `err(FORM_CANCELLED)` before parseResponse
3. When `allowCancel: false`, `/cancel` text is passed to handler's parseResponse as normal input
4. Partial save is NOT deleted on cancel (preserved for resumption)
5. Cancel returns `err(FORM_CANCELLED)` with `reason: 'user_cancel'`

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/field.iterator.test.ts`
Expected: New tests FAIL

- [ ] **Step 3: Implement cancel interception in processField**

In `src/runner/field.iterator.ts`, modify `processField`. After receiving the response (after `handler.render` or `deps.renderPrompt`), add cancel detection:

```typescript
    // Check for cancel callback or /cancel text
    const cancelDetected = detectCancelSignal(responseCtx, deps);
    if (cancelDetected) {
      return err(new AppError(INPUT_ENGINE_ERRORS.FORM_CANCELLED, { reason: 'user_cancel' }));
    }
```

Add helper function:

```typescript
/** Detect cancel signal from user response */
function detectCancelSignal(response: unknown, deps: FormRunnerDeps): boolean {
  // Check for __cancel__ callback data
  const msg = response as Record<string, unknown>;
  if (msg?.callback_query?.data && typeof msg.callback_query.data === 'string') {
    if (msg.callback_query.data.includes(ACTION_CALLBACKS.CANCEL)) return true;
  }

  // Check for /cancel text command
  if (typeof msg?.text === 'string' && msg.text.trim().toLowerCase() === '/cancel') {
    // Only intercept when allowCancel is true — determined by caller
    return true;
  }

  return false;
}
```

The `allowCancel` check needs to be wired from `FormOptions` through to `processField`. Pass `allowCancel` as part of `FieldContext` or through `deps`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/input-engine/src/runner/field.iterator.ts packages/input-engine/tests/unit/field.iterator.test.ts
git commit -m "feat(input-engine): add cancel button and /cancel text interception (Task 52)

Detect __cancel__ callback and /cancel text in processField. Returns
err(FORM_CANCELLED) when allowCancel is true. When allowCancel is false,
/cancel treated as normal input. Partial save preserved on cancel."
```

---

### Task 53: Validation Error Display

**Files:**
- Create: `packages/input-engine/src/runner/validation-error.renderer.ts`
- Modify: `packages/input-engine/src/runner/field.iterator.ts`
- Test: `packages/input-engine/tests/unit/validation-error.renderer.test.ts` (new)

**Context:** Pure function renders i18n error messages with retry context. Called in processField's retry loop when parse or validate fails. Uses `t` from `FormRunnerDeps` — when absent, raw keys returned.

- [ ] **Step 1: Write failing tests for renderValidationError**

Create `tests/unit/validation-error.renderer.test.ts`:
1. Custom `i18nErrorKey` used when defined in metadata
2. Default error key per field type when no custom key
3. Generic fallback `input-engine.errors.generic` when no default for field type
4. Retry count included in params (`{ attempt, maxRetries }`)
5. When `t` is undefined, raw key string returned

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/validation-error.renderer.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement validation-error.renderer.ts**

Create `src/runner/validation-error.renderer.ts`:

```typescript
import type { FieldMetadata, FieldType } from '../input-engine.types.js';

/** Retry state for error context */
export interface RetryState {
  current: number;
  max: number;
}

/** Default i18n error keys per field type */
const DEFAULT_ERROR_KEYS: Partial<Record<FieldType, string>> = {
  ShortText: 'input-engine.errors.short-text',
  LongText: 'input-engine.errors.long-text',
  Email: 'input-engine.errors.email',
  Phone: 'input-engine.errors.phone',
  URL: 'input-engine.errors.url',
  Integer: 'input-engine.errors.integer',
  Float: 'input-engine.errors.float',
  Currency: 'input-engine.errors.currency',
  Photo: 'input-engine.errors.photo',
  Document: 'input-engine.errors.document',
  Video: 'input-engine.errors.video',
  Audio: 'input-engine.errors.audio',
};

const GENERIC_ERROR_KEY = 'input-engine.errors.generic';

/** Translation function type */
type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/** Default translate — returns raw key */
function defaultT(key: string): string {
  return key;
}

/** Render a validation error message with retry context */
export function renderValidationError(
  metadata: FieldMetadata,
  retryState: RetryState,
  t: TranslateFunction = defaultT,
): string {
  const errorKey =
    metadata.i18nErrorKey ??
    DEFAULT_ERROR_KEYS[metadata.fieldType] ??
    GENERIC_ERROR_KEY;

  return t(errorKey, {
    attempt: retryState.current,
    maxRetries: retryState.max,
  });
}
```

- [ ] **Step 4: Wire error renderer into processField retry loop**

In `src/runner/field.iterator.ts`, import `renderValidationError` and `RetryState`.

In the `processField` retry loop, after `parseResponse` or `validate` fails:

```typescript
    // After parse or validate failure:
    retryCount++;
    const errorText = renderValidationError(
      metadata,
      { current: retryCount, max: maxRetries },
      deps.t,
    );
    // Error text will be prepended to next render (stored for next iteration)
    // For now, log it — actual message composition comes with progress integration
    deps.logger?.debug?.({ msg: 'Validation error', errorText, fieldName: ctx.fieldName });
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/input-engine/src/runner/validation-error.renderer.ts packages/input-engine/src/runner/field.iterator.ts packages/input-engine/tests/unit/validation-error.renderer.test.ts
git commit -m "feat(input-engine): add validation error renderer with retry context (Task 53)

Pure function renderValidationError() with i18n fallback hierarchy:
custom key → field type default → generic. Includes retry count params.
Wired into processField retry loop."
```

---

### Task 55: Progress Indicator

**Files:**
- Create: `packages/input-engine/src/runner/progress.renderer.ts`
- Modify: `packages/input-engine/src/runner/field.iterator.ts`
- Test: `packages/input-engine/tests/unit/progress.renderer.test.ts` (new)

**Context:** `computeDynamicTotal` calls `shouldRenderField` for all fields against current formData — O(N) per field. `renderProgress` returns i18n text. Controlled by `showProgress` option.

- [ ] **Step 1: Write failing tests for progress renderer**

Create `tests/unit/progress.renderer.test.ts`:
1. `computeDynamicTotal` counts all fields when no conditions
2. `computeDynamicTotal` excludes condition-false fields
3. `renderProgress` calls `t('input-engine.progress', { current, total })`
4. When `t` is undefined, returns raw key
5. Dynamic total changes as formData changes (conditional visibility)
6. O(N) performance is acceptable (< 10ms for 100 fields)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/progress.renderer.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement progress.renderer.ts**

Create `src/runner/progress.renderer.ts`:

```typescript
import type { FieldMetadata } from '../input-engine.types.js';
import { shouldRenderField } from './condition.evaluator.js';

/** Translation function type */
type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/** Default translate — returns raw key */
function defaultT(key: string): string {
  return key;
}

/** Function type for field visibility evaluation */
type ShouldRenderFn = (metadata: FieldMetadata, formData: Record<string, unknown>) => boolean;

/** Compute dynamic total of visible fields given current formData */
export function computeDynamicTotal(
  allFieldNames: string[],
  allMetadata: Map<string, FieldMetadata>,
  currentFormData: Record<string, unknown>,
  shouldRenderFn: ShouldRenderFn = shouldRenderField,
): number {
  let count = 0;
  for (const fieldName of allFieldNames) {
    const metadata = allMetadata.get(fieldName);
    if (!metadata) continue;
    if (shouldRenderFn(metadata, currentFormData)) {
      count++;
    }
  }
  return count;
}

/** Render progress text using i18n */
export function renderProgress(
  current: number,
  total: number,
  t: TranslateFunction = defaultT,
): string {
  return t('input-engine.progress', { current, total });
}
```

- [ ] **Step 4: Wire progress into iterateFields**

In `src/runner/field.iterator.ts`, import `computeDynamicTotal` and `renderProgress`.

At the start of each while-loop iteration (after condition check, before processField):

```typescript
    // Compute progress if enabled (formOptions stored on progress object)
    if (progress.formOptions?.showProgress) {
      const allMeta = buildMetadataMap(fieldNames, input.schema);
      const dynamicTotal = computeDynamicTotal(fieldNames, allMeta, progress.formData, shouldRenderField);
      const currentPos = progress.fieldsCompleted + 1;
      const progressText = renderProgress(currentPos, dynamicTotal, deps.t);
      // progressText will be composed into the message — prepended to field prompt
    }
```

**Threading `FormOptions` into `iterateFields`:** Since `max-params` is 3 and `iterateFields(input, deps, progress)` is already at the limit, we add `formOptions: Required<FormOptions>` as an optional property on `FormProgress`. This is set in `form.runner.ts` before calling `iterateFields`:

```typescript
// In form.runner.ts, before calling iterateFields:
progress.formOptions = merged; // merged is Required<FormOptions>
```

Update `FormProgress` interface in `form.runner.ts`:
```typescript
export interface FormProgress {
  // ... existing fields ...
  formOptions?: Required<FormOptions>;  // NEW — injected before iterateFields
}
```

This approach avoids adding a 4th parameter while keeping FormOptions accessible throughout the iterator.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/input-engine/src/runner/progress.renderer.ts packages/input-engine/src/runner/field.iterator.ts packages/input-engine/tests/unit/progress.renderer.test.ts
git commit -m "feat(input-engine): add dynamic progress indicator (Task 55)

Pure functions computeDynamicTotal() and renderProgress(). Dynamic total
re-evaluated after each field for conditional visibility. Controlled by
showProgress option in FormOptions."
```

---

### Task 56: Back Navigation with Keep Current

**Files:**
- Modify: `packages/input-engine/src/fields/field.handler.ts` (line 6-12)
- Modify: `packages/input-engine/src/runner/field.iterator.ts`
- Modify: `packages/input-engine/src/runner/action-buttons.builder.ts`
- Test: `packages/input-engine/tests/unit/field.iterator.test.ts` (modify)

**Context:** When navigating back to a previously completed field, the handler receives `previousValue` in `RenderContext`. Action buttons include "Keep current" when `previousValue` is defined.

- [ ] **Step 1: Write failing tests**

Add tests to `tests/unit/field.iterator.test.ts`:
1. Keep current returns the `previousValue` unchanged
2. Re-entering a new value overrides the previous
3. `previousValue` is `undefined` on first-time field entry
4. "Keep current" button shown when `previousValue` is defined
5. "Keep current" button NOT shown on first entry

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Add previousValue to RenderContext**

In `src/fields/field.handler.ts`, update RenderContext:
```typescript
export interface RenderContext {
  conversation: unknown;
  ctx: unknown;
  formData: Record<string, unknown>;
  formId: string;
  fieldIndex: number;
  previousValue?: unknown;  // NEW — populated during back navigation
}
```

- [ ] **Step 4: Add Keep Current button to ActionButtonsBuilder**

In `src/runner/action-buttons.builder.ts`, add `hasPreviousValue` to `ActionButtonContext`:
```typescript
export interface ActionButtonContext {
  formId: string;
  fieldIndex: number;
  isOptional: boolean;
  isFirstField: boolean;
  allowCancel: boolean;
  hasPreviousValue: boolean;  // NEW
}
```

Add Keep Current button in `buildActionButtons`:
```typescript
  if (ctx.hasPreviousValue) {
    navButtons.push({
      text: t('input-engine.actions.keep_current'),
      callbackData: encodeFormCallback(ctx.formId, ctx.fieldIndex, ACTION_CALLBACKS.KEEP_CURRENT),
    });
  }
```

- [ ] **Step 5: Wire previousValue into processField**

In `field.iterator.ts`, when building `RenderContext` in `processField`, add `previousValue` from `FieldContext`. Add `previousValue` to `FieldContext` interface.

In `iterateFields`, when navigating back, set `previousValue` on the FieldContext before calling `processField`:
```typescript
    // Before building FieldContext, check if we have a previous value
    const previousValue = progress.formData[fieldName]; // may be undefined
```

Handle `__keep_current__` callback in processField — return `ok(previousValue)`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/input-engine/src/fields/field.handler.ts packages/input-engine/src/runner/field.iterator.ts packages/input-engine/src/runner/action-buttons.builder.ts packages/input-engine/tests/unit/field.iterator.test.ts
git commit -m "feat(input-engine): add keep current button for back navigation (Task 56)

Add previousValue to RenderContext. Add Keep Current button when
previousValue exists. Handle __keep_current__ callback to return
previous value unchanged."
```

---

### Task 57: Confirmation Step

**Files:**
- Create: `packages/input-engine/src/runner/confirmation.renderer.ts`
- Modify: `packages/input-engine/src/runner/field.iterator.ts`
- Modify: `packages/input-engine/src/runner/form.runner.ts`
- Test: `packages/input-engine/tests/unit/confirmation.renderer.test.ts` (new)

**Context:** After all fields complete, display summary with Confirm/Edit/Cancel buttons. Edit flow: select field → re-enter → re-evaluate conditions → re-display. Timeout reset on confirmation display (D19).

**IMPORTANT:** This is the most complex task. The confirmation step sits between `iterateFields` completion and `handleResult` in `form.runner.ts`. The edit flow requires re-entering `iterateFields` for specific fields.

- [ ] **Step 1: Write failing tests for confirmation renderer**

Create `tests/unit/confirmation.renderer.test.ts`:
1. `formatFieldValue` for text shows the value
2. `formatFieldValue` for choice shows the label from metadata options
3. `formatFieldValue` for media shows "File uploaded" (i18n)
4. `formatFieldValue` for boolean shows checkmark/cross
5. `formatFieldValue` for `undefined` (skipped optional) shows "—"
6. `buildConfirmationSummary` builds multi-line string
7. Confirmation truncates values > 100 chars with "..."
8. `CONFIRMATION_ACTIONS` constant has correct values

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/confirmation.renderer.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement confirmation.renderer.ts**

Create `src/runner/confirmation.renderer.ts`:

```typescript
import type { FieldMetadata } from '../input-engine.types.js';

/** Confirmation action callbacks */
export const CONFIRMATION_ACTIONS = {
  CONFIRM: '__confirm__',
  EDIT: '__edit__',
  CANCEL: '__cancel__',
} as const;

/** Translation function type */
type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/** Default translate — returns raw key */
function defaultT(key: string): string {
  return key;
}

const MAX_VALUE_LENGTH = 100;

/** Format a single field value for confirmation display */
export function formatFieldValue(
  value: unknown,
  metadata: FieldMetadata,
  t: TranslateFunction = defaultT,
): string {
  if (value === undefined || value === null) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }

  // Media types
  const mediaTypes = ['Photo', 'Document', 'Video', 'Audio', 'FileGroup'];
  if (mediaTypes.includes(metadata.fieldType)) {
    return t('input-engine.confirmation.file_uploaded');
  }

  // Choice types — find label
  if (metadata.options && typeof value === 'string') {
    const option = metadata.options.find((o) => o.value === value);
    if (option) return truncate(option.label);
  }

  // Default: stringify
  const str = String(value);
  return truncate(str);
}

/** Truncate text to MAX_VALUE_LENGTH chars */
function truncate(text: string): string {
  if (text.length <= MAX_VALUE_LENGTH) return text;
  return text.slice(0, MAX_VALUE_LENGTH) + '...';
}

/** Build a confirmation summary string */
export function buildConfirmationSummary(
  formData: Record<string, unknown>,
  fieldMetadata: Map<string, FieldMetadata>,
  t: TranslateFunction = defaultT,
): string {
  const lines: string[] = [];
  lines.push(t('input-engine.confirmation.title'));
  lines.push('');

  for (const [fieldName, value] of Object.entries(formData)) {
    const metadata = fieldMetadata.get(fieldName);
    if (!metadata) continue;

    const label = t(metadata.i18nKey);
    const formatted = formatFieldValue(value, metadata, t);
    lines.push(`${label}: ${formatted}`);
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: Wire confirmation into form.runner.ts**

In `src/runner/form.runner.ts`, after `iterateFields` returns `ok`, check `showConfirmation`:

```typescript
  const loopResult = await iterateFields(input, deps, progress);

  if (loopResult.isOk() && progress.formOptions?.showConfirmation) {
    // Reset timeout for confirmation step (D19)
    progress.startTime = Date.now();
    const confirmResult = await handleConfirmationLoop(input, deps, progress);
    if (confirmResult.isErr()) return confirmResult;
    // On ok, formData may have been updated by edit flow
  }
```

- [ ] **Step 5: Implement confirmation loop in confirmation.handler.ts**

Create `src/runner/confirmation.handler.ts` (separate file to keep under 200 lines):

```typescript
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { FormRunnerInput, FormRunnerDeps, FormProgress } from './form.runner.js';
import { buildConfirmationSummary, CONFIRMATION_ACTIONS } from './confirmation.renderer.js';
import { encodeFormCallback, decodeFormCallback } from '../utils/callback-data.helper.js';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { getFieldMetadata } from './schema.validator.js';
import { shouldRenderField } from './condition.evaluator.js';
import type { z } from 'zod';

/** Build metadata map from schema for confirmation display */
function buildMetadataMap(
  fieldNames: string[],
  schema: z.ZodObject<z.ZodRawShape>,
): Map<string, import('../input-engine.types.js').FieldMetadata> {
  const map = new Map();
  for (const name of fieldNames) {
    const fieldSchema = schema.shape[name] as z.ZodType;
    map.set(name, getFieldMetadata(fieldSchema));
  }
  return map;
}

/** Handle the confirmation loop: display → wait → confirm/edit/cancel */
export async function handleConfirmationLoop(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  progress: FormProgress,
): AsyncResult<void, AppError> {
  const fieldNames = Object.keys(input.schema.shape);
  const t = deps.t ?? ((key: string) => key);

  while (true) {
    // Build and display confirmation summary
    const metadataMap = buildMetadataMap(fieldNames, input.schema);
    const summary = buildConfirmationSummary(progress.formData, metadataMap, t);

    // Send summary with Confirm/Edit/Cancel buttons
    const conv = input.conversation as {
      external: (fn: () => Promise<unknown>) => Promise<unknown>;
    };
    const ctx = input.ctx as {
      reply: (text: string, options?: unknown) => Promise<unknown>;
    };
    await ctx.reply(summary, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: t('input-engine.confirmation.confirm'),
              callback_data: encodeFormCallback(progress.formId, -1, CONFIRMATION_ACTIONS.CONFIRM),
            },
            {
              text: t('input-engine.confirmation.edit'),
              callback_data: encodeFormCallback(progress.formId, -1, CONFIRMATION_ACTIONS.EDIT),
            },
          ],
          [
            {
              text: t('input-engine.confirmation.cancel'),
              callback_data: encodeFormCallback(progress.formId, -1, CONFIRMATION_ACTIONS.CANCEL),
            },
          ],
        ],
      },
    });

    // Wait for user response (via conversation.wait or similar grammY pattern)
    // The actual wait mechanism depends on grammY conversation API
    // For now, this receives the callback query data
    const response = await (conv as { waitForCallbackQuery: (filter: RegExp) => Promise<{ data: string }> })
      .waitForCallbackQuery(/^ie:/);

    const decoded = decodeFormCallback(response.data);
    if (!decoded) {
      deps.logger.warn({ msg: 'Invalid confirmation callback', data: response.data });
      continue; // Re-display summary
    }

    const action = decoded.value;

    if (action === CONFIRMATION_ACTIONS.CONFIRM) {
      return ok(undefined); // Form complete
    }

    if (action === CONFIRMATION_ACTIONS.CANCEL) {
      return err(new AppError(INPUT_ENGINE_ERRORS.FORM_CANCELLED, {
        reason: 'user_cancel',
        stage: 'confirmation',
      }));
    }

    if (action === CONFIRMATION_ACTIONS.EDIT) {
      // Show field selection keyboard
      const editableFields = fieldNames.filter((name) => {
        const meta = metadataMap.get(name);
        return meta && shouldRenderField(meta, progress.formData);
      });

      const fieldButtons = editableFields.map((name, idx) => ({
        text: t(metadataMap.get(name)!.i18nKey),
        callback_data: encodeFormCallback(progress.formId, idx, '__edit_field__'),
      }));

      // Send field selection (chunk into rows of 2)
      const rows = [];
      for (let i = 0; i < fieldButtons.length; i += 2) {
        rows.push(fieldButtons.slice(i, i + 2));
      }

      await ctx.reply(t('input-engine.confirmation.select_field'), {
        reply_markup: { inline_keyboard: rows },
      });

      // Wait for field selection
      const fieldResponse = await (conv as { waitForCallbackQuery: (filter: RegExp) => Promise<{ data: string }> })
        .waitForCallbackQuery(/^ie:/);

      const fieldDecoded = decodeFormCallback(fieldResponse.data);
      if (!fieldDecoded) continue;

      const editFieldIndex = fieldDecoded.fieldIndex;
      const editFieldName = fieldNames[editFieldIndex];
      if (!editFieldName) continue;

      // Remove the field from completed so it gets re-asked
      const completedIdx = progress.completedFieldNames.indexOf(editFieldName);
      if (completedIdx !== -1) {
        progress.completedFieldNames.splice(completedIdx, 1);
        progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
      }
      // Keep the old value as previousValue context
      const oldValue = progress.formData[editFieldName];
      delete progress.formData[editFieldName];

      // Re-evaluate conditions: remove any fields after edit point that are now hidden
      for (let i = editFieldIndex + 1; i < fieldNames.length; i++) {
        const fname = fieldNames[i]!;
        const fmeta = metadataMap.get(fname);
        if (fmeta && !shouldRenderField(fmeta, progress.formData)) {
          const cidx = progress.completedFieldNames.indexOf(fname);
          if (cidx !== -1) {
            progress.completedFieldNames.splice(cidx, 1);
            delete progress.formData[fname];
            progress.fieldsCompleted = Math.max(0, progress.fieldsCompleted - 1);
          }
        }
      }

      // Re-run iterateFields — it will pick up the uncompleted field(s) and re-ask them
      // The iterator skips completed fields, so only removed ones will be asked
      // Reset timeout for the edit cycle (D19)
      progress.startTime = Date.now();
      const editResult = await (await import('./field.iterator.js')).iterateFields(input, deps, progress);
      if (editResult.isErr()) return editResult;

      // Loop back to display updated confirmation
      continue;
    }
  }
}
```

**File size management:** This function is in its own file `confirmation.handler.ts` (~120 lines) to keep both `form.runner.ts` and `field.iterator.ts` under the 200-line limit. The file imports from `confirmation.renderer.ts` (pure display functions) and `field.iterator.ts` (for re-entering iteration during edit).

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/input-engine/src/runner/confirmation.renderer.ts packages/input-engine/src/runner/confirmation.handler.ts packages/input-engine/src/runner/form.runner.ts packages/input-engine/src/runner/field.iterator.ts packages/input-engine/tests/unit/confirmation.renderer.test.ts
git commit -m "feat(input-engine): add confirmation step with edit flow (Task 57)

Pure functions formatFieldValue() and buildConfirmationSummary() in
confirmation.renderer.ts. Confirmation loop in confirmation.handler.ts
with Confirm/Edit/Cancel buttons. Timeout reset on confirmation (D19).
Edit re-evaluates conditions and re-enters iterator for changed fields."
```

---

### Task 58: Storage Engine Integration

**Files:**
- Modify: `packages/input-engine/src/fields/media/photo.field.ts`
- Modify: `packages/input-engine/src/fields/media/document.field.ts`
- Modify: `packages/input-engine/src/fields/media/video.field.ts`
- Modify: `packages/input-engine/src/fields/media/audio.field.ts`
- Modify: `packages/input-engine/src/fields/media/file-group.field.ts`
- Test: Modify 5 existing media test files

**Context:** When `storageClient` is in deps, after successful parse/validate, handler downloads file from Telegram via `conversation.external(() => ctx.api.getFile(fileId))`, then calls `storageClient.upload(buffer, { filename, mimeType })` via `conversation.external()`. Graceful degradation on failure.

**NOTE:** `storageClient` needs to be accessible from within the field handler. Currently `RenderContext` has `conversation` and `ctx` but no `storageClient`. We need to add it to `RenderContext` or pass it separately. Since max-params is 3 and handler methods already take `(renderCtx, metadata)`, add `storageClient` to `RenderContext`.

- [ ] **Step 1: Write failing tests for storage integration**

Add tests to each media test file (photo, document, video, audio, file-group):
1. With `storageClient` in RenderContext: returns `{ telegramFileId, storageUrl, fileName, mimeType, size }`
2. Without `storageClient`: returns `{ telegramFileId }` only (existing behavior)
3. Upload failure: logs warning, returns `{ telegramFileId }` only (graceful degradation)

That's 3 tests per handler × 5 handlers = 15 new tests minimum.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test`
Expected: New tests FAIL

- [ ] **Step 3: Add storageClient to RenderContext**

In `src/fields/field.handler.ts`, add to `RenderContext`:
```typescript
export interface RenderContext {
  conversation: unknown;
  ctx: unknown;
  formData: Record<string, unknown>;
  formId: string;
  fieldIndex: number;
  previousValue?: unknown;
  storageClient?: StorageEngineClient;  // NEW — for media upload
  aiClient?: AIExtractionClient;        // NEW — for AI extraction
  t?: (key: string, params?: Record<string, unknown>) => string;  // NEW — i18n
  logger?: InputEngineLogger;           // NEW — for logging upload failures
}
```

Import `StorageEngineClient`, `AIExtractionClient`, and `InputEngineLogger` types.

- [ ] **Step 4: Create shared storage upload helper**

Create `src/fields/media/storage-upload.helper.ts`:

```typescript
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { StorageEngineClient } from '../../input-engine.contracts.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Parameters for storage upload */
interface UploadParams {
  fileId: string;
  conversation: unknown;
  ctx: unknown;
  storageClient: StorageEngineClient;
  filename: string;
  mimeType: string;
}

/** Result of a storage upload */
export interface StorageUploadResult {
  telegramFileId: string;
  storageUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

/** Telegram file response shape */
interface TelegramFile {
  file_id: string;
  file_path?: string;
  file_size?: number;
}

/** Download file buffer from Telegram using conversation.external() */
async function downloadFromTelegram(
  params: UploadParams,
): AsyncResult<{ buffer: Buffer; fileSize: number }, AppError> {
  const conv = params.conversation as {
    external: <T>(fn: () => Promise<T>) => Promise<T>;
  };
  const api = (params.ctx as { api: {
    getFile: (id: string) => Promise<TelegramFile>;
    downloadFile: (filePath: string) => Promise<Buffer>;
  } }).api;

  const fileInfo = await conv.external(async () => api.getFile(params.fileId));
  if (!fileInfo.file_path) {
    return err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
      fieldType: 'MediaUpload',
      reason: 'Telegram file has no file_path',
      fileId: params.fileId,
    }));
  }

  const buffer = await conv.external(async () => api.downloadFile(fileInfo.file_path!));
  return ok({ buffer, fileSize: fileInfo.file_size ?? buffer.length });
}

/** Upload file to storage engine with graceful degradation. Returns Result. */
export async function uploadToStorage(
  params: UploadParams,
): AsyncResult<StorageUploadResult, AppError> {
  // Step 1: Download from Telegram
  const downloadResult = await downloadFromTelegram(params);
  if (downloadResult.isErr()) {
    // Graceful degradation — return telegramFileId only
    return ok({ telegramFileId: params.fileId });
  }

  const { buffer, fileSize } = downloadResult.value;

  // Step 2: Upload to storage via conversation.external()
  const conv = params.conversation as {
    external: <T>(fn: () => Promise<T>) => Promise<T>;
  };

  const uploadResult = await conv.external(async () =>
    params.storageClient.upload(buffer, {
      filename: params.filename,
      mimeType: params.mimeType,
    }),
  ).then(
    (result) => ok(result as { url: string }),
    (error: unknown) => err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
      fieldType: 'MediaUpload',
      reason: 'Storage upload failed',
      error: String(error),
    })),
  );

  if (uploadResult.isErr()) {
    // Graceful degradation — log and return telegramFileId only
    return ok({ telegramFileId: params.fileId });
  }

  return ok({
    telegramFileId: params.fileId,
    storageUrl: uploadResult.value.url,
    fileName: params.filename,
    mimeType: params.mimeType,
    size: fileSize,
  });
}
```

**Key points:**
- Uses `conversation.external()` for both Telegram download and storage upload (D21)
- Input-engine downloads file to Buffer, passes Buffer to storage-engine (D22 — storage stays Telegram-agnostic)
- Result-based error handling throughout — no try/catch
- Graceful degradation: on any failure, returns `ok({ telegramFileId })` instead of propagating error
- The `downloadFile` API is grammY's built-in method for downloading files given a `file_path`

- [ ] **Step 5: Update each media handler to call storage upload**

For each of the 5 handlers (photo, document, video, audio, file-group), add storage upload logic after successful parse/validate. The pattern is the same for all:

```typescript
// In validate() or as a post-processing step:
if (renderCtx.storageClient) {
  const uploadResult = await uploadToStorage({ ... });
  return ok(uploadResult);
}
return ok({ telegramFileId: value.fileId });
```

Note: Since `validate` returns `Result` not `AsyncResult`, the storage upload should happen in `render` or as a post-processing step. Consider adding a `postProcess` hook or doing the upload in a wrapper called from `processField` in the iterator.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/input-engine/src/fields/media/*.ts packages/input-engine/src/fields/field.handler.ts packages/input-engine/tests/unit/*.field.test.ts
git commit -m "feat(input-engine): add storage engine integration to media handlers (Task 58)

All 5 media handlers (photo, document, video, audio, file-group) upload
to storageClient when provided. Downloads from Telegram via
conversation.external(), passes Buffer to storageClient.upload().
Graceful degradation on failure — returns telegramFileId only."
```

---

### Task 59: AI Extraction Full Flow

**Files:**
- Modify: `packages/input-engine/src/fields/smart/ai-extractor.field.ts`
- Test: `packages/input-engine/tests/unit/ai-extractor.field.test.ts` (modify)

**Context:** Replace the stub implementation with full extraction flow: render prompt → parse response → extract via AI → display confirmation → handle accept/edit/manual. Uses `aiClient` from `FormRunnerDeps` passed via `RenderContext`. Caption-based text extraction (D23).

- [ ] **Step 1: Write failing tests for full AI flow**

Modify `tests/unit/ai-extractor.field.test.ts` — add tests:
1. Full extraction success: returns extracted values
2. Partial extraction: accepted values + missing fields fallback
3. AI unavailable (`isAvailable()` returns false): falls back to manual input
4. User accepts all extracted values
5. User chooses "Edit" to modify extracted values
6. User chooses "Manual input" — bypasses extraction entirely
7. Extraction failure: logs warning, falls back to manual
8. Caption from photo used as input text (D23)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tempot/input-engine test -- tests/unit/ai-extractor.field.test.ts`
Expected: New tests FAIL (stub implementation)

- [ ] **Step 3: Implement full AI extraction in ai-extractor.field.ts**

Rewrite `src/fields/smart/ai-extractor.field.ts` with the full extraction → confirmation → accept/edit/manual flow:

```typescript
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { encodeFormCallback } from '../../utils/callback-data.helper.js';

/** AI extraction action callbacks */
const AI_ACTIONS = {
  ACCEPT: '__ai_accept__',
  EDIT: '__ai_edit__',
  MANUAL: '__ai_manual__',
} as const;

export class AIExtractorFieldHandler implements FieldHandler {
  readonly fieldType = 'AIExtractorField' as const;

  async render(
    renderCtx: RenderContext,
    metadata: FieldMetadata,
  ): AsyncResult<unknown, AppError> {
    const conv = renderCtx.conversation as {
      external: <T>(fn: () => Promise<T>) => Promise<T>;
      waitFor: () => Promise<unknown>;
      waitForCallbackQuery: (filter: RegExp) => Promise<{ data: string }>;
    };
    const ctx = renderCtx.ctx as {
      reply: (text: string, options?: unknown) => Promise<unknown>;
    };
    const t = (renderCtx as { t?: (key: string, params?: Record<string, unknown>) => string }).t
      ?? ((key: string) => key);

    // Check AI availability
    const aiClient = renderCtx.aiClient;
    if (!aiClient) return ok(undefined); // No AI client — fall back to manual

    const isAvailable = await conv.external(async () => aiClient.isAvailable());
    if (!isAvailable) {
      // Show unavailability message, fall back to manual (Rule XXXIII — <1s)
      await ctx.reply(t('input-engine.ai.unavailable'));
      return ok(undefined); // Manual fallback handled by caller
    }

    // Send extraction prompt
    await ctx.reply(t('input-engine.ai.prompt'));

    // Wait for user input (text, photo caption, or document caption — D23)
    const message = await conv.waitFor();
    const msg = message as { text?: string; caption?: string };
    const inputText = msg.text ?? msg.caption;

    if (!inputText) {
      return ok(undefined); // No extractable text — manual fallback
    }

    // Call AI extraction via conversation.external() (D21)
    const targetFields = metadata.extractionFields ?? [];
    const extractionResult = await conv.external(async () =>
      aiClient.extract(inputText, targetFields),
    ).then(
      (result) => ok(result as Record<string, unknown>),
      (error: unknown) => err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        fieldType: this.fieldType,
        reason: 'AI extraction failed',
        error: String(error),
      })),
    );

    if (extractionResult.isErr()) {
      // Graceful degradation — log and return undefined for manual fallback
      return ok(undefined);
    }

    const extracted = extractionResult.value;

    // Display extracted values for confirmation
    const summaryLines = Object.entries(extracted)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${t(`input-engine.fields.${k}`)}: ${String(v)}`);

    if (summaryLines.length === 0) {
      return ok(undefined); // Nothing extracted — manual fallback
    }

    const summaryText = [
      t('input-engine.ai.extracted_summary'),
      '',
      ...summaryLines,
    ].join('\n');

    await ctx.reply(summaryText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: t('input-engine.ai.accept'),
              callback_data: encodeFormCallback(renderCtx.formId, renderCtx.fieldIndex, AI_ACTIONS.ACCEPT),
            },
            {
              text: t('input-engine.ai.edit'),
              callback_data: encodeFormCallback(renderCtx.formId, renderCtx.fieldIndex, AI_ACTIONS.EDIT),
            },
          ],
          [
            {
              text: t('input-engine.ai.manual'),
              callback_data: encodeFormCallback(renderCtx.formId, renderCtx.fieldIndex, AI_ACTIONS.MANUAL),
            },
          ],
        ],
      },
    });

    // Wait for confirmation response
    const response = await conv.waitForCallbackQuery(/^ie:/);
    const action = response.data.split(':').pop();

    if (action === AI_ACTIONS.ACCEPT) {
      return ok(extracted); // All values accepted
    }

    if (action === AI_ACTIONS.MANUAL) {
      return ok(undefined); // Manual fallback
    }

    // EDIT: return partial extraction — caller handles remaining fields manually
    return ok({ ...extracted, __partial__: true });
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    // Extract text from message: text, photo caption, or document caption (D23)
    const msg = message as { text?: string; caption?: string };
    const text = msg.text ?? msg.caption;
    if (!text) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No text or caption in message',
        }),
      );
    }
    return ok(text.trim());
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    if (!value || (typeof value === 'string' && value.length === 0)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value cannot be empty',
        }),
      );
    }
    return ok(value);
  }
}
```

**Key design decisions:**
- `render()` handles the full AI flow internally since it requires multi-turn conversation interaction
- AI client accessed via `renderCtx.aiClient` (added in Task 50 via FormRunnerDeps → RenderContext chain)
- `conversation.external()` wraps both `isAvailable()` and `extract()` calls (D21)
- Caption-based text extraction only — no OCR/PDF parsing (D23)
- On Accept: returns full extracted object
- On Manual: returns `undefined` — caller falls back to step-by-step
- On Edit: returns partial extraction with `__partial__` flag — caller asks remaining fields
- On any failure: graceful degradation to manual input
- `t` function accessed from renderCtx for i18n (threaded from FormRunnerDeps)

**Note on `aiClient` in RenderContext:** Task 50 adds `aiClient` to `FormRunnerDeps`. Task 58 adds `storageClient` to `RenderContext`. The same pattern applies — `aiClient` should also be on `RenderContext` for the AI extractor handler to use. Add in Step 3 of Task 58 when updating `RenderContext`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @tempot/input-engine test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/input-engine/src/fields/smart/ai-extractor.field.ts packages/input-engine/tests/unit/ai-extractor.field.test.ts
git commit -m "feat(input-engine): implement full AI extraction flow (Task 59)

Full pipeline: render prompt → parse text/caption → extract via aiClient
→ confirmation with Accept/Edit/Manual buttons. Graceful degradation
when AI unavailable. Caption-based text extraction (D23)."
```

---

### Task 60: Barrel Exports Update

**Files:**
- Modify: `packages/input-engine/src/index.ts`
- Test: All existing tests continue to pass

**Context:** Export all new Phase 2 public types and constants from the barrel file.

- [ ] **Step 1: Write test to verify exports**

Add a test that imports all new Phase 2 exports from `@tempot/input-engine` and verifies they exist.

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (exports not yet added)

- [ ] **Step 3: Update index.ts barrel exports**

Add to `src/index.ts`:

```typescript
// Phase 2 — Action Buttons
export { ACTION_CALLBACKS } from './runner/action-buttons.builder.js';
export type {
  ActionButtonContext,
  ActionButtonRow,
} from './runner/action-buttons.builder.js';

// Phase 2 — Confirmation
export { CONFIRMATION_ACTIONS } from './runner/confirmation.renderer.js';

// Phase 2 — Progress
export { computeDynamicTotal, renderProgress } from './runner/progress.renderer.js';

// Phase 2 — Validation Errors
export { renderValidationError } from './runner/validation-error.renderer.js';
export type { RetryState } from './runner/validation-error.renderer.js';

// Phase 2 — Event Payloads
export type { FieldSkippedPayload } from './runner/event.emitter.js';

// Phase 2 — Types (already exported via FormOptions update)
export { FIELD_SKIPPED_SENTINEL } from './input-engine.types.js';
export type { FormProgress } from './runner/form.runner.js';
```

- [ ] **Step 4: Run full validation suite**

Run:
- `pnpm --filter @tempot/input-engine test` — all tests pass
- `pnpm --filter @tempot/input-engine exec tsc --noEmit` — zero type errors
- `pnpm --filter @tempot/input-engine exec eslint src/ --max-warnings 0` — zero warnings

- [ ] **Step 5: Commit**

```bash
git add packages/input-engine/src/index.ts
git commit -m "feat(input-engine): update barrel exports for Phase 2 (Task 60)

Export ACTION_CALLBACKS, CONFIRMATION_ACTIONS, FIELD_SKIPPED_SENTINEL,
computeDynamicTotal, renderProgress, renderValidationError, RetryState,
FormProgress, ActionButtonContext, ActionButtonRow."
```

---

## Final Verification Checklist

After all tasks complete, verify:

- [ ] All tests pass: `pnpm --filter @tempot/input-engine test`
- [ ] TypeScript: `pnpm --filter @tempot/input-engine exec tsc --noEmit`
- [ ] ESLint: `pnpm --filter @tempot/input-engine exec eslint src/ --max-warnings 0`
- [ ] No file exceeds 200 code lines
- [ ] No function exceeds 50 code lines
- [ ] No function exceeds 3 parameters
- [ ] Zero hardcoded user-facing text
- [ ] All 448 existing tests still pass
- [ ] All new Phase 2 tests pass
