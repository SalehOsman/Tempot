# Feature Specification: @tempot/ux-helpers

**Feature Branch**: `012-ux-helpers-package`
**Created**: 2026-03-19
**Updated**: 2026-03-26
**Status**: Complete
**Input**: Centralized UX component library enforcing Constitution Rules LXIV-LXIX and Architecture Spec Section 13.

## Overview

@tempot/ux-helpers is the centralized UX component library for the Tempot framework. It provides a dual API:

- **Pure layer** — functions that return formatted strings/objects (easy to test, no side effects)
- **Context-aware layer** — wrappers that take grammY `ctx`, enforce the Golden Rule (edit existing messages), and handle errors gracefully

This package makes it structurally impossible for downstream packages to produce non-compliant UI by enforcing all Constitution UX rules programmatically.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Consistent Visual Feedback (Priority: P0)

As a user, I want the bot to use consistent symbols and formatting for loading, success, error, and warning states so that I can understand the bot's status at a glance.

**Why this priority**: Core UX requirement (Rule LXV, Section 13.4). Every bot response uses status formatting.

**Acceptance Scenarios**:

1. **Given** a successful operation, **When** the bot responds, **Then** it uses the `✅` prefix with the i18n-translated past-tense message.
2. **Given** an in-progress operation, **When** the bot shows loading, **Then** it uses the `⏳` prefix with present-tense verb via i18n.
3. **Given** an error, **When** the bot responds, **Then** it uses the `❌` prefix with problem + solution text via i18n.
4. **Given** a warning, **When** the bot responds, **Then** it uses the `⚠️` prefix with caution + options text via i18n.

### User Story 2 — Golden Rule Message Updates (Priority: P0)

As a user, I want the bot to edit existing messages instead of sending new ones so that my chat stays clean and app-like.

**Why this priority**: Golden Rule (Rule LXIV, Section 13.3). Foundational UX principle.

**Acceptance Scenarios**:

1. **Given** a button press, **When** the action takes >1 second, **Then** the existing message is immediately edited to show loading state.
2. **Given** loading state displayed, **When** the action completes, **Then** the same message is edited with the result.
3. **Given** the original message was deleted by the user, **When** editMessageText fails, **Then** a new message is sent as fallback and a warning is logged.

### User Story 3 — Inline Keyboard Builder (Priority: P0)

As a developer, I want a keyboard builder that automatically enforces button standards so that all modules produce consistent UX without manual rule-checking.

**Why this priority**: Rule LXVI, Section 13.1. Every interactive bot response uses keyboards.

**Acceptance Scenarios**:

1. **Given** buttons with mixed label lengths, **When** I build the keyboard, **Then** short buttons are grouped (max 3/row) and long buttons get their own row.
2. **Given** an Arabic label exceeding 20 characters, **When** I add it to the builder, **Then** the builder returns an error result.
3. **Given** an inline button label without a leading emoji, **When** I add it via `button()`, **Then** the builder returns an error result with `LABEL_NO_EMOJI`.
4. **Given** I need the underlying grammY InlineKeyboard, **When** I call build(), **Then** I get access to the native grammY keyboard instance.

### User Story 4 — Reply Keyboard Builder (Priority: P1)

As a developer, I want a reply keyboard builder with different limits from inline keyboards for simple data collection scenarios.

**Why this priority**: Section 13.1 defines separate limits for reply keyboards.

**Acceptance Scenarios**:

1. **Given** reply keyboard labels, **When** I build, **Then** max 2 buttons per row and 15 Arabic / 18 English char limits are enforced.
2. **Given** I use the reply keyboard, **When** built, **Then** the underlying grammY Keyboard instance is returned.

### User Story 5 — Error Messages (Priority: P0)

As a user, I want error messages tailored to the error type so I know what happened and what to do next.

**Why this priority**: Rule LXIX, Section 13.5. Critical for user trust.

**Acceptance Scenarios**:

