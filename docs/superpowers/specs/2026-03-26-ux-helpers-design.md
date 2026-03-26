# @tempot/ux-helpers — Technical Design Document

**Date:** 2026-03-26
**Status:** Approved
**Spec:** `specs/012-ux-helpers-package/spec.md`
**Plan:** `specs/012-ux-helpers-package/plan.md`

---

## 1. Dual API Architecture (D1)

### Structure

Pure functions and ctx-aware wrappers live in **separate files** within the same directory:

```
messages/
  status.formatter.ts    ← Pure: returns string
  status.sender.ts       ← Ctx-aware: uses formatter + editMessageText
  error.formatter.ts     ← Pure: returns string/object
  message.composer.ts    ← Pure: builder returns string
```

### Rationale

- **Testability**: Pure functions need zero mocking. Ctx-aware functions mock only grammY context.
- **Dependency flow**: Ctx-aware imports pure, never the reverse.
- **File size**: Each file stays well under the 200-line limit (Rule II).
- **Reusability**: Pure formatters can be used in non-Telegram contexts (logs, web dashboard).

### Pattern

```typescript
// Pure layer — synchronous, no side effects
export function formatLoading(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.loading} ${t(options.key, options.interpolation)}`;
}

// Ctx-aware layer — async, wraps pure + handles Golden Rule
export async function sendLoading(
  ctx: Context,
  options: StatusSendOptions,
): AsyncResult<void, AppError> {
  const text = formatLoading(options);
  return editOrSend(ctx, { text, replyMarkup: options.keyboard });
}
```

---

## 2. Character Counting & Language Detection (D5)

### Algorithm

```typescript
function detectLanguage(text: string): 'ar' | 'en' {
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;
    // Skip emoji, whitespace, punctuation
    if (isEmojiOrNonAlpha(code)) continue;
    // Check Arabic Unicode ranges
    if (isArabicCodePoint(code)) return 'ar';
    return 'en';
  }
  // Default to English (more permissive limits) for emoji-only labels
  return 'en';
}
```

### Arabic Unicode Ranges

- Basic Arabic: U+0600 to U+06FF
- Arabic Supplement: U+0750 to U+077F
- Arabic Extended-A: U+08A0 to U+08FF

### Character Counting

Use `string.length` (UTF-16 code units), not byte count. The Constitution limits are defined in "characters" (Arabic/English), which maps to visual characters. For most Arabic/English text, `string.length` is accurate. Emoji (which are typically at the start) are not counted toward the character limit — they are stripped before length check.

### Validation Flow

1. Strip leading emoji from label
2. Detect language from first remaining character
3. Get char limit for detected language + keyboard type
4. Compare stripped length to limit
5. Return `ok()` or `err(new AppError('ux.label.too_long', { ... }))`

---

## 3. Callback Data Encoding (D3)

### Format

```
prefix:param1:param2:...:expiryTimestamp
```

- **Separator**: `:` (single colon)
- **Expiry**: Unix timestamp in seconds (10 digits)
- **Byte validation**: `new TextEncoder().encode(data).length <= 64`

### Encode/Decode API

```typescript
// Encode without expiry
encodeCallbackData(['invoice', 'delete', '42']);
// → ok('invoice:delete:42') — 18 bytes

// Encode with expiry (adds timestamp as last segment)
encodeWithExpiry(['invoice', 'delete', '42'], 5);
// → ok('invoice:delete:42:1711450800') — 29 bytes

// Decode
decodeCallbackData('invoice:delete:42');
// → ok(['invoice', 'delete', '42'])

// Decode with expiry
decodeWithExpiry('invoice:delete:42:1711450800');
// → ok({ parts: ['invoice', 'delete', '42'], expiresAt: 1711450800 })
```

### Error Handling

- Exceeds 64 bytes → `err(new AppError('ux.callback.too_long'))`
- Empty string → `err(new AppError('ux.callback.empty'))`
- Malformed on decode → `err(new AppError('ux.callback.decode_failed'))`

---

## 4. Golden Rule Fallback Strategy (FR-013)

### Error Classification

```typescript
function isNotModifiedError(error: unknown): boolean {
  return isGrammyError(error) && error.description.includes('message is not modified');
}

