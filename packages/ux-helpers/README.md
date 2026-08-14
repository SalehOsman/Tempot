# @tempot/ux-helpers

> Standardised Telegram UX components — messages, keyboards, lists, confirmations, and feedback.

## Purpose

Enforces the UX Standards defined in the Project Constitution (Rules LXIV–LXIX). All user-facing text flows through i18n keys. All keyboards comply with character and row limits. All context-aware helpers follow the Golden Rule (edit existing message first, fall back to send).

## Phase

Phase 3 — Presentation Layer

## Dependencies

| Package             | Version   | Purpose                                              |
| ------------------- | --------- | ---------------------------------------------------- |
| `grammy`            | ^1.41.1   | Telegram context types, `InlineKeyboard`, `Keyboard` |
| `neverthrow`        | 8.2.0     | `Result<T, E>` pattern — no thrown exceptions        |
| `@tempot/shared`    | workspace | `AppError`, `Result`, `AsyncResult` types            |
| `@tempot/i18n-core` | workspace | `t()` function for all user-facing text              |
| `@tempot/logger`    | workspace | Error logging in context-aware helpers               |

## API

### Pure Formatters

| Function                | Signature                                                  | Description                                |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `formatLoading`         | `(options: StatusFormatOptions) => string`                 | Format loading status message with ⏳      |
| `formatSuccess`         | `(options: StatusFormatOptions) => string`                 | Format success status message with ✅      |
| `formatError`           | `(options: StatusFormatOptions) => string`                 | Format error status message with ❌        |
| `formatWarning`         | `(options: StatusFormatOptions) => string`                 | Format warning status message with ⚠️      |
| `formatUserError`       | `(options: UserErrorOptions) => string`                    | Format user error with problem + solution  |
| `formatSystemError`     | `(options: SystemErrorOptions) => string`                  | Format system error with reference code    |
| `formatPermissionError` | `(options: PermissionErrorOptions) => string`              | Format permission denied message           |
| `formatSessionExpired`  | `(options: SessionExpiredOptions) => SessionExpiredResult` | Format session expired with restart button |

### Keyboards

| Function               | Signature                                                                | Description                                        |
| ---------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| `createInlineKeyboard` | `() => TempotInlineKeyboard`                                             | Builder for inline keyboards with label validation |
| `createReplyKeyboard`  | `() => TempotReplyKeyboard`                                              | Builder for reply keyboards with label validation  |
| `createConfirmation`   | `(options: ConfirmationOptions) => Result<ConfirmationResult, AppError>` | Confirmation dialog with confirm/cancel buttons    |

### Label Validation

| Function         | Signature                                                       | Description                               |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `validateLabel`  | `(label: string, type: KeyboardType) => Result<void, AppError>` | Validate button label length and emoji    |
| `detectLanguage` | `(text: string) => DetectedLanguage`                            | Detect Arabic vs English text             |
| `getCharLimit`   | `(type: KeyboardType, language: DetectedLanguage) => number`    | Get character limit for keyboard/language |
| `getRowLimit`    | `(type: KeyboardType) => number`                                | Get max buttons per row                   |

### Lists

| Function          | Signature                                                                  | Description                                  |
| ----------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| `formatList`      | `<T>(options: ListFormatOptions<T>) => Result<ListFormatResult, AppError>` | Format a list with title, items, empty state |
| `toEmojiNumber`   | `(n: number) => string`                                                    | Convert 1-10 to emoji number (1️⃣–🔟)         |
| `buildPagination` | `(options: PaginationOptions) => Result<InlineKeyboard, AppError>`         | Build pagination navigation buttons          |

### Message Composition

| Function         | Signature               | Description                                 |
| ---------------- | ----------------------- | ------------------------------------------- |
| `createComposer` | `() => ComposerBuilder` | Fluent builder for multi-paragraph messages |

### Callback Data

| Function             | Signature                                                                        | Description                            |
| -------------------- | -------------------------------------------------------------------------------- | -------------------------------------- |
| `encodeCallbackData` | `(parts: readonly string[]) => Result<string, AppError>`                         | Encode parts into callback data string |
| `decodeCallbackData` | `(data: string) => Result<readonly string[], AppError>`                          | Decode callback data into parts        |
| `encodeWithExpiry`   | `(parts: readonly string[], expiryMinutes?: number) => Result<string, AppError>` | Encode with expiry timestamp           |
| `decodeWithExpiry`   | `(data: string) => Result<DecodedCallbackWithExpiry, AppError>`                  | Decode and extract expiry info         |