1. **Given** a user validation error, **When** displayed, **Then** the message shows the problem and a direct solution.
2. **Given** a system error, **When** displayed, **Then** a generic message appears with a unique reference code linking to the Audit Log.
3. **Given** a permission error, **When** displayed, **Then** only the denial reason is shown with no technical details.
4. **Given** an expired session, **When** displayed, **Then** a notification appears with a restart button.

### User Story 6 — Confirmation Dialogs (Priority: P0)

As a user, I want confirmation dialogs that clearly describe the action and auto-expire to prevent stale button presses.

**Why this priority**: Rule LXVII, Section 13.6. Prevents accidental destructive actions.

**Acceptance Scenarios**:

1. **Given** a confirmation request, **When** displayed, **Then** the confirm button shows the action name (not "Yes").
2. **Given** an RTL context, **When** buttons render, **Then** Cancel is on the left and Confirm on the right.
3. **Given** 5 minutes have passed, **When** the user presses confirm, **Then** the expiry checker rejects the action with an expiry message.
4. **Given** an irreversible action, **When** displayed, **Then** a warning message accompanies the confirmation.

### User Story 7 — List Display (Priority: P1)

As a user, I want lists to show item counts, use emoji numbers, and paginate automatically at 5+ items.

**Why this priority**: Rule LXVIII, Section 13.7.

**Acceptance Scenarios**:

1. **Given** a list of items, **When** formatted, **Then** the title includes the count: "Title (N)".
2. **Given** items in a list, **When** formatted, **Then** each item is prefixed with emoji numbers (1️⃣, 2️⃣, etc.).
3. **Given** an empty list, **When** formatted, **Then** an empty state message with a next-step button is shown.
4. **Given** 7 items with page size 5, **When** page 1 is displayed, **Then** only 5 items show with a "Next" button.

### User Story 8 — Feedback Handler (Priority: P1)

As a developer, I want a convenience function that handles the loading-action-result flow so I don't have to manually orchestrate status updates.

**Why this priority**: Section 13.8. Reduces boilerplate in every command handler.

**Acceptance Scenarios**:

1. **Given** an action to execute, **When** I use the feedback handler, **Then** it shows loading, executes the action, and shows the result automatically.
2. **Given** the action fails, **When** feedback handler catches the error, **Then** it shows the error status and returns the error result.

### User Story 9 — Message Composer (Priority: P1)

As a developer, I want a message composition utility that enforces text formatting rules structurally.

**Why this priority**: Section 13.2 text rules must be enforced consistently.

**Acceptance Scenarios**:

1. **Given** multiple paragraphs, **When** composed, **Then** proper spacing is inserted between them.
2. **Given** list items, **When** composed, **Then** emoji bullets are used (not dashes).
3. **Given** text exceeding 4096 characters, **When** composed, **Then** the composer returns an error result.

### User Story 10 — Callback Data Encoding (Priority: P1)

As a developer, I want type-safe callback data encoding that validates the 64-byte Telegram limit.

**Why this priority**: Every inline button uses callback data. Exceeding 64 bytes silently fails in Telegram.

**Acceptance Scenarios**:

1. **Given** callback data parts, **When** encoded, **Then** a type-safe string is produced.
2. **Given** encoded data exceeding 64 bytes, **When** encoding, **Then** an error result is returned.
3. **Given** encoded callback data, **When** decoded, **Then** the original parts are recovered with correct types.

### User Story 11 — Test Helpers (Priority: P1)

As a downstream package developer, I want a mock grammY Context factory so I can test UX interactions without a real Telegram connection.

**Why this priority**: Every downstream package that tests bot responses needs mock context.

**Acceptance Scenarios**:

1. **Given** I import from `@tempot/ux-helpers/testing`, **When** I create a mock context, **Then** it has all required methods (editMessageText, reply, answerCallbackQuery).
2. **Given** a mock context, **When** I call editMessageText, **Then** the call is tracked and assertions can verify the text.

### User Story 12 — Typing Indicator (Priority: P2)

As a user, I want to see "typing..." before long operations for a professional feel.

**Why this priority**: Section 13.8 polish feature.

**Acceptance Scenarios**:

