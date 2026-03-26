# @tempot/ux-helpers — Data Model

> All types and interfaces used across the package. Defined in `src/types.ts`.

---

## Core Types

### Status Types

```typescript
/** The four standardized status types per Rule LXV */
type StatusType = 'loading' | 'success' | 'error' | 'warning';

/** Options for formatting a status message */
interface StatusFormatOptions {
  /** i18n key for the status message text */
  readonly key: string;
  /** Interpolation values for the i18n key */
  readonly interpolation?: Record<string, unknown>;
}

/** Options for sending a status message (context-aware) */
interface StatusSendOptions extends StatusFormatOptions {
  /** Optional keyboard to attach to the message */
  readonly keyboard?: InlineKeyboard;
}
```

### Error Types

```typescript
/** The four error types per Rule LXIX */
type ErrorType = 'user' | 'system' | 'permission' | 'session_expired';

/** Options for formatting a user error (problem + solution) */
interface UserErrorOptions {
  /** i18n key for the problem description */
  readonly problemKey: string;
  /** i18n key for the solution description */
  readonly solutionKey: string;
  /** Interpolation values */
  readonly interpolation?: Record<string, unknown>;
}

/** Options for formatting a system error (generic message + reference code) */
interface SystemErrorOptions {
  /** Unique reference code linking to Audit Log (format: ERR-YYYYMMDD-XXXX) */
  readonly referenceCode: string;
}

/** Options for formatting a permission error (denial reason only) */
interface PermissionErrorOptions {
  /** i18n key for the denial reason */
  readonly reasonKey: string;
}

/** Options for formatting a session expired message */
interface SessionExpiredOptions {
  /** Callback data for the restart button */
  readonly restartCallbackData: string;
}

/** Result of formatting a session expired message (includes button config) */
interface SessionExpiredResult {
  /** The formatted notification text */
  readonly text: string;
  /** The restart button configuration */
  readonly restartButton: InlineButtonConfig;
}
```

### Button Types

```typescript
/** Keyboard type discriminant */
type KeyboardType = 'inline' | 'reply';

/** Detected language for character limit selection */
type DetectedLanguage = 'ar' | 'en';

/** Configuration for an inline keyboard button */
interface InlineButtonConfig {
  /** Button display text (must start with emoji) */
  readonly label: string;
  /** Callback data (max 64 bytes) */
  readonly callbackData: string;
}

/** Character limits per keyboard type and language */
interface CharacterLimits {
  readonly inline: { readonly ar: 20; readonly en: 24 };
  readonly reply: { readonly ar: 15; readonly en: 18 };
}

/** Row limits per keyboard type */
interface RowLimits {
  readonly inline: 3;
  readonly reply: 2;
}
```

### Confirmation Types

```typescript
/** Options for creating a confirmation dialog */
interface ConfirmationOptions {
  /** i18n key for the action name (shown on confirm button) */
  readonly actionNameKey: string;
  /** i18n key for the cancel button text (default: common.buttons.cancel) */
  readonly cancelKey?: string;
  /** Prefix for callback data (e.g., 'invoice.delete') */
  readonly callbackPrefix: string;
  /** Whether the action is irreversible (shows warning) */
  readonly isIrreversible?: boolean;
}

/** Result of creating a confirmation dialog */
interface ConfirmationResult {
  /** The inline keyboard with confirm/cancel buttons */
  readonly keyboard: InlineKeyboard;
  /** Warning text for irreversible actions (undefined if not irreversible) */
  readonly warningText?: string;
}
```

### List Types

```typescript
/** Options for formatting a list */
interface ListFormatOptions<T> {
  /** i18n key for the list title */
  readonly titleKey: string;
  /** The items to display */
  readonly items: readonly T[];
  /** Function to render each item to a string */
  readonly renderItem: (item: T, index: number) => string;
  /** i18n key for empty state message */
  readonly emptyStateKey?: string;
  /** Button config for the empty state next-step action */
  readonly emptyActionConfig?: InlineButtonConfig;
}

/** Result of formatting a list */
interface ListFormatResult {
  /** The formatted text (title + items or empty state) */
  readonly text: string;
  /** Button config for empty state (present only when list is empty) */
  readonly emptyActionButton?: InlineButtonConfig;
}

/** Options for creating pagination buttons */
interface PaginationOptions {
  /** Current page number (1-indexed) */
  readonly currentPage: number;
  /** Total number of pages */
  readonly totalPages: number;
  /** Callback data prefix for page buttons */
  readonly callbackPrefix: string;
}
```

### Feedback Types

```typescript
/** Options for the feedback handler convenience flow */
interface FeedbackOptions<T> {
  /** i18n key for the loading message */
  readonly loadingKey: string;
  /** The async action to execute */
  readonly action: () => AsyncResult<T, AppError>;
  /** i18n key for the success message */
  readonly successKey: string;
  /** Optional keyboard to show after success */
  readonly keyboard?: InlineKeyboard;
}
```

### Callback Data Types

```typescript
/** Separator used between callback data parts */
type CallbackSeparator = ':';

/** Maximum byte length for Telegram callback data */
type MaxCallbackBytes = 64;

/** Result of decoding callback data with expiry */
interface DecodedCallbackWithExpiry {
  /** The decoded data parts (excluding expiry) */
  readonly parts: readonly string[];
  /** Unix timestamp when the callback expires */
  readonly expiresAt: number;
}
```

