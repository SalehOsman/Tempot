# @tempot/ux-helpers — Task Breakdown

> **Contract:** This file defines the ordered task list for implementation via Superpowers.
> Each task follows TDD: RED (write failing test) → GREEN (minimal implementation) → REFACTOR.

---

## Task 1: Infrastructure Setup

**FRs:** N/A (scaffolding)
**Files to create:**

- `packages/ux-helpers/.gitignore`
- `packages/ux-helpers/package.json`
- `packages/ux-helpers/tsconfig.json`
- `packages/ux-helpers/vitest.config.ts`
- `packages/ux-helpers/src/index.ts` (empty barrel, populated incrementally)
- `packages/ux-helpers/src/ux.types.ts` (all interfaces from data-model.md)
- `packages/ux-helpers/src/ux.errors.ts` (UX_ERRORS constant)
- `packages/ux-helpers/src/ux.constants.ts` (all constants from data-model.md)

**Acceptance:**

- [ ] Package builds with `pnpm build --filter @tempot/ux-helpers`
- [ ] `pnpm install` resolves workspace dependencies
- [ ] `.gitignore` matches package-creation-checklist item 1
- [ ] `tsconfig.json` has `outDir: "dist"` (checklist item 2)
- [ ] `package.json` has correct main/types/exports (checklist items 3-5)
- [ ] `vitest.config.ts` exists (checklist item 6)
- [ ] `vitest: "4.1.0"` exact version (checklist item 7)
- [ ] No `any` types in types.ts
- [ ] No `console.*` in any file

---

## Task 2: Label Validator + Callback Data Encoder

**FRs:** FR-011, FR-012
**Files:**

- `src/keyboards/label.validator.ts`
- `src/callback-data/callback-data.encoder.ts`
- `tests/unit/label.validator.test.ts`
- `tests/unit/callback-data.encoder.test.ts`

**Acceptance:**

- [ ] `validateLabel()` returns `Result.err()` for labels exceeding Arabic (20) or English (24) char limits for inline
- [ ] `validateLabel()` returns `Result.err()` for labels exceeding Arabic (15) or English (18) char limits for reply
- [ ] `detectLanguage()` correctly identifies Arabic vs English from first character (SC-014)
- [ ] `encodeCallbackData()` returns `Result.err()` when encoded data exceeds 64 bytes (SC-005)
- [ ] `decodeCallbackData()` returns `Result.err()` for malformed/empty data
- [ ] `encodeWithExpiry()` embeds Unix timestamp in callback data
- [ ] `decodeWithExpiry()` extracts parts and expiry timestamp
- [ ] All tests pass

---

## Task 3: Status Formatter (Pure)

**FRs:** FR-001
**Files:**

- `src/messages/status.formatter.ts`
- `tests/unit/status.formatter.test.ts`

**Acceptance:**

- [ ] `formatLoading()` returns string prefixed with ⏳
- [ ] `formatSuccess()` returns string prefixed with ✅
- [ ] `formatError()` returns string prefixed with ❌
- [ ] `formatWarning()` returns string prefixed with ⚠️
- [ ] All functions use `t()` from @tempot/i18n-core for text (SC-002)
- [ ] All functions are synchronous (no async)
- [ ] All pure functions complete in < 1ms per call — benchmark test required (NFR-001)
- [ ] All tests pass

---

## Task 4: Message Composer

**FRs:** FR-003
**Files:**

- `src/messages/message.composer.ts`
- `tests/unit/message.composer.test.ts`

**Acceptance:**

- [ ] `createComposer().paragraph().build()` formats with proper spacing
- [ ] `bulletList()` uses emoji bullets (not dashes)
- [ ] `separator()` adds visual separator
- [ ] `build()` returns `Result.err()` when text exceeds 4096 characters (SC-013)
- [ ] Builder is chainable (fluent API)
- [ ] All tests pass

---

## Task 5: Error Formatter

**FRs:** FR-002
**Files:**

- `src/messages/error.formatter.ts`
- `tests/unit/error.formatter.test.ts`

**Acceptance:**

- [ ] `formatUserError()` returns problem + solution text with ❌ prefix
- [ ] `formatSystemError()` returns generic message with reference code
- [ ] `formatPermissionError()` returns denial reason only with ❌ prefix
- [ ] `formatSessionExpired()` returns notification text + restart button config
- [ ] All text via i18n `t()` function
- [ ] All functions are synchronous
- [ ] All tests pass

---

## Task 6: Inline Keyboard Builder

**FRs:** FR-005
**Files:**

- `src/keyboards/inline.builder.ts`
- `tests/unit/inline.builder.test.ts`

**Acceptance:**