1. **Given** a long operation, **When** the typing helper is called, **Then** `ctx.replyWithChatAction('typing')` is invoked.

---

## Edge Cases

### Button Edge Cases

- **Label exceeding character limit**: Return `Result.err()` with descriptive error code. Do not truncate silently.
- **Mixed RTL/LTR text in button labels**: Use first-character detection (Decision D5) to determine Arabic vs English limit.
- **Empty button label**: Return `Result.err()`.
- **Button label with only emoji (no text)**: Valid — emoji-only buttons are allowed.
- **Inline button label without leading emoji**: Return `Result.err()` with `LABEL_NO_EMOJI`. Reply keyboard labels do not require emoji.

### Message Edge Cases

- **Message text exceeding 4096 characters**: Message Composer returns `Result.err()` before attempting to send.
- **editMessageText failure (message deleted/too old)**: Golden Rule Fallback sends a new message and logs warning via @tempot/logger. Never crashes.
- **editMessageText failure (message not modified)**: Catch Telegram's "message is not modified" error and treat as success (no-op).

### Callback Data Edge Cases

- **Callback data exceeding 64 bytes**: Encoder returns `Result.err()`.
- **Malformed callback data on decode**: Decoder returns `Result.err()` with parse error.
- **Empty callback data**: Decoder returns `Result.err()`.

### Confirmation Edge Cases

- **Confirmation expiry race condition**: User clicks confirm at exactly 5 minutes. Expiry checker uses `<=` comparison — expired at exactly 5 min.
- **Confirmation with stale message**: Golden Rule Fallback handles editMessageText failure.
- **Double-click on confirm**: answerCallbackQuery removes loading indicator; second click gets "expired" response.

### Pagination Edge Cases

- **Page 1 with no previous**: No "Previous" button shown.
- **Last page with no next**: No "Next" button shown.
- **Single page (< 5 items)**: No pagination buttons shown at all.
- **Total items is 0**: Show empty state with next-step button instead of pagination.

### List Edge Cases

- **Empty list**: Show empty state message with a next-step button (e.g., "Create New").
- **Emoji number overflow (> 10 items on one page)**: Items 11+ use text numbers "11." instead of emoji numbers.
- **List title with very long text**: Truncate title to fit within message constraints.

### Context Edge Cases

- **answerCallbackQuery after timeout**: Telegram rejects after ~30 seconds. Catch and log, do not crash.
- **ctx missing chat or message**: Return `Result.err()` with descriptive error. Do not throw.
- **Typing indicator on channel (not chat)**: Some chat types don't support typing. Catch and ignore.

---

## Requirements _(mandatory)_

### Functional Requirements

#### Messages (Pure Layer)

- **FR-001**: System MUST provide a Status Formatter with 4 status types (Loading ⏳, Success ✅, Error ❌, Warning ⚠️) as pure functions returning formatted strings. Each status type follows the pattern defined in Rule LXV and Section 13.4.

- **FR-002**: System MUST provide an Error Message Builder with 4 error types per Rule LXIX and Section 13.5:
  - User Error: problem + direct solution
  - System Error: generic message + reference code (links to Audit Log)
  - Permission Error: denial reason only, no technical details
  - Session Expired: notification + restart button config

- **FR-003**: System MUST provide a Message Composer that enforces Section 13.2 text rules structurally:
  - Paragraphs with proper spacing
  - Emoji bullets (not dashes) for lists
  - Validates 4096-character Telegram message limit
  - Returns `Result<string, AppError>`

#### Messages (Context-Aware Layer)

- **FR-004**: System MUST provide a Status Sender that wraps Status Formatter + `ctx.editMessageText()` to enforce the Golden Rule (Rule LXIV, Section 13.3). Shows loading immediately, edits same message with result.

#### Keyboards

- **FR-005**: System MUST provide an Inline Keyboard Builder that wraps grammY's `InlineKeyboard` class and enforces:
  - Max 20 Arabic / 24 English characters per button (Section 13.1)
  - Max 3 buttons per row
  - Emoji at start of button text (Rule LXVI)
  - Long labels automatically placed on their own row
  - Language detection via first character (Decision D5)
  - Returns `Result<InlineKeyboard, AppError>`

