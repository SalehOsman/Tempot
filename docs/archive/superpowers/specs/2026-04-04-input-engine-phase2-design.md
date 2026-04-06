# Input Engine Phase 2 Design Document — UX & Integration Layer

**Date:** 2026-04-04
**Package:** `@tempot/input-engine`
**Spec:** `specs/011-input-engine-package/`
**Phase 1 Design:** `docs/superpowers/specs/2026-04-03-input-engine-design.md`
**Status:** Approved

## Overview

Phase 2 adds 8 features to the existing `@tempot/input-engine` package, covering UX enhancements (action buttons, progress, validation errors, back navigation, confirmation) and integration features (storage engine, AI extraction full flow). All features are additive and backward-compatible — existing `runForm()` calls with no new options work identically.

## Features

### 1. Optional Field Skip (FR-051)

Fields marked `optional: true` in Zod 4 registry metadata display a "Skip" inline button. The button is rendered as an extra row in the field's inline keyboard via the ActionButtonsBuilder (D7 single-message pattern).

**Technical approach:**

- `buildActionButtons()` pure function in `action-buttons.builder.ts` takes `ActionButtonContext` and returns `ActionButtonRow[]`
- Callback data format: `ie:{formId}:{fieldIndex}:__skip__`
- Sentinel value `FIELD_SKIPPED_SENTINEL` returned as `ok(...)` from field processing to signal skip
- Auto-skip on `maxRetries` exhaustion for optional fields (reason: `max_retries_skip`)
- Event: `input-engine.field.skipped` with `FieldSkippedPayload` (reason: `user_skip` | `max_retries_skip`)

### 2. Cancel Command Interception (FR-052, FR-053)

Dual-path cancellation: inline "Cancel" button (`__cancel__` callback) + text command `/cancel`. Both paths are suppressed when `allowCancel: false`.

**Technical approach:**

- Cancel button rendered via ActionButtonsBuilder alongside Skip/Back
- `/cancel` text intercepted BEFORE `parseResponse` — compared case-insensitively
- When `allowCancel: false`, both inline button and `/cancel` text are suppressed; `/cancel` treated as normal input
- Partial save data is PRESERVED on cancellation (never deleted) — allows form resumption later
- Returns `err(FORM_CANCELLED)` with `reason: 'user_cancel'`

### 3. Validation Error Display (FR-054)

Validation errors are embedded/prepended into the re-rendered field prompt as a single message (D7 pattern). No separate error message.

**Technical approach:**

- Pure function `renderValidationError()` in `validation-error.renderer.ts`
- Fallback hierarchy: `metadata.i18nErrorKey` → `DEFAULT_ERROR_KEYS[fieldType]` → `'input-engine.errors.generic'`
- Error messages include retry context: `t(key, { attempt, maxRetries })`
- Requires `t` function in `FormRunnerDeps` (Research Decision 18). When `t` is absent, raw key strings are used as fallback
- Error text is prepended to the field prompt before re-rendering

### 4. Progress Indicator (FR-055)

Progress text ("Field X of Y") is embedded at the top of the field prompt message. The total is dynamic — re-computed after each field.

**Technical approach:**

- `renderProgress()` pure function in `progress.renderer.ts`
- `computeDynamicTotal()` calls `shouldRenderField()` on all fields against current `formData` — O(N) per field, negligible for <100 fields (Research Decision 17)
- i18n key: `'input-engine.progress'` with `{ current, total }`
- Controlled by `showProgress: true` (default) in `FormOptions`
- Progress text prepended to field prompt before action buttons

### 5. Back Navigation (FR-056)

Users can navigate backward to previously completed fields via a "Back" button.

**Technical approach:**

- Core change: restructure `iterateFields` from `for` loop to `while (index < fieldNames.length)` with mutable index (Research Decision 16)
- Sentinel: `err(NAVIGATE_BACK)` as internal error code (not user-facing)
- Back navigation walks backward past condition-false fields (Research Decision 25) — lands on last user-answered field
- "Keep current" button (`__keep_current__` callback) when `previousValue` exists in `RenderContext`
- First field (`fieldIndex === 0`) suppresses Back button entirely
- On back: remove field from `completedFieldNames`, delete from `formData`, decrement `fieldsCompleted`
- After partial save restore, back navigation works within restored fields
- Conditional re-evaluation on back: newly-hidden fields removed from `formData` and `completedFieldNames`