### Message Composer Types

```typescript
/** Builder interface for composing messages */
interface ComposerBuilder {
  /** Add a paragraph with i18n key */
  paragraph(key: string, interpolation?: Record<string, unknown>): ComposerBuilder;
  /** Add a bullet list with emoji bullets */
  bulletList(items: readonly string[]): ComposerBuilder;
  /** Add a visual separator */
  separator(): ComposerBuilder;
  /** Build the composed message, validating 4096-char limit */
  build(): Result<string, AppError>;
}
```

### Golden Rule Fallback Types

```typescript
/** Options for editing or sending a message */
interface EditOrSendOptions {
  /** The message text to display */
  readonly text: string;
  /** Parse mode for the message */
  readonly parseMode?: 'HTML' | 'MarkdownV2';
  /** Optional keyboard to attach */
  readonly replyMarkup?: InlineKeyboard;
}
```

### Answer Callback Query Types

```typescript
/** Options for answering a callback query */
interface AnswerCallbackOptions {
  /** Toast notification text */
  readonly text?: string;
  /** Whether to show as alert (modal) instead of toast */
  readonly showAlert?: boolean;
}
```

### Mock Context Types (Testing)

```typescript
/** Options for creating a mock grammY Context */
interface MockContextOptions {
  /** Chat ID for the mock context */
  readonly chatId?: number;
  /** Message ID for the mock context */
  readonly messageId?: number;
  /** Callback data for the mock context */
  readonly callbackData?: string;
  /** User ID for the mock context */
  readonly userId?: number;
}

/** Tracked method calls on the mock context */
interface MockContextCalls {
  readonly editMessageText: unknown[][];
  readonly reply: unknown[][];
  readonly answerCallbackQuery: unknown[][];
  readonly replyWithChatAction: unknown[][];
}
```

---

## Constants

```typescript
/** Status emoji mapping per Rule LXV */
const STATUS_EMOJIS: Record<StatusType, string> = {
  loading: '\u23F3', // ⏳
  success: '\u2705', // ✅
  error: '\u274C', // ❌
  warning: '\u26A0\uFE0F', // ⚠️
};

/** Character limits per Section 13.1 */
const CHAR_LIMITS: CharacterLimits = {
  inline: { ar: 20, en: 24 },
  reply: { ar: 15, en: 18 },
};

/** Row limits per Section 13.1 */
const ROW_LIMITS: RowLimits = {
  inline: 3,
  reply: 2,
};

/** Confirmation expiry duration in minutes per Rule LXVII */
const CONFIRMATION_EXPIRY_MINUTES = 5;

/** Callback data separator */
const CALLBACK_SEPARATOR: CallbackSeparator = ':';

/** Maximum callback data bytes (Telegram limit) */
const MAX_CALLBACK_BYTES: MaxCallbackBytes = 64;

/** Maximum Telegram message length */
const MAX_MESSAGE_LENGTH = 4096;

/** Pagination threshold per Section 13.7 */
const PAGINATION_THRESHOLD = 5;

/** Emoji numbers for list items per Rule LXVIII */
const EMOJI_NUMBERS: readonly string[] = [
  '1\uFE0F\u20E3',
  '2\uFE0F\u20E3',
  '3\uFE0F\u20E3',
  '4\uFE0F\u20E3',
  '5\uFE0F\u20E3',
  '6\uFE0F\u20E3',
  '7\uFE0F\u20E3',
  '8\uFE0F\u20E3',
  '9\uFE0F\u20E3',
  '\uD83D\uDD1F',
];

/** Unicode range for Arabic characters */
const ARABIC_CHAR_RANGE_START = 0x0600;
const ARABIC_CHAR_RANGE_END = 0x06ff;

/** Emoji bullet for list items per Section 13.2 */
const EMOJI_BULLET = '\u2022'; // Will use emoji-style bullets in formatting
```

---

## Error Codes

```typescript
const UX_ERRORS = {
  // Label validation
  LABEL_EMPTY: 'ux.label.empty',
  LABEL_TOO_LONG: 'ux.label.too_long',
  LABEL_NO_EMOJI: 'ux.label.no_emoji',

  // Callback data
  CALLBACK_TOO_LONG: 'ux.callback.too_long',
  CALLBACK_EMPTY: 'ux.callback.empty',
  CALLBACK_DECODE_FAILED: 'ux.callback.decode_failed',

  // Confirmation
  CONFIRMATION_EXPIRED: 'ux.confirmation.expired',

  // Message
  MESSAGE_TOO_LONG: 'ux.message.too_long',
  MESSAGE_EDIT_FAILED: 'ux.message.edit_failed',
  MESSAGE_SEND_FAILED: 'ux.message.send_failed',

  // Context
  CONTEXT_NO_MESSAGE: 'ux.context.no_message',
  CONTEXT_NO_CHAT: 'ux.context.no_chat',
  CALLBACK_QUERY_FAILED: 'ux.callback_query.failed',

  // Typing
  TYPING_FAILED: 'ux.typing.failed',
} as const;
```