- **FR-006**: System MUST provide a Reply Keyboard Builder that wraps grammY's `Keyboard` class with different limits:
  - Max 15 Arabic / 18 English characters per button (Section 13.1)
  - Max 2 buttons per row
  - Returns `Result<Keyboard, AppError>`

- **FR-007**: System MUST provide a Confirmation Builder that enforces Rule LXVII and Section 13.6:
  - Button text = action name (not "Yes")
  - RTL ordering: Cancel left, Confirm right (renders correctly in RTL)
  - 5-minute expiry timestamp encoded in callback data (stateless, Decision D3)
  - Warning message for irreversible actions
  - Returns `Result<ConfirmationResult, AppError>` containing keyboard + message text

#### Lists

- **FR-008**: System MUST provide a List Formatter (pure) per Rule LXVIII and Section 13.7:
  - Title with count: "Title (N)"
  - Emoji numbers for items: 1️⃣ 2️⃣ etc.
  - Empty state with next-step button configuration
  - Returns formatted string + optional keyboard config

- **FR-009**: System MUST provide a Pagination Builder per Section 13.7:
  - Previous/Next buttons with page callbacks
  - Current page indicator
  - Auto-pagination at 5+ items
  - No pagination for single page
  - Boundary handling (no prev on page 1, no next on last page)

#### Feedback

- **FR-010**: System MUST provide a Feedback Handler (context-aware) per Section 13.8:
  - Convenience flow: show loading → execute action → show result → show next-step buttons
  - Error handling: show error status on action failure
  - Combines Status Sender + Golden Rule flow

#### Utilities

- **FR-011**: System MUST provide a Callback Data Encoder/Decoder:
  - Type-safe encode/decode for callback data parts
  - Validates Telegram's 64-byte callback_data limit
  - Encodes confirmation expiry timestamps
  - Returns `Result<string, AppError>` on encode, `Result<T, AppError>` on decode

- **FR-012**: System MUST provide a Label Validator:
  - Character counting with language detection (first character determines Arabic vs English limit)
  - Validates button labels against inline keyboard limits (20/24) and reply keyboard limits (15/18)
  - Returns `Result<void, AppError>` with descriptive error on validation failure

#### Helpers (Context-Aware)

- **FR-013**: System MUST provide a Golden Rule Fallback:
  - Wraps `ctx.editMessageText()` with error handling
  - On failure (message deleted/too old): sends new message + logs warning via @tempot/logger
  - On "message is not modified" error: treats as success
  - Returns `AsyncResult<void, AppError>`

- **FR-014**: System MUST provide Answer Callback Query integration:
  - Auto-calls `ctx.answerCallbackQuery()` to remove button loading indicator
  - Supports optional toast notification text
  - Catches timeout errors (>30s) gracefully

- **FR-015**: System MUST provide a Typing Indicator Helper:
  - Calls `ctx.replyWithChatAction('typing')` for professional feel before long operations
  - Catches errors for unsupported chat types

#### Testing

- **FR-016**: System MUST provide a Mock Context Factory exported from `@tempot/ux-helpers/testing` subpath:
  - Creates mock grammY Context objects with tracked method calls
  - Supports: editMessageText, reply, answerCallbackQuery, replyWithChatAction, api.raw.editMessageText
  - Factory function with options for pre-configuring context state
  - Used by all downstream packages testing UX interactions

### Non-Functional Requirements