### 6. Confirmation Step (FR-057, FR-058)

After all fields are completed, a summary is displayed for review. Controlled by `showConfirmation: true` (default).

**Technical approach:**

- `renderConfirmationSummary()` in `confirmation.renderer.ts`
- Timeout reset: `progress.startTime = Date.now()` on summary display (Research Decision 19) — fresh `maxMilliseconds` window for review
- Per-type value formatting in `formatFieldValue()`: text=value, choice=label, media="File uploaded", boolean=checkmark, skipped=dash
- Three action buttons: Confirm / Edit / Cancel (callback data: `ie:{formId}:confirm:__confirm__`, etc.)
- Edit flow: secondary inline keyboard lists field names → user selects → re-enter with `previousValue` context → re-evaluate conditions → ask newly-visible fields after edited field (Research Decision 27) → re-display summary
- Overflow handling: truncate each field value to 100 chars with '...' for overflow; split across multiple messages if total exceeds Telegram's 4096-char limit (Research Decision 26)

### 7. Storage Engine Integration (FR-059)

Media field handlers upload files to `@tempot/storage-engine` when `storageClient` is provided in `FormRunnerDeps`.

**Technical approach:**

- Input-engine downloads the file from Telegram (Research Decision 22): `conversation.external(() => ctx.api.getFile(fileId))` → download → `Buffer`
- Passes `Buffer` to `storageClient.upload(buffer, { filename, mimeType })` → returns URL string
- Storage-engine stays Telegram-agnostic — receives Buffer, not fileId
- `conversation.external()` wrapping is mandatory for conversations plugin serialization (Research Decision 21)
- Graceful degradation on upload failure: log warning, return `{ telegramFileId }` only
- All 5 media handlers (photo, document, video, audio, file-group) use the same integration pattern
- When `storageClient` is absent, current behavior preserved (return `{ telegramFileId }`)

### 8. AI Extraction Full Flow (FR-031 enhanced)

Complete AI extraction pipeline with confirmation, editing, and graceful degradation.

**Technical approach:**

- Input-engine extracts text from media inputs before calling `aiClient.extract()` (Research Decision 23): for both photos and documents, the Telegram message **caption** is used as text input. No OCR or PDF text extraction in Phase 2 — user describes data in caption or sends free text. OCR deferred to future phase.
- `AIExtractionClient.extract(input: string, targetFields: string[])` contract stays string-only
- Full 7-step flow: render prompt → parse response → extract via AI → display confirmation → handle accept/edit/manual → handle partial success → handle unavailability
- Three confirmation buttons: "Accept all" / "Edit" / "Manual input"
- `aiClient.isAvailable()` guard before extraction attempt (Rule XXXIII — AI degradation)
- Extraction failure → graceful fallback to manual step-by-step input with warning logged
- Extracted values validated against Zod schemas of target fields; invalid extractions treated as missing
- Edit flow: select extracted field → re-enter manually → re-display extraction summary

## Architecture

### New Files (Phase 2)

```
packages/input-engine/src/runner/
├── action-buttons.builder.ts    # Pure function: buildActionButtons()
├── progress.renderer.ts         # Pure function: renderProgress(), computeDynamicTotal()
├── validation-error.renderer.ts # Pure function: renderValidationError()
├── confirmation.renderer.ts     # Pure function: renderConfirmationSummary(), formatFieldValue()
```

### Modified Files

```
packages/input-engine/src/runner/
├── field.iterator.ts            # while loop, back nav, skip/cancel handling
├── form.runner.ts               # confirmation step, progress wiring
├── event.emitter.ts             # field.skipped event emission
packages/input-engine/src/
├── input-engine.types.ts        # FormOptions additions, ActionButtonContext, FIELD_SKIPPED_SENTINEL, etc.
├── input-engine.errors.ts       # NAVIGATE_BACK internal error code
├── input-engine.contracts.ts    # No changes needed — contracts already defined
├── index.ts                     # Barrel exports for new types
```

### Data Flow — Single Field Interaction (Phase 2)