### Expiry

| Function      | Signature                                             | Description                         |
| ------------- | ----------------------------------------------------- | ----------------------------------- |
| `isExpired`   | `(callbackData: string) => Result<boolean, AppError>` | Check if callback data has expired  |
| `checkExpiry` | `(callbackData: string) => Result<void, AppError>`    | Assert callback data is not expired |

### Context-Aware Helpers

| Function         | Signature                                                               | Description                                     |
| ---------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| `editOrSend`     | `(ctx, options: EditOrSendOptions) => AsyncResult<void, AppError>`      | Edit existing message or send new (Golden Rule) |
| `answerCallback` | `(ctx, options?: AnswerCallbackOptions) => AsyncResult<void, AppError>` | Answer callback query safely                    |
| `showTyping`     | `(ctx) => AsyncResult<void, AppError>`                                  | Send typing indicator                           |

### Status Sender

| Function      | Signature                                                          | Description                        |
| ------------- | ------------------------------------------------------------------ | ---------------------------------- |
| `sendLoading` | `(ctx, options: StatusSendOptions) => AsyncResult<void, AppError>` | Send loading status via editOrSend |
| `sendSuccess` | `(ctx, options: StatusSendOptions) => AsyncResult<void, AppError>` | Send success status via editOrSend |
| `sendError`   | `(ctx, options: StatusSendOptions) => AsyncResult<void, AppError>` | Send error status via editOrSend   |
| `sendWarning` | `(ctx, options: StatusSendOptions) => AsyncResult<void, AppError>` | Send warning status via editOrSend |

### Feedback

| Function          | Signature                                                           | Description                              |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| `executeFeedback` | `<T>(ctx, options: FeedbackOptions<T>) => AsyncResult<T, AppError>` | Loading → action → success/error pattern |

### Testing

Available via `@tempot/ux-helpers/testing` subpath:

| Function            | Signature                                                            | Description                               |
| ------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| `createMockContext` | `(options?: MockContextOptions) => { ctx, calls: MockContextCalls }` | Create mock grammY context for unit tests |

## Constants

| Constant                      | Value                                                       | Description                       |
| ----------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `STATUS_EMOJIS`               | `{ loading: ⏳, success: ✅, error: ❌, warning: ⚠️ }`      | Status type to emoji mapping      |
| `CHAR_LIMITS`                 | `{ inline: { ar: 20, en: 24 }, reply: { ar: 15, en: 18 } }` | Button character limits           |
| `ROW_LIMITS`                  | `{ inline: 3, reply: 2 }`                                   | Max buttons per row               |
| `CONFIRMATION_EXPIRY_MINUTES` | `5`                                                         | Default confirmation expiry       |
| `CALLBACK_SEPARATOR`          | `':'`                                                       | Callback data part separator      |
| `MAX_CALLBACK_BYTES`          | `64`                                                        | Telegram callback data byte limit |
| `MAX_MESSAGE_LENGTH`          | `4096`                                                      | Telegram message length limit     |
| `PAGINATION_THRESHOLD`        | `5`                                                         | Min items before pagination       |
| `EMOJI_NUMBERS`               | `['1️⃣', ..., '🔟']`                                         | Emoji digits 1-10                 |
| `EMOJI_BULLET`                | `'●'`                                                       | List item bullet character        |

## Button Standards (Constitution Rule LXVI)

| Rule                                  | Value           |
| ------------------------------------- | --------------- |
| Max Arabic chars per button (inline)  | 20              |
| Max English chars per button (inline) | 24              |
| Max Arabic chars per button (reply)   | 15              |
| Max English chars per button (reply)  | 18              |
| Max buttons per row (inline)          | 3               |
| Max buttons per row (reply)           | 2               |
| Emoji position                        | Start of text   |
| Confirm + Cancel                      | Always same row |

## Status

✅ **Implemented** — Phase 3