function isMessageNotFoundError(error: unknown): boolean {
  return (
    isGrammyError(error) &&
    (error.description.includes('message to edit not found') ||
      error.description.includes("message can't be edited"))
  );
}
```

### Behavior Matrix

| Error                       | Action                         | Return                   |
| --------------------------- | ------------------------------ | ------------------------ |
| No error                    | Message edited successfully    | `ok(undefined)`          |
| "message is not modified"   | No-op (content unchanged)      | `ok(undefined)`          |
| "message to edit not found" | Send new message + log warning | `ok(undefined)`          |
| "message can't be edited"   | Send new message + log warning | `ok(undefined)`          |
| Other Telegram error        | Log error                      | `err(new AppError(...))` |
| No callback query / message | Use ctx.reply as fallback      | `ok(undefined)`          |

### Logger Integration

```typescript
import { logger } from '@tempot/logger';

// On fallback to new message:
logger.warn({
  msg: 'Golden Rule fallback: editMessageText failed, sending new message',
  chatId: ctx.chat?.id,
  error: errorDescription,
});
```

---

## 5. Mock Context Factory (FR-016)

### Pattern: Factory Function with Options Object

Chosen over builder pattern for consistency with existing project patterns (e.g., `createMockProvider()` in storage-engine).

```typescript
function createMockContext(options?: MockContextOptions): MockContext {
  const chatId = options?.chatId ?? 123;
  const messageId = options?.messageId ?? 1;

  const calls: MockContextCalls = {
    editMessageText: [],
    reply: [],
    answerCallbackQuery: [],
    replyWithChatAction: [],
  };

  return {
    chat: { id: chatId, type: 'private' },
    message: { message_id: messageId },
    callbackQuery: options?.callbackData ? { data: options.callbackData } : undefined,
    from: { id: options?.userId ?? 456 },

    editMessageText: vi.fn((...args) => {
      calls.editMessageText.push(args);
      return Promise.resolve(true);
    }),
    reply: vi.fn((...args) => {
      calls.reply.push(args);
      return Promise.resolve({ message_id: messageId + 1 });
    }),
    answerCallbackQuery: vi.fn((...args) => {
      calls.answerCallbackQuery.push(args);
      return Promise.resolve(true);
    }),
    replyWithChatAction: vi.fn((...args) => {
      calls.replyWithChatAction.push(args);
      return Promise.resolve(true);
    }),

    calls,
  } as MockContext;
}
```

### Note on vi.fn()

The mock context factory uses `vi.fn()` from Vitest. This is acceptable because it's in the `testing/` subpath and only used in test files. It does NOT use vitest as a runtime dependency — it's a type-compatible mock that downstream tests use.

**Important**: The `mock.context.ts` file will NOT import from vitest directly. Instead, it will create plain function mocks with call tracking. Downstream test files import vitest themselves. This avoids making vitest a runtime dependency.

Revised approach:

```typescript
function createTrackedFn() {
  const calls: unknown[][] = [];
  const fn = (...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve(true);
  };
  fn.calls = calls;
  fn.reset = () => {
    calls.length = 0;
  };
  return fn;
}
```

---

## 6. Typing Indicator + Feedback Handler Integration

### Default Behavior

Feedback handler does NOT auto-show typing by default. Typing indicator is a separate helper that the developer calls explicitly when needed.

### Rationale

- Not all feedback flows need typing (e.g., instant DB lookups)
- Typing indicator has a 5-second duration in Telegram — may expire before action completes
- Keeps feedback handler focused on its core flow (loading → action → result)
- Developer has explicit control over when typing is shown

### Usage Pattern

```typescript
// Explicit typing before feedback
await showTyping(ctx);
await executeFeedback(ctx, {
  loadingKey: 'invoice.processing',
  action: () => processInvoice(id),
  successKey: 'invoice.processed',
});
```

---

## 7. Required i18n Keys

### Approach

The package defines a **type-level contract** listing expected i18n keys. Actual locale files are NOT created in ux-helpers — they belong to the consuming application.

### Required Keys

```typescript
// Keys that ux-helpers functions reference via t()
const REQUIRED_I18N_KEYS = [
  // Status messages
  'common.status.loading',

  // Buttons
  'common.buttons.cancel',

  // Errors
  'common.errors.system',
  'common.errors.permission',
  'common.errors.session_expired',
  'common.errors.session_expired_restart',

  // Confirmation
  'common.confirmation.expired',
  'common.confirmation.irreversible_warning',

  // Lists
  'common.lists.empty',
] as const;
```

### Validation

The package does NOT validate key existence at runtime. Keys that are missing will return the key string itself (i18next default behavior). The `cms:check` pipeline validates completeness at CI time.

---

## 8. grammY Wrapping Strategy

### Inline Keyboard

```typescript
function createInlineKeyboard(): TempotInlineKeyboard {
  const keyboard = new InlineKeyboard(); // grammY native
  const buttons: InlineButtonConfig[] = [];
  let currentRowLength = 0;

  return {
    button(config) {
      const validation = validateLabel(config.label, 'inline');
      if (validation.isErr()) return err(validation.error);

      const cbValidation = encodeCallbackData([config.callbackData]);
      if (cbValidation.isErr()) return err(cbValidation.error);

      // Auto-row logic
      const lang = detectLanguage(config.label);
      const limit = getCharLimit('inline', lang);
      const isLong = stripEmoji(config.label).length > limit / 2;

      if (isLong && currentRowLength > 0) {
        keyboard.row();
        currentRowLength = 0;
      }
      if (currentRowLength >= ROW_LIMITS.inline) {
        keyboard.row();
        currentRowLength = 0;
      }

      keyboard.text(config.label, config.callbackData);
      currentRowLength++;

      if (isLong) {
        keyboard.row();
        currentRowLength = 0;
      }

      return ok(this);
    },
    row() {
      keyboard.row();
      currentRowLength = 0;
      return this;
    },
    build() {
      return ok(keyboard);
    },
    toGrammyKeyboard() {
      return keyboard;
    },
  };
}
```

### Key Point

We do NOT create a new InlineKeyboard subclass. We create a wrapper object that delegates to a grammY InlineKeyboard instance internally. This avoids inheritance issues and keeps the wrapper lightweight.

---

## 9. RTL Confirmation Button Ordering (D4)

### Implementation

```typescript
function createConfirmation(options: ConfirmationOptions): Result<ConfirmationResult, AppError> {
  const keyboard = new InlineKeyboard();

  // Cancel button FIRST (renders on LEFT in RTL)
  const cancelText = t(options.cancelKey ?? 'common.buttons.cancel');
  const cancelData = `${options.callbackPrefix}:cancel`;

  // Confirm button SECOND (renders on RIGHT in RTL)
  const actionText = t(options.actionNameKey);
  const confirmResult = encodeWithExpiry(
    [options.callbackPrefix, 'confirm'],
    CONFIRMATION_EXPIRY_MINUTES,
  );
  if (confirmResult.isErr()) return err(confirmResult.error);

  keyboard.text(cancelText, cancelData);
  keyboard.text(actionText, confirmResult.value);

  // ...
}
```

### Verification

In Telegram's RTL rendering, the first button in the array appears on the right visually. Wait — actually, Telegram renders buttons in the order they appear in the array, left-to-right, regardless of RTL. The RTL setting affects text direction within messages but NOT button order.

**Correction to D4:** For RTL users, to have Confirm on the right:

- Place Cancel first (appears left), then Confirm second (appears right)
- This is the same as the current D4 decision, but the reasoning is: Telegram always renders buttons left-to-right in array order, so Cancel=left, Confirm=right works for both LTR and RTL.

---

## 10. File Size Management

### Strategy

Each component is a single file. With the 200-line limit (Rule II), complex components may need splitting:

- `inline.builder.ts` — likely 80-120 lines (builder + auto-row logic)
- `golden-rule.fallback.ts` — likely 40-60 lines (try/catch + error classification)
- `feedback.handler.ts` — likely 40-50 lines (orchestration)

No file is expected to exceed 200 lines. If any does during implementation, split into helper + main.

---

## 11. Error Handling Philosophy

### Pure Functions

- Return `Result<T, AppError>` for operations that can fail (validation, encoding)
- Return plain values for operations that cannot fail (formatting with valid inputs)
- Status Formatter returns `string` directly (cannot fail — i18n returns key as fallback)

### Ctx-Aware Functions

- Always return `AsyncResult<void, AppError>`
- Wrap all Telegram API calls in try/catch
- Log warnings for recoverable failures (Golden Rule Fallback)
- Return `err()` only for truly unrecoverable failures (no chat context)

---

## 12. Testing Strategy

### Pure Components (Tasks 2-5, 8-9)

- Direct function calls with expected outputs
- No mocking needed (except `t()` from i18n-core which returns the key)
- Edge case coverage: empty inputs, boundary values, overflow

### Ctx-Aware Components (Tasks 12-14)

- Use `createMockContext()` from testing subpath
- Mock `t()` to return key as-is (or predictable format)
- Verify method calls on mock context (editMessageText, reply, etc.)
- Test error paths by making mock methods throw

### Mock Context (Task 15)

- Self-testing: verify the mock itself works correctly
- Assert call tracking, reset functionality

### i18n Mocking Pattern

```typescript
vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));
```

This makes assertions predictable: `expect(result).toContain('common.status.loading')`.
