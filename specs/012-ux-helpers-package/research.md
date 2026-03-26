# @tempot/ux-helpers — Research

> Findings on grammY ecosystem, Telegram Bot API constraints, and implementation patterns.

---

## grammY Keyboard Classes

### InlineKeyboard

- **Import:** `import { InlineKeyboard } from 'grammy';`
- **API:** Chainable builder pattern
  - `.text(label, callbackData)` — adds a text button with callback data
  - `.url(label, url)` — adds a URL button
  - `.row()` — starts a new row
  - `.toFlowed(columns)` — auto-flows buttons into N columns (but doesn't enforce char limits)
- **Output:** `InlineKeyboard` instance (serializable via `.toJSON()` or passed directly to `ctx.reply()`)
- **Key finding:** grammY does NOT enforce character limits or row limits. It's purely a builder. Our wrapper must add enforcement.

### Keyboard (Reply Keyboard)

- **Import:** `import { Keyboard } from 'grammy';`
- **API:** Chainable builder pattern
  - `.text(label)` — adds a text button
  - `.row()` — starts a new row
  - `.oneTime(value?)` — keyboard disappears after use
  - `.resized(value?)` — keyboard resizes to fit content
  - `.placeholder(text)` — sets input placeholder
  - `.persistent(value?)` — keeps keyboard visible
  - `.selective(value?)` — only shows to specific users
- **Output:** `Keyboard` instance
- **Key finding:** Same as InlineKeyboard — no enforcement. Our wrapper adds reply-specific limits.

### Context Methods

- `ctx.editMessageText(text, other?)` — edits existing message text (Golden Rule)
- `ctx.reply(text, other?)` — sends new message (fallback only)
- `ctx.answerCallbackQuery(text?)` — removes loading indicator on button
- `ctx.replyWithChatAction('typing')` — shows "typing..." indicator
- `ctx.api.raw.editMessageText(params)` — raw API call (for error handling)

---

## Telegram Bot API Constraints

### Callback Data

- **Maximum:** 64 bytes (NOT characters — UTF-8 encoded)
- **Content:** Arbitrary string data, typically used for action identification
- **Encoding:** Must be valid UTF-8
- **Persistence:** Telegram stores callback data server-side; accessible via callback_query updates

### Message Limits

- **Text length:** Maximum 4096 characters for regular messages
- **Caption length:** Maximum 1024 characters for media captions
- **Parse modes:** HTML, MarkdownV2, Markdown (legacy)

### Inline Keyboard Constraints (Telegram API)

- No explicit character limit per button (our limits are UX-driven per Constitution)
- No explicit row limit (our limits are UX-driven per Constitution)
- Buttons support: text+callback, URL, web app, login, switch inline, pay, game

### Reply Keyboard Constraints

- Buttons are only text (no callback data)
- Keyboard can be one-time (disappears after press)
- Can be resized to fit content
- No native character/row limits (our limits are UX-driven)

### editMessageText Behavior

- **Error "message is not modified"**: Thrown when new text is identical to existing. Status code 400, error code: `Bad Request: message is not modified`.
- **Error "message to edit not found"**: Thrown when message was deleted. Status code 400.
- **Error "message can't be edited"**: Thrown when message is too old or not from the bot. Status code 400.
- **Rate limits:** Telegram enforces rate limits on edit operations (~30 messages/second globally).

### answerCallbackQuery Behavior

- Must be called within ~30 seconds of the callback query
- If not called, button shows loading indicator indefinitely
- Optional `text` parameter shows toast notification
- Optional `show_alert` parameter shows modal alert instead of toast

---

## RTL Considerations

### Button Ordering

- Telegram renders inline keyboard buttons left-to-right in the data structure
- In RTL mode (Arabic), the visual ordering appears mirrored
- To get Confirm on the right in RTL: place Cancel first, then Confirm in the data array
- This means in code: `[Cancel, Confirm]` renders visually as `[Confirm | Cancel]` in RTL

### Text Direction

- Telegram auto-detects text direction based on first strong directional character
- Mixed content (Arabic + English) may cause visual issues
- Unicode directional markers (RLM: U+200F, LRM: U+200E) can help stabilize mixed content

---

## First-Character Language Detection (Decision D5)

### Algorithm

1. Get the first non-whitespace, non-emoji character of the button label
2. Check if its Unicode code point falls within Arabic ranges:
   - Arabic block: U+0600 to U+06FF
   - Arabic Supplement: U+0750 to U+077F
   - Arabic Extended-A: U+08A0 to U+08FF
3. If Arabic: apply Arabic limits (20/15 chars)
4. Otherwise: apply English limits (24/18 chars)

### Edge Cases

- **Emoji-only labels:** No language character found → use English limits (more permissive)
- **Numeric-only labels:** Use English limits
- **Mixed Arabic/English:** First non-emoji character determines the limit

---

## Callback Data Encoding Strategy (Decision D3)

### Format

```
prefix:param1:param2:...:expiryTimestamp
```

### Expiry Encoding

- Unix timestamp in seconds (10 digits, compact)
- Placed as the last segment after the separator
- On decode: extract last segment, parse as number, compare to `Date.now() / 1000`

### Byte Counting

- Use `new TextEncoder().encode(data).length` for accurate UTF-8 byte count
- Arabic characters are 2 bytes each in UTF-8
- Emoji can be 3-4 bytes each
- ASCII characters are 1 byte each

### Example

```
inv:del:42:1711450800
```

This is 22 bytes — well within the 64-byte limit.

---

## Existing Patterns in Tempot

### AppError Usage

```typescript
import { AppError } from '@tempot/shared';
new AppError('ux.label.too_long', { label, maxChars, actualChars });
```

Auto-generates `i18nKey` as `errors.ux.label.too_long`.

### Result Pattern

```typescript
import { Result, AsyncResult } from '@tempot/shared';
import { ok, err } from 'neverthrow';

// Synchronous
function validate(label: string): Result<void, AppError> {
  if (label.length > MAX) return err(new AppError('ux.label.too_long'));
  return ok(undefined);
}

// Asynchronous
async function edit(ctx: Context): AsyncResult<void, AppError> {
  try {
    await ctx.editMessageText(text);
    return ok(undefined);
  } catch (error) {
    return err(new AppError('ux.message.edit_failed', { error }));
  }
}
```

### i18n Usage

```typescript
import { t } from '@tempot/i18n-core';
const text = t('common.status.loading'); // Returns translated string
const text2 = t('invoice.created', { count: 5 }); // With interpolation
```

### Logger Usage

```typescript
import { logger } from '@tempot/logger';
logger.warn({ msg: 'editMessageText failed, using fallback', error });
```

---

## Dependencies Analysis

| Dependency        | Purpose                                         | Justified?                                    |
| ----------------- | ----------------------------------------------- | --------------------------------------------- |
| grammy            | InlineKeyboard, Keyboard classes + Context type | YES — core wrapping target                    |
| neverthrow        | Result/AsyncResult pattern                      | YES — required by Constitution Rule XXI       |
| @tempot/shared    | AppError, Result, AsyncResult types             | YES — project standard                        |
| @tempot/i18n-core | t() function for all text                       | YES — required by Constitution Rule XXXIX     |
| @tempot/logger    | Warning/error logging                           | YES — needed for Golden Rule Fallback logging |

No additional dependencies needed. The package is intentionally lightweight.