- **NFR-001**: Pure formatting functions MUST be synchronous (no async, no I/O). Target < 1ms per call.
- **NFR-002**: All public APIs MUST return `Result<T, AppError>` or `AsyncResult<T, AppError>` via neverthrow. No thrown exceptions.
- **NFR-003**: Zero hardcoded user-facing text. All strings via `t()` from @tempot/i18n-core.
- **NFR-004**: No `any` types, no `@ts-ignore`, no `eslint-disable`.
- **NFR-005**: No `console.*` in source code. Use @tempot/logger for warnings/errors.
- **NFR-006**: All imports use `.js` extensions (ESM).
- **NFR-007**: Tree-shakeable exports — each component independently importable.
- **NFR-008**: Unit test coverage target: 80%+ for all components.
- **NFR-009**: Zero dependencies beyond: grammy, neverthrow, @tempot/shared, @tempot/i18n-core, @tempot/logger.
- **NFR-010**: Maximum 200 lines per file, 50 lines per function, 3 parameters per function (Rule II).

---

## Design Decisions

| #   | Decision           | Choice                                                                               | Rationale                                                        |
| --- | ------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| D1  | API Layer          | Dual: Pure (returns string/object) + Context-aware (takes ctx, enforces Golden Rule) | Testing easier for pure layer; Golden Rule requires ctx for edit |
| D2  | Keyboard Types     | Inline + Reply with different character/row limits                                   | Section 13.1 explicitly defines both types                       |
| D3  | Expiry Mechanism   | Timestamp encoded in callback data (stateless)                                       | Survives bot restart, no DB dependency                           |
| D4  | RTL Button Order   | Cancel first in code, then Confirm (renders as Confirm=right in RTL)                 | Telegram renders RTL right-to-left                               |
| D5  | Character Counting | Detect language of first char, apply appropriate limit (Arabic=20/15, English=24/18) | Mixed content uses first-char language                           |
| D6  | grammY Dependency  | Full dependency (not just types) — uses InlineKeyboard, Keyboard classes             | Wraps grammY builders, adds UX enforcement                       |
| D7  | @grammyjs/menu     | NOT used in ux-helpers (reserved for search-engine per ADR-025)                      | YAGNI — search-engine owns menu plugin                           |

---

## Constitution References

- **Rule LXIV** — Golden Rule: Edit existing message always
- **Rule LXV** — Status Message Types (4 types)
- **Rule LXVI** — Button Standards (char limits, row limits, emoji prefix)
- **Rule LXVII** — Confirmation Behavior (5-min expiry, action names, RTL ordering)
- **Rule LXVIII** — List Display (count in title, emoji numbers, auto-pagination, empty state)
- **Rule LXIX** — Error Messages (4 types: user, system, permission, session expired)
- **Rule II** — Code Limits (200 lines/file, 50 lines/function, 3 params/function)
- **Rule XXI** — Result Pattern (all public APIs return Result)
- **Rule XXXIX** — i18n-Only (zero hardcoded text)

## Architecture References

- **Section 13.1** — Button limits table (inline + reply keyboards)
- **Section 13.2** — Text formatting rules
- **Section 13.3** — Golden Rule message lifecycle
- **Section 13.4** — Four status message types
- **Section 13.5** — Error message types
- **Section 13.6** — Confirmation messages
- **Section 13.7** — List display standards
- **Section 13.8** — Central UX library

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 15 components implemented with full test coverage.
- **SC-002**: 100% of status messages follow the standardized patterns (4 types with correct emojis).
- **SC-003**: 100% of keyboards enforce character/row limits automatically.
- **SC-004**: Confirmation builder produces RTL-correct button ordering.
- **SC-005**: Callback data encoder rejects data exceeding 64 bytes.
- **SC-006**: Feedback handler orchestrates loading-action-result flow without manual intervention.
- **SC-007**: Golden Rule Fallback gracefully handles deleted/stale messages.
- **SC-008**: Mock Context Factory provides tracked method calls for downstream testing.
- **SC-009**: Zero `any` types, zero `console.*`, zero hardcoded text in source.
- **SC-010**: All tests pass, build succeeds, package-creation-checklist 10/10.
- **SC-011**: RTL button ordering verified: Cancel left, Confirm right in confirmation dialogs.
- **SC-012**: List formatter correctly shows empty state with next-step button.
- **SC-013**: Message composer rejects text exceeding 4096 characters.
- **SC-014**: Label validator correctly differentiates Arabic/English character limits via first-char detection.