- [ ] `createInlineKeyboard()` returns a builder wrapping grammY InlineKeyboard
- [ ] `.button()` validates label via label.validator (returns `Result.err()` if invalid)
- [ ] Auto-wraps rows at max 3 buttons per row
- [ ] Long labels (exceeding half the char limit) get their own row
- [ ] `.build()` returns `Result<InlineKeyboard, AppError>` (SC-003)
- [ ] `.toGrammyKeyboard()` returns the underlying grammY InlineKeyboard
- [ ] All tests pass

---

## Task 7: Reply Keyboard Builder

**FRs:** FR-006
**Files:**

- `src/keyboards/reply.builder.ts`
- `tests/unit/reply.builder.test.ts`

**Acceptance:**

- [ ] `createReplyKeyboard()` returns a builder wrapping grammY Keyboard
- [ ] `.button()` validates label with reply limits (15 Arabic / 18 English, max 2/row)
- [ ] `.oneTime()` and `.resized()` work correctly
- [ ] `.build()` returns `Result<Keyboard, AppError>`
- [ ] All tests pass

---

## Task 8: Emoji Number Utility + List Formatter

**FRs:** FR-008
**Files:**

- `src/lists/emoji.formatter.ts`
- `src/lists/list.formatter.ts`
- `tests/unit/emoji.formatter.test.ts`
- `tests/unit/list.formatter.test.ts`

**Acceptance:**

- [ ] `toEmojiNumber(1)` returns "1️⃣", ..., `toEmojiNumber(10)` returns "🔟"
- [ ] `toEmojiNumber(11)` returns "11." (text fallback)
- [ ] `formatList()` includes count in title: "Title (N)"
- [ ] Items are prefixed with emoji numbers
- [ ] Empty list returns empty state message with next-step button config (SC-012)
- [ ] `formatList()` returns `Result<ListFormatResult, AppError>`
- [ ] All tests pass

---

## Task 9: Pagination Builder

**FRs:** FR-009
**Files:**

- `src/lists/pagination.builder.ts`
- `tests/unit/pagination.builder.test.ts`

**Acceptance:**

- [ ] `createPagination()` returns `Result<InlineKeyboard, AppError>`
- [ ] Page 1: no "Previous" button
- [ ] Last page: no "Next" button
- [ ] Single page: returns empty keyboard (no pagination needed)
- [ ] Current page indicator shown between prev/next
- [ ] All tests pass

---

## Task 10: Confirmation Builder

**FRs:** FR-007
**Files:**

- `src/keyboards/confirmation.builder.ts`
- `tests/unit/confirmation.builder.test.ts`

**Acceptance:**

- [ ] Confirm button shows action name via i18n (not "Yes")
- [ ] RTL ordering: Cancel first in array, Confirm second (Decision D4) (SC-004, SC-011)
- [ ] Expiry timestamp encoded in callback data via callback-data.encoder
- [ ] `isIrreversible: true` produces warning text
- [ ] Returns `Result<ConfirmationResult, AppError>`
- [ ] All tests pass

---

## Task 11: Expiry Checker Middleware

**FRs:** FR-011 (related)
**Files:**

- `src/middleware/expiry.checker.ts`
- `tests/unit/expiry.checker.test.ts`

**Acceptance:**

- [ ] `isExpired()` decodes callback data and checks expiry timestamp
- [ ] Returns `true` when current time >= expiry time
- [ ] Returns `false` when current time < expiry time
- [ ] `checkExpiry()` returns `Result.err()` with CONFIRMATION_EXPIRED code when expired
- [ ] Handles malformed callback data gracefully
- [ ] All tests pass

---

## Task 12: Golden Rule Fallback + Answer Callback + Typing Indicator

**FRs:** FR-013, FR-014, FR-015
**Files:**

- `src/helpers/golden-rule.fallback.ts`
- `src/helpers/callback.handler.ts`
- `src/helpers/typing.indicator.ts`
- `tests/unit/golden-rule.fallback.test.ts`
- `tests/unit/callback.handler.test.ts`
- `tests/unit/typing.indicator.test.ts`

**Acceptance:**

- [ ] `editOrSend()` tries editMessageText first
- [ ] On "message is not modified" error: returns `ok()` (no-op)
- [ ] On "message to edit not found" / "message can't be edited": sends new message + logs warning (SC-007)
- [ ] `answerCallback()` calls `ctx.answerCallbackQuery()` with optional text
- [ ] `answerCallback()` catches timeout errors (>30s) gracefully
- [ ] `showTyping()` calls `ctx.replyWithChatAction('typing')`
- [ ] `showTyping()` catches errors for unsupported chat types
- [ ] All functions return `AsyncResult<void, AppError>`
- [ ] All tests pass

---

## Task 13: Status Sender (Context-Aware)

**FRs:** FR-004
**Files:**

- `src/messages/status.sender.ts`
- `tests/unit/status.sender.test.ts`

**Acceptance:**