```
                    ┌─────────────────────────────────────────────┐
                    │              FormRunner loop                 │
                    │  while (index < fieldNames.length)           │
                    ├─────────────────────────────────────────────┤
                    │                                             │
                    │  1. computeDynamicTotal(fields, formData)   │
                    │  2. renderProgress(current, total, t)       │
                    │  3. shouldRenderField(field, formData)      │
                    │     └── false → emit field.skipped(condition)│
                    │  4. buildActionButtons(context)             │
                    │  5. handler.render(ctx, metadata, formData) │
                    │  6. Compose message: progress + prompt      │
                    │     + field keyboard + action button rows   │
                    │  7. Wait for response or action button      │
                    │     ├── __skip__  → sentinel ok, index++    │
                    │     ├── __cancel__ → err(FORM_CANCELLED)    │
                    │     ├── __back__  → walk back, index--      │
                    │     ├── __keep__  → keep value, index++     │
                    │     └── input     → parse → validate        │
                    │        ├── valid  → save, index++           │
                    │        └── invalid → renderError + retry    │
                    │            └── optional + maxRetries → skip │
                    │                                             │
                    └─────────────────────────────────────────────┘
                                       │
                              All fields complete
                                       │
                    ┌─────────────────────────────────────────────┐
                    │         Confirmation Step (Phase 2)         │
                    │  if showConfirmation:                       │
                    │    1. Reset progress.startTime              │
                    │    2. renderConfirmationSummary(formData)   │
                    │    3. Wait for Confirm/Edit/Cancel          │
                    │       ├── Confirm → return ok(formData)     │
                    │       ├── Edit → select field → re-enter    │
                    │       │   → re-evaluate conditions          │
                    │       │   → ask new fields after edited     │
                    │       │   → re-display summary              │
                    │       └── Cancel → err(FORM_CANCELLED)      │
                    └─────────────────────────────────────────────┘
```

## Dependencies

No new external packages. All Phase 2 features use existing dependencies:

- grammY conversations v2.1.1 (already installed)
- Zod 4 (already installed)
- neverthrow 8.2.0 (already installed)
- @tempot/ux-helpers (already dependency)
- @tempot/shared CacheService (already dependency)
- @tempot/event-bus (already dependency)

## Backward Compatibility

All Phase 2 features are additive:

- `showProgress: true` and `showConfirmation: true` are defaults but do not change behavior for forms that previously had no action buttons, since Phase 1 had no action buttons at all
- `FormRunnerDeps.t`, `.storageClient`, `.aiClient` are all optional — existing callers that don't pass them get Phase 1 behavior
- The `while` loop restructure in `field.iterator.ts` is an internal change — the `processField` interface is unchanged
- `allowCancel: true` is the existing default — no behavioral change for existing forms

## Research Decisions (Phase 2)

| #   | Decision                            | Key Point                                                   |
| --- | ----------------------------------- | ----------------------------------------------------------- |
| D15 | Action Button Rendering             | Single-message pattern — append rows to field keyboard      |
| D16 | Bidirectional Iteration             | While loop with mutable index                               |
| D17 | Dynamic Progress Total              | Re-evaluate conditions after each field                     |
| D18 | Translation as Structural Interface | `t` function in FormRunnerDeps, no hard i18n dependency     |
| D19 | Confirmation Timeout Reset          | Fresh `maxMilliseconds` window for review                   |
| D20 | Confirmation Edit Re-evaluation     | Conditional re-evaluation on edit                           |
| D21 | Storage via RenderContext Extension | `conversation.external()` wrapping for uploads              |
| D22 | Input-Engine Downloads Files        | Buffer passed to storage, not fileId                        |
| D23 | Input-Engine Extracts Text          | Text extracted before AI client call                        |
| D24 | Single-Message Composition          | Progress and errors embedded in field prompt                |
| D25 | Back Nav Skips Condition-False      | Walk backward past condition-skipped fields                 |
| D26 | Confirmation Overflow Handling      | Truncate 100 chars + split if >4096                         |
| D27 | Edit Inserts After Edited Field     | Newly-visible fields asked in schema order after edit point |

## Task Breakdown

12 tasks (see `specs/011-input-engine-package/tasks.md`, Tasks 49-60):

- Task 49: ActionButtonsBuilder pure function
- Task 50: FormOptions/FormRunnerDeps Phase 2 updates
- Task 51: Optional Field Skip
- Task 52: Cancel Command Interception
- Task 53: Validation Error Display
- Task 54: Bidirectional Iteration (while loop restructure)
- Task 55: Progress Indicator
- Task 56: Back Navigation Keep Current
- Task 57: Confirmation Step
- Task 58: Storage Engine Integration
- Task 59: AI Extraction Full Flow
- Task 60: Barrel Exports Phase 2

Estimated total: 123 minutes.