- [ ] `sendLoading()` formats via Status Formatter + sends via Golden Rule Fallback
- [ ] `sendSuccess()` formats and edits message
- [ ] `sendError()` formats and edits message
- [ ] `sendWarning()` formats and edits message
- [ ] Optional keyboard can be attached to the message
- [ ] All functions return `AsyncResult<void, AppError>`
- [ ] All tests pass

---

## Task 14: Feedback Handler

**FRs:** FR-010
**Files:**

- `src/feedback/feedback.handler.ts`
- `tests/unit/feedback.handler.test.ts`

**Acceptance:**

- [ ] Shows loading via Status Sender
- [ ] Executes the provided action
- [ ] On success: shows success status with optional keyboard
- [ ] On failure: shows error status
- [ ] Returns the action's result `AsyncResult<T, AppError>` (SC-006)
- [ ] All tests pass

---

## Task 15: Mock Context Factory (Testing Subpath)

**FRs:** FR-016
**Files:**

- `src/testing/mock.context.ts`
- `tests/unit/mock.context.test.ts`

**Acceptance:**

- [ ] `createMockContext()` returns a mock with tracked method calls
- [ ] Supports: editMessageText, reply, answerCallbackQuery, replyWithChatAction
- [ ] `calls` property tracks all invocations with arguments (SC-008)
- [ ] Configurable: chatId, messageId, callbackData, userId
- [ ] Exported from `@tempot/ux-helpers/testing` subpath
- [ ] All tests pass

---

## Task 16: Barrel Exports + README Update

**FRs:** N/A (integration)
**Files:**

- `src/index.ts` (finalize barrel exports)
- `README.md` (update with actual API documentation)

**Acceptance:**

- [ ] All public APIs exported from `src/index.ts` with section comments
- [ ] Types exported via `export type { ... }`
- [ ] All imports use `.js` extensions
- [ ] README.md updated with actual API, examples, and dependency list
- [ ] No phantom dependencies (checklist item 9)
- [ ] No `console.*` in `src/` (checklist item 8)
- [ ] Zero `any` types, zero `console.*`, zero hardcoded text in source (SC-009)
- [ ] All 18 components implemented with full test coverage (SC-001)
- [ ] All tests pass, build succeeds, package-creation-checklist 10/10 (SC-010)
- [ ] Clean workspace — no `.js` or `.d.ts` in `src/` (checklist item 10)
- [ ] Full build succeeds: `pnpm build --filter @tempot/ux-helpers`
- [ ] Full tests pass: `pnpm test --filter @tempot/ux-helpers`

---

## Implementation Order Summary

| Order | Task                 | Component(s)                                     | Dependencies                           |
| ----- | -------------------- | ------------------------------------------------ | -------------------------------------- |
| 1     | Infrastructure       | package.json, tsconfig, types, errors, constants | None                                   |
| 2     | Utilities            | Label Validator, Callback Data Encoder           | types, errors, constants               |
| 3     | Status Formatter     | Pure status formatting                           | i18n-core, constants                   |
| 4     | Message Composer     | Text composition rules                           | i18n-core, constants, errors           |
| 5     | Error Formatter      | 4 error type formatters                          | i18n-core, callback-data.encoder       |
| 6     | Inline Builder       | Inline keyboard wrapper                          | label.validator, grammY                |
| 7     | Reply Builder        | Reply keyboard wrapper                           | label.validator, grammY                |
| 8     | List + Emoji Numbers | List formatting                                  | emoji-number, i18n-core                |
| 9     | Pagination           | Page navigation buttons                          | grammY InlineKeyboard                  |
| 10    | Confirmation         | Confirm/cancel dialogs                           | label.validator, callback-data.encoder |
| 11    | Expiry Checker       | Confirmation expiry                              | callback-data.encoder                  |
| 12    | Ctx-Aware Helpers    | Golden Rule, Answer CB, Typing                   | logger, grammY context                 |
| 13    | Status Sender        | Ctx-aware status messages                        | status.formatter, golden-rule.fallback |
| 14    | Feedback Handler     | Loading→action→result flow                       | status.sender, answer-callback, typing |
| 15    | Mock Context         | Testing subpath                                  | grammY types                           |
| 16    | Integration          | Barrel exports, README                           | All components                         |

---

### Task 17: Pluggable Architecture Toggle (Rule XVI)

**Phase**: 1 (Infrastructure)
**Estimated Duration**: 10 minutes
**FR Coverage**: FR-017

Constitution Rule XVI requires `TEMPOT_UX_HELPERS=true/false` environment variable.

#### Acceptance Criteria

- [ ] Define `TEMPOT_UX_HELPERS` environment variable in config (default: `true`)
- [ ] When disabled, all builder/formatter functions return `err(AppError)` with code `ux.disabled`
- [ ] Document the disable behavior in README
- [ ] Unit test verifies disabled mode behavior
