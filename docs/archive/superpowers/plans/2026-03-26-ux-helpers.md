# @tempot/ux-helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the centralized UX component library enforcing Constitution Rules LXIV–LXIX and Architecture Spec Section 13, providing 15 components (9 core + 6 helpers) with a dual API: pure formatting functions and context-aware senders.

**Architecture:** Dual-layer design — pure functions return formatted strings/objects (synchronous, testable), context-aware wrappers take grammY `ctx` and enforce the Golden Rule (edit existing messages). All keyboard builders wrap grammY's native `InlineKeyboard`/`Keyboard` classes. All public APIs return `Result<T, AppError>` or `AsyncResult<T, AppError>` via neverthrow.

**Tech Stack:** TypeScript 5.9.3 (strict mode), grammY ^1.0.0, neverthrow 8.2.0, @tempot/shared workspace:\*, @tempot/i18n-core workspace:\*, @tempot/logger workspace:\*, Vitest 4.1.0

---

## Conventions (Reference: `packages/storage-engine/`)

- **ESM:** All imports use `.js` extensions. `"type": "module"` in package.json.
- **Result pattern:** All public methods return `Result<T, AppError>` or `AsyncResult<T, AppError>`.
- **Error codes:** Hierarchical dot notation in `UX_ERRORS` constant, e.g. `'ux.label.too_long'`.
- **AppError:** Constructor is `new AppError('code', details?)` — auto-derives `i18nKey` as `errors.${code}`.
- **Barrel exports:** `export type { ... }` for types, named exports for values/functions, `.js` extensions.
- **i18n:** `t(key, interpolation?)` from `@tempot/i18n-core`. Returns string synchronously. Reads language from session context.
- **Logger:** `logger` from `@tempot/logger` is a Pino singleton. Use `logger.warn({ msg, ... })` pattern.
- **No `any`, no `console.*`, no `@ts-ignore`, no `eslint-disable`.**
- **Rule II:** Max 200 lines/file, 50 lines/function, 3 params/function.
- **TDD:** RED → GREEN → REFACTOR. Every step writes the failing test first.

## File Structure

```
packages/ux-helpers/
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md                             # (existing, update at end)
├── src/
│   ├── index.ts                          # Barrel exports (populated incrementally)
│   ├── types.ts                          # All interfaces/types from data-model.md
│   ├── errors.ts                         # UX_ERRORS constant
│   ├── constants.ts                      # STATUS_EMOJIS, CHAR_LIMITS, etc.
│   ├── messages/
│   │   ├── status.formatter.ts           # Pure: 4 status types → string
│   │   ├── status.sender.ts              # Ctx-aware: edits via Golden Rule
│   │   ├── error.formatter.ts            # Pure: 4 error types per Rule LXIX
│   │   └── message.composer.ts           # Section 13.2 text rules
│   ├── keyboards/
│   │   ├── label.validator.ts            # Char counting, language detection
│   │   ├── inline.builder.ts             # Wraps grammY InlineKeyboard
│   │   ├── reply.builder.ts              # Wraps grammY Keyboard
│   │   └── confirmation.builder.ts       # 5-min expiry, RTL order
│   ├── lists/
│   │   ├── emoji-number.ts               # 1️⃣ 2️⃣ mapping utility
│   │   ├── list.formatter.ts             # Title+count, emoji numbers, empty state
│   │   └── pagination.builder.ts         # Prev/next buttons
│   ├── feedback/
│   │   └── feedback.handler.ts           # Loading→action→result flow
│   ├── callback-data/
│   │   └── callback-data.encoder.ts      # Type-safe encode/decode, 64-byte limit
│   ├── middleware/
│   │   └── expiry.checker.ts             # Confirmation expiry check
│   ├── helpers/
│   │   ├── golden-rule.fallback.ts       # editMessageText fallback
│   │   ├── answer-callback.ts            # Auto answerCallbackQuery
│   │   └── typing.indicator.ts           # Chat action typing
│   └── testing/
│       └── mock.context.ts               # Mock grammY Context factory
└── tests/unit/
    ├── label.validator.test.ts
    ├── callback-data.encoder.test.ts
    ├── status.formatter.test.ts
    ├── message.composer.test.ts
    ├── error.formatter.test.ts
    ├── inline.builder.test.ts
    ├── reply.builder.test.ts
    ├── emoji-number.test.ts
    ├── list.formatter.test.ts
    ├── pagination.builder.test.ts
    ├── confirmation.builder.test.ts
    ├── expiry.checker.test.ts
    ├── golden-rule.fallback.test.ts
    ├── answer-callback.test.ts
    ├── typing.indicator.test.ts
    ├── status.sender.test.ts
    ├── feedback.handler.test.ts
    └── mock.context.test.ts
```

---

## Task 1: Infrastructure Setup

**Files:**
- Create: `packages/ux-helpers/.gitignore`
- Create: `packages/ux-helpers/package.json`
- Create: `packages/ux-helpers/tsconfig.json`
- Create: `packages/ux-helpers/vitest.config.ts`
- Create: `packages/ux-helpers/src/index.ts`
- Create: `packages/ux-helpers/src/types.ts`
- Create: `packages/ux-helpers/src/errors.ts`
- Create: `packages/ux-helpers/src/constants.ts`

**Reference:** `packages/storage-engine/package.json`, `packages/storage-engine/tsconfig.json`, `packages/storage-engine/vitest.config.ts`, `packages/storage-engine/.gitignore`, `docs/developer/package-creation-checklist.md`

- [ ] **Step 1: Create `.gitignore`**

```
dist/
node_modules/
*.tsbuildinfo
src/**/*.js
src/**/*.js.map
src/**/*.d.ts
src/**/*.d.ts.map
tests/**/*.js
tests/**/*.d.ts
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "@tempot/ux-helpers",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./testing": "./dist/testing/mock.context.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "grammy": "^1.0.0",
    "neverthrow": "8.2.0",
    "@tempot/shared": "workspace:*",
    "@tempot/i18n-core": "workspace:*",
    "@tempot/logger": "workspace:*"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      }),
    ],
  },
});
```

- [ ] **Step 5: Create `src/errors.ts`**

```typescript
/** Hierarchical error codes for UX module (Rule XXII) */
export const UX_ERRORS = {
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

- [ ] **Step 6: Create `src/constants.ts`**

```typescript
import type { StatusType, CharacterLimits, RowLimits, CallbackSeparator } from './types.js';

/** Status emoji mapping per Rule LXV */
export const STATUS_EMOJIS: Record<StatusType, string> = {
  loading: '\u23F3',
  success: '\u2705',
  error: '\u274C',
  warning: '\u26A0\uFE0F',
};

/** Character limits per Section 13.1 */
export const CHAR_LIMITS: CharacterLimits = {
  inline: { ar: 20, en: 24 },
  reply: { ar: 15, en: 18 },
};

/** Row limits per Section 13.1 */
export const ROW_LIMITS: RowLimits = {
  inline: 3,
  reply: 2,
};

/** Confirmation expiry duration in minutes per Rule LXVII */
export const CONFIRMATION_EXPIRY_MINUTES = 5;

/** Callback data separator */
export const CALLBACK_SEPARATOR: CallbackSeparator = ':';

/** Maximum callback data bytes (Telegram limit) */
export const MAX_CALLBACK_BYTES = 64;

/** Maximum Telegram message length */
export const MAX_MESSAGE_LENGTH = 4096;

/** Pagination threshold per Section 13.7 */
export const PAGINATION_THRESHOLD = 5;

/** Emoji numbers for list items per Rule LXVIII */
export const EMOJI_NUMBERS: readonly string[] = [
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
export const ARABIC_CHAR_RANGE_START = 0x0600;
export const ARABIC_CHAR_RANGE_END = 0x06FF;

/** Arabic Supplement range */
export const ARABIC_SUPPLEMENT_START = 0x0750;
export const ARABIC_SUPPLEMENT_END = 0x077F;

/** Arabic Extended-A range */
export const ARABIC_EXTENDED_A_START = 0x08A0;
export const ARABIC_EXTENDED_A_END = 0x08FF;

/** Emoji bullet for list items per Section 13.2 */
export const EMOJI_BULLET = '\u25CF';
```

- [ ] **Step 7: Create `src/types.ts`**

All interfaces/types from data-model.md. Import `InlineKeyboard` type from grammy, `Result`/`AsyncResult`/`AppError` from @tempot/shared.

```typescript
import type { InlineKeyboard } from 'grammy';
import type { Result, AsyncResult, AppError } from '@tempot/shared';

// --- Status Types ---
export type StatusType = 'loading' | 'success' | 'error' | 'warning';

export interface StatusFormatOptions {
  readonly key: string;
  readonly interpolation?: Record<string, unknown>;
}

export interface StatusSendOptions extends StatusFormatOptions {
  readonly keyboard?: InlineKeyboard;
}

// --- Error Types ---
export type ErrorType = 'user' | 'system' | 'permission' | 'session_expired';

export interface UserErrorOptions {
  readonly problemKey: string;
  readonly solutionKey: string;
  readonly interpolation?: Record<string, unknown>;
}

export interface SystemErrorOptions {
  readonly referenceCode: string;
}

export interface PermissionErrorOptions {
  readonly reasonKey: string;
}

export interface SessionExpiredOptions {
  readonly restartCallbackData: string;
}

export interface SessionExpiredResult {
  readonly text: string;
  readonly restartButton: InlineButtonConfig;
}

// --- Button Types ---
export type KeyboardType = 'inline' | 'reply';
export type DetectedLanguage = 'ar' | 'en';

export interface InlineButtonConfig {
  readonly label: string;
  readonly callbackData: string;
}

export interface CharacterLimits {
  readonly inline: { readonly ar: 20; readonly en: 24 };
  readonly reply: { readonly ar: 15; readonly en: 18 };
}

export interface RowLimits {
  readonly inline: 3;
  readonly reply: 2;
}

// --- Confirmation Types ---
export interface ConfirmationOptions {
  readonly actionNameKey: string;
  readonly cancelKey?: string;
  readonly callbackPrefix: string;
  readonly isIrreversible?: boolean;
}

export interface ConfirmationResult {
  readonly keyboard: InlineKeyboard;
  readonly warningText?: string;
}

// --- List Types ---
export interface ListFormatOptions<T> {
  readonly titleKey: string;
  readonly items: readonly T[];
  readonly renderItem: (item: T, index: number) => string;
  readonly emptyStateKey?: string;
  readonly emptyActionConfig?: InlineButtonConfig;
}

export interface ListFormatResult {
  readonly text: string;
  readonly emptyActionButton?: InlineButtonConfig;
}

export interface PaginationOptions {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly callbackPrefix: string;
}

// --- Feedback Types ---
export interface FeedbackOptions<T> {
  readonly loadingKey: string;
  readonly action: () => AsyncResult<T, AppError>;
  readonly successKey: string;
  readonly keyboard?: InlineKeyboard;
}

// --- Callback Data Types ---
export type CallbackSeparator = ':';

export interface DecodedCallbackWithExpiry {
  readonly parts: readonly string[];
  readonly expiresAt: number;
}

// --- Message Composer Types ---
export interface ComposerBuilder {
  paragraph(key: string, interpolation?: Record<string, unknown>): ComposerBuilder;
  bulletList(items: readonly string[]): ComposerBuilder;
  separator(): ComposerBuilder;
  build(): Result<string, AppError>;
}

// --- Golden Rule Fallback Types ---
export interface EditOrSendOptions {
  readonly text: string;
  readonly parseMode?: 'HTML' | 'MarkdownV2';
  readonly replyMarkup?: InlineKeyboard;
}

// --- Answer Callback Query Types ---
export interface AnswerCallbackOptions {
  readonly text?: string;
  readonly showAlert?: boolean;
}

// --- Mock Context Types (Testing) ---
export interface MockContextOptions {
  readonly chatId?: number;
  readonly messageId?: number;
  readonly callbackData?: string;
  readonly userId?: number;
}

export interface MockContextCalls {
  readonly editMessageText: unknown[][];
  readonly reply: unknown[][];
  readonly answerCallbackQuery: unknown[][];
  readonly replyWithChatAction: unknown[][];
}
```

- [ ] **Step 8: Create `src/index.ts` (initial barrel)**

```typescript
// Types
export type {
  StatusType,
  StatusFormatOptions,
  StatusSendOptions,
  ErrorType,
  UserErrorOptions,
  SystemErrorOptions,
  PermissionErrorOptions,
  SessionExpiredOptions,
  SessionExpiredResult,
  KeyboardType,
  DetectedLanguage,
  InlineButtonConfig,
  CharacterLimits,
  RowLimits,
  ConfirmationOptions,
  ConfirmationResult,
  ListFormatOptions,
  ListFormatResult,
  PaginationOptions,
  FeedbackOptions,
  CallbackSeparator,
  DecodedCallbackWithExpiry,
  ComposerBuilder,
  EditOrSendOptions,
  AnswerCallbackOptions,
  MockContextOptions,
  MockContextCalls,
} from './types.js';

// Errors
export { UX_ERRORS } from './errors.js';

// Constants
export {
  STATUS_EMOJIS,
  CHAR_LIMITS,
  ROW_LIMITS,
  CONFIRMATION_EXPIRY_MINUTES,
  CALLBACK_SEPARATOR,
  MAX_CALLBACK_BYTES,
  MAX_MESSAGE_LENGTH,
  PAGINATION_THRESHOLD,
  EMOJI_NUMBERS,
  EMOJI_BULLET,
} from './constants.js';
```

- [ ] **Step 9: Create directory structure**

```bash
mkdir -p packages/ux-helpers/src/messages
mkdir -p packages/ux-helpers/src/keyboards
mkdir -p packages/ux-helpers/src/lists
mkdir -p packages/ux-helpers/src/feedback
mkdir -p packages/ux-helpers/src/callback-data
mkdir -p packages/ux-helpers/src/middleware
mkdir -p packages/ux-helpers/src/helpers
mkdir -p packages/ux-helpers/src/testing
mkdir -p packages/ux-helpers/tests/unit
```

- [ ] **Step 10: Run `pnpm install` to resolve workspace dependencies**

Run: `pnpm install`
Expected: Clean install resolving workspace:* deps.

- [ ] **Step 11: Verify package builds**

Run: `pnpm build --filter @tempot/ux-helpers`
Expected: Clean compile with zero errors. Output in `dist/`.

- [ ] **Step 12: Run 10-point package-creation checklist**

Verify all 10 points from `docs/developer/package-creation-checklist.md`:
1. `.gitignore` exists with required patterns
2. `tsconfig.json` has `"outDir": "dist"`
3. `package.json` main/types point to `dist/`
4. `package.json` exports field exists
5. `package.json` build script exists
6. `vitest.config.ts` exists
7. `vitest: "4.1.0"` exact version
8. No `console.*` in `src/`
9. No phantom dependencies
10. Clean workspace (no `.js`/`.d.ts` in `src/`)

- [ ] **Step 13: Commit**

```bash
git add packages/ux-helpers/
git commit -m "feat(ux-helpers): scaffold package infrastructure with types, errors, constants"
```

---

## Task 2: Label Validator + Callback Data Encoder

**Files:**
- Create: `packages/ux-helpers/src/keyboards/label.validator.ts`
- Create: `packages/ux-helpers/src/callback-data/callback-data.encoder.ts`
- Create: `packages/ux-helpers/tests/unit/label.validator.test.ts`
- Create: `packages/ux-helpers/tests/unit/callback-data.encoder.test.ts`
- Modify: `packages/ux-helpers/src/index.ts` (add exports)

**Reference:** `specs/012-ux-helpers-package/spec.md` (FR-011, FR-012), `docs/superpowers/specs/2026-03-26-ux-helpers-design.md` (Section 2, Section 3)

### Label Validator

- [ ] **Step 1: Write failing tests for `detectLanguage`**

```typescript
// tests/unit/label.validator.test.ts
import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../../src/keyboards/label.validator.js';

describe('detectLanguage', () => {
  it('should return "ar" for Arabic text', () => {
    expect(detectLanguage('مرحبا')).toBe('ar');
  });

  it('should return "en" for English text', () => {
    expect(detectLanguage('Hello')).toBe('en');
  });

  it('should skip leading emoji and detect language from first alpha char', () => {
    expect(detectLanguage('✅ مرحبا')).toBe('ar');
    expect(detectLanguage('✅ Hello')).toBe('en');
  });

  it('should return "en" for emoji-only text', () => {
    expect(detectLanguage('✅ ⭐')).toBe('en');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `detectLanguage` in `label.validator.ts`**

```typescript
// src/keyboards/label.validator.ts
import {
  ARABIC_CHAR_RANGE_START,
  ARABIC_CHAR_RANGE_END,
  ARABIC_SUPPLEMENT_START,
  ARABIC_SUPPLEMENT_END,
  ARABIC_EXTENDED_A_START,
  ARABIC_EXTENDED_A_END,
} from '../constants.js';
import type { DetectedLanguage } from '../types.js';

function isArabicCodePoint(code: number): boolean {
  return (
    (code >= ARABIC_CHAR_RANGE_START && code <= ARABIC_CHAR_RANGE_END) ||
    (code >= ARABIC_SUPPLEMENT_START && code <= ARABIC_SUPPLEMENT_END) ||
    (code >= ARABIC_EXTENDED_A_START && code <= ARABIC_EXTENDED_A_END)
  );
}

function isAlphabetic(code: number): boolean {
  return (
    (code >= 0x0041 && code <= 0x005A) || // A-Z
    (code >= 0x0061 && code <= 0x007A) || // a-z
    isArabicCodePoint(code)
  );
}

export function detectLanguage(text: string): DetectedLanguage {
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;
    if (!isAlphabetic(code)) continue;
    if (isArabicCodePoint(code)) return 'ar';
    return 'en';
  }
  return 'en';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: PASS for detectLanguage tests.

- [ ] **Step 5: Write failing tests for `validateLabel`**

```typescript
// Add to tests/unit/label.validator.test.ts
import { validateLabel, getCharLimit, getRowLimit } from '../../src/keyboards/label.validator.js';

describe('validateLabel', () => {
  it('should return ok for valid inline Arabic label', () => {
    const result = validateLabel('✅ إنشاء فاتورة', 'inline');
    expect(result.isOk()).toBe(true);
  });

  it('should return err for empty label', () => {
    const result = validateLabel('', 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should return err for Arabic inline label exceeding 20 chars', () => {
    const longArabic = '✅ ' + 'ع'.repeat(21);
    const result = validateLabel(longArabic, 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should return err for English inline label exceeding 24 chars', () => {
    const longEnglish = '✅ ' + 'A'.repeat(25);
    const result = validateLabel(longEnglish, 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should use reply limits for reply keyboard type', () => {
    const replyArabic = '✅ ' + 'ع'.repeat(16); // > 15
    const result = validateLabel(replyArabic, 'reply');
    expect(result.isErr()).toBe(true);
  });

  it('should allow emoji-only labels', () => {
    const result = validateLabel('✅', 'inline');
    expect(result.isOk()).toBe(true);
  });
});

describe('getCharLimit', () => {
  it('should return 20 for inline Arabic', () => {
    expect(getCharLimit('inline', 'ar')).toBe(20);
  });

  it('should return 24 for inline English', () => {
    expect(getCharLimit('inline', 'en')).toBe(24);
  });

  it('should return 15 for reply Arabic', () => {
    expect(getCharLimit('reply', 'ar')).toBe(15);
  });

  it('should return 18 for reply English', () => {
    expect(getCharLimit('reply', 'en')).toBe(18);
  });
});

describe('getRowLimit', () => {
  it('should return 3 for inline', () => {
    expect(getRowLimit('inline')).toBe(3);
  });

  it('should return 2 for reply', () => {
    expect(getRowLimit('reply')).toBe(2);
  });
});
```

- [ ] **Step 6: Implement `validateLabel`, `getCharLimit`, `getRowLimit`**

```typescript
// Add to src/keyboards/label.validator.ts
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { CHAR_LIMITS, ROW_LIMITS } from '../constants.js';
import { UX_ERRORS } from '../errors.js';
import type { KeyboardType, DetectedLanguage } from '../types.js';

export function getCharLimit(type: KeyboardType, language: DetectedLanguage): number {
  return CHAR_LIMITS[type][language];
}

export function getRowLimit(type: KeyboardType): number {
  return ROW_LIMITS[type];
}

function stripLeadingEmoji(text: string): string {
  // Strip emoji and whitespace from the start
  let i = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) break;
    if (isAlphabetic(code)) break;
    i += char.length;
  }
  return text.slice(i).trim();
}

export function validateLabel(label: string, type: KeyboardType): Result<void, AppError> {
  if (label.length === 0) {
    return err(new AppError(UX_ERRORS.LABEL_EMPTY));
  }

  const stripped = stripLeadingEmoji(label);
  if (stripped.length === 0) {
    // Emoji-only label is valid
    return ok(undefined);
  }

  const language = detectLanguage(label);
  const limit = getCharLimit(type, language);

  if (stripped.length > limit) {
    return err(
      new AppError(UX_ERRORS.LABEL_TOO_LONG, {
        label,
        length: stripped.length,
        limit,
        language,
        type,
      }),
    );
  }

  return ok(undefined);
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: All label validator tests PASS.

### Callback Data Encoder

- [ ] **Step 8: Write failing tests for `encodeCallbackData` and `decodeCallbackData`**

```typescript
// tests/unit/callback-data.encoder.test.ts
import { describe, it, expect } from 'vitest';
import {
  encodeCallbackData,
  decodeCallbackData,
  encodeWithExpiry,
  decodeWithExpiry,
} from '../../src/callback-data/callback-data.encoder.js';

describe('encodeCallbackData', () => {
  it('should encode parts with colon separator', () => {
    const result = encodeCallbackData(['invoice', 'delete', '42']);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('invoice:delete:42');
  });

  it('should return err for empty parts array', () => {
    const result = encodeCallbackData([]);
    expect(result.isErr()).toBe(true);
  });

  it('should return err when encoded data exceeds 64 bytes', () => {
    const longParts = ['a'.repeat(65)];
    const result = encodeCallbackData(longParts);
    expect(result.isErr()).toBe(true);
  });
});

describe('decodeCallbackData', () => {
  it('should decode colon-separated string into parts', () => {
    const result = decodeCallbackData('invoice:delete:42');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(['invoice', 'delete', '42']);
  });

  it('should return err for empty string', () => {
    const result = decodeCallbackData('');
    expect(result.isErr()).toBe(true);
  });
});

describe('encodeWithExpiry', () => {
  it('should append expiry timestamp to encoded data', () => {
    const result = encodeWithExpiry(['invoice', 'confirm'], 5);
    expect(result.isOk()).toBe(true);
    const encoded = result._unsafeUnwrap();
    const parts = encoded.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe('invoice');
    expect(parts[1]).toBe('confirm');
    // Third part should be a Unix timestamp
    const timestamp = parseInt(parts[2]!, 10);
    expect(timestamp).toBeGreaterThan(Date.now() / 1000);
  });

  it('should return err when result exceeds 64 bytes', () => {
    const longPrefix = 'a'.repeat(55);
    const result = encodeWithExpiry([longPrefix], 5);
    expect(result.isErr()).toBe(true);
  });
});

describe('decodeWithExpiry', () => {
  it('should decode parts and expiry timestamp', () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const data = `invoice:confirm:${expiresAt}`;
    const result = decodeWithExpiry(data);
    expect(result.isOk()).toBe(true);
    const decoded = result._unsafeUnwrap();
    expect(decoded.parts).toEqual(['invoice', 'confirm']);
    expect(decoded.expiresAt).toBe(expiresAt);
  });

  it('should return err for data with fewer than 2 parts', () => {
    const result = decodeWithExpiry('single');
    expect(result.isErr()).toBe(true);
  });

  it('should return err when expiry is not a valid number', () => {
    const result = decodeWithExpiry('invoice:confirm:notanumber');
    expect(result.isErr()).toBe(true);
  });
});
```

- [ ] **Step 9: Run tests to verify they fail**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: FAIL — module not found.

- [ ] **Step 10: Implement callback data encoder**

```typescript
// src/callback-data/callback-data.encoder.ts
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { UX_ERRORS } from '../errors.js';
import { CALLBACK_SEPARATOR, MAX_CALLBACK_BYTES } from '../constants.js';
import type { DecodedCallbackWithExpiry } from '../types.js';

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

export function encodeCallbackData(
  parts: readonly string[],
): Result<string, AppError> {
  if (parts.length === 0) {
    return err(new AppError(UX_ERRORS.CALLBACK_EMPTY));
  }

  const encoded = parts.join(CALLBACK_SEPARATOR);

  if (getByteLength(encoded) > MAX_CALLBACK_BYTES) {
    return err(
      new AppError(UX_ERRORS.CALLBACK_TOO_LONG, {
        byteLength: getByteLength(encoded),
        maxBytes: MAX_CALLBACK_BYTES,
      }),
    );
  }

  return ok(encoded);
}

export function decodeCallbackData(
  data: string,
): Result<readonly string[], AppError> {
  if (data.length === 0) {
    return err(new AppError(UX_ERRORS.CALLBACK_EMPTY));
  }

  return ok(data.split(CALLBACK_SEPARATOR));
}

export function encodeWithExpiry(
  parts: readonly string[],
  expiryMinutes: number,
): Result<string, AppError> {
  const expiresAt = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
  const allParts = [...parts, String(expiresAt)];
  return encodeCallbackData(allParts);
}

export function decodeWithExpiry(
  data: string,
): Result<DecodedCallbackWithExpiry, AppError> {
  if (data.length === 0) {
    return err(new AppError(UX_ERRORS.CALLBACK_EMPTY));
  }

  const allParts = data.split(CALLBACK_SEPARATOR);

  if (allParts.length < 2) {
    return err(
      new AppError(UX_ERRORS.CALLBACK_DECODE_FAILED, {
        reason: 'Expected at least 2 parts (data + expiry)',
      }),
    );
  }

  const expiryStr = allParts[allParts.length - 1]!;
  const expiresAt = parseInt(expiryStr, 10);

  if (isNaN(expiresAt)) {
    return err(
      new AppError(UX_ERRORS.CALLBACK_DECODE_FAILED, {
        reason: 'Last part is not a valid timestamp',
      }),
    );
  }

  const parts = allParts.slice(0, -1);
  return ok({ parts, expiresAt });
}
```

- [ ] **Step 11: Run tests to verify they pass**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: All callback data encoder tests PASS.

- [ ] **Step 12: Update barrel exports in `src/index.ts`**

Add:
```typescript
// Label Validator
export { validateLabel, detectLanguage, getCharLimit, getRowLimit } from './keyboards/label.validator.js';

// Callback Data Encoder
export {
  encodeCallbackData,
  decodeCallbackData,
  encodeWithExpiry,
  decodeWithExpiry,
} from './callback-data/callback-data.encoder.js';
```

- [ ] **Step 13: Verify build passes**

Run: `pnpm build --filter @tempot/ux-helpers`
Expected: Clean compile.

- [ ] **Step 14: Commit**

```bash
git add packages/ux-helpers/
git commit -m "feat(ux-helpers): add label validator and callback data encoder"
```

---

## Task 3: Status Formatter (Pure)

**Files:**
- Create: `packages/ux-helpers/src/messages/status.formatter.ts`
- Create: `packages/ux-helpers/tests/unit/status.formatter.test.ts`
- Modify: `packages/ux-helpers/src/index.ts` (add exports)

**Reference:** FR-001, Rule LXV, Section 13.4, design doc Section 1

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/status.formatter.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import {
  formatLoading,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../src/messages/status.formatter.js';

describe('Status Formatter', () => {
  it('formatLoading should return string prefixed with ⏳', () => {
    const result = formatLoading({ key: 'invoice.processing' });
    expect(result).toBe('\u23F3 invoice.processing');
  });

  it('formatSuccess should return string prefixed with ✅', () => {
    const result = formatSuccess({ key: 'invoice.created' });
    expect(result).toBe('\u2705 invoice.created');
  });

  it('formatError should return string prefixed with ❌', () => {
    const result = formatError({ key: 'invoice.failed' });
    expect(result).toBe('\u274C invoice.failed');
  });

  it('formatWarning should return string prefixed with ⚠️', () => {
    const result = formatWarning({ key: 'invoice.warning' });
    expect(result).toBe('\u26A0\uFE0F invoice.warning');
  });

  it('should pass interpolation to t()', () => {
    const result = formatSuccess({
      key: 'invoice.created',
      interpolation: { id: 42 },
    });
    expect(result).toContain('invoice.created');
    expect(result).toContain('"id":42');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement status formatter**

```typescript
// src/messages/status.formatter.ts
import { t } from '@tempot/i18n-core';
import { STATUS_EMOJIS } from '../constants.js';
import type { StatusFormatOptions } from '../types.js';

export function formatLoading(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.loading} ${t(options.key, options.interpolation)}`;
}

export function formatSuccess(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.success} ${t(options.key, options.interpolation)}`;
}

export function formatError(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.error} ${t(options.key, options.interpolation)}`;
}

export function formatWarning(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.warning} ${t(options.key, options.interpolation)}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: PASS.

- [ ] **Step 5: Update barrel exports**

Add to `src/index.ts`:
```typescript
// Status Formatter
export { formatLoading, formatSuccess, formatError, formatWarning } from './messages/status.formatter.js';
```

- [ ] **Step 6: Verify build passes and commit**

```bash
pnpm build --filter @tempot/ux-helpers
git add packages/ux-helpers/
git commit -m "feat(ux-helpers): add pure status formatter with 4 status types"
```

---

## Task 4: Message Composer

**Files:**
- Create: `packages/ux-helpers/src/messages/message.composer.ts`
- Create: `packages/ux-helpers/tests/unit/message.composer.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-003, Section 13.2, Rule II

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/message.composer.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import { createComposer } from '../../src/messages/message.composer.js';

describe('Message Composer', () => {
  it('should compose a single paragraph', () => {
    const result = createComposer().paragraph('hello.world').build();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('hello.world');
  });

  it('should compose multiple paragraphs with double newline spacing', () => {
    const result = createComposer()
      .paragraph('para.one')
      .paragraph('para.two')
      .build();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('para.one\n\npara.two');
  });

  it('should format bullet list with emoji bullets', () => {
    const result = createComposer()
      .bulletList(['Item 1', 'Item 2', 'Item 3'])
      .build();
    expect(result.isOk()).toBe(true);
    const text = result._unsafeUnwrap();
    expect(text).toContain('\u25CF Item 1');
    expect(text).toContain('\u25CF Item 2');
    expect(text).toContain('\u25CF Item 3');
  });

  it('should add visual separator', () => {
    const result = createComposer()
      .paragraph('before')
      .separator()
      .paragraph('after')
      .build();
    expect(result.isOk()).toBe(true);
    const text = result._unsafeUnwrap();
    expect(text).toContain('before');
    expect(text).toContain('after');
    expect(text).toContain('───');
  });

  it('should return err when text exceeds 4096 characters', () => {
    const longKey = 'x'.repeat(4097);
    const result = createComposer().paragraph(longKey).build();
    expect(result.isErr()).toBe(true);
  });

  it('should be chainable (fluent API)', () => {
    const composer = createComposer();
    const result = composer.paragraph('a').paragraph('b').separator().paragraph('c').build();
    expect(result.isOk()).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: FAIL.

- [ ] **Step 3: Implement message composer**

```typescript
// src/messages/message.composer.ts
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { t } from '@tempot/i18n-core';
import { MAX_MESSAGE_LENGTH, EMOJI_BULLET } from '../constants.js';
import { UX_ERRORS } from '../errors.js';
import type { ComposerBuilder } from '../types.js';

const SEPARATOR_LINE = '───────────────';

export function createComposer(): ComposerBuilder {
  const sections: string[] = [];

  const builder: ComposerBuilder = {
    paragraph(key, interpolation) {
      sections.push(t(key, interpolation));
      return builder;
    },

    bulletList(items) {
      const formatted = items
        .map((item) => `${EMOJI_BULLET} ${item}`)
        .join('\n');
      sections.push(formatted);
      return builder;
    },

    separator() {
      sections.push(SEPARATOR_LINE);
      return builder;
    },

    build(): Result<string, AppError> {
      const text = sections.join('\n\n');

      if (text.length > MAX_MESSAGE_LENGTH) {
        return err(
          new AppError(UX_ERRORS.MESSAGE_TOO_LONG, {
            length: text.length,
            limit: MAX_MESSAGE_LENGTH,
          }),
        );
      }

      return ok(text);
    },
  };

  return builder;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: PASS.

- [ ] **Step 5: Update barrel exports and commit**

Add to `src/index.ts`:
```typescript
// Message Composer
export { createComposer } from './messages/message.composer.js';
```

```bash
pnpm build --filter @tempot/ux-helpers
git add packages/ux-helpers/
git commit -m "feat(ux-helpers): add message composer with paragraph, bullet list, separator"
```

---

## Task 5: Error Formatter

**Files:**
- Create: `packages/ux-helpers/src/messages/error.formatter.ts`
- Create: `packages/ux-helpers/tests/unit/error.formatter.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-002, Rule LXIX, Section 13.5

- [ ] **Step 1: Write failing tests**

Test all 4 error types: `formatUserError`, `formatSystemError`, `formatPermissionError`, `formatSessionExpired`. Verify formatting, emojis, i18n usage. Session expired must return `SessionExpiredResult` with restart button config.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement error formatter**

Each function is pure, synchronous, uses `t()` for text. `formatSessionExpired` returns `SessionExpiredResult` containing text + restart button config.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add error formatter with 4 error types per Rule LXIX"
```

---

## Task 6: Inline Keyboard Builder

**Files:**
- Create: `packages/ux-helpers/src/keyboards/inline.builder.ts`
- Create: `packages/ux-helpers/tests/unit/inline.builder.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-005, Rule LXVI, Section 13.1, design doc Section 8

- [ ] **Step 1: Write failing tests**

Test: button creation wrapping grammY InlineKeyboard, label validation (returns err for invalid), auto-row wrapping at 3 buttons, long labels get own row, `build()` returns `Result<InlineKeyboard, AppError>`, `toGrammyKeyboard()` returns raw keyboard.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement inline keyboard builder**

Wrapper object (NOT subclass) around `new InlineKeyboard()`. Delegates `keyboard.text(label, callbackData)`. Uses `validateLabel` for enforcement. Auto-row logic: if `currentRowLength >= ROW_LIMITS.inline`, call `keyboard.row()`. Long labels (stripped length > limit/2) get their own row.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add inline keyboard builder wrapping grammY InlineKeyboard"
```

---

## Task 7: Reply Keyboard Builder

**Files:**
- Create: `packages/ux-helpers/src/keyboards/reply.builder.ts`
- Create: `packages/ux-helpers/tests/unit/reply.builder.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-006, Section 13.1

- [ ] **Step 1: Write failing tests**

Test: button creation wrapping grammY Keyboard, reply limits (15 Arabic / 18 English, max 2/row), `oneTime()` and `resized()` methods, `build()` returns `Result<Keyboard, AppError>`.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement reply keyboard builder**

Similar pattern to inline builder but wraps `new Keyboard()` with reply-specific limits.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add reply keyboard builder wrapping grammY Keyboard"
```

---

## Task 8: Emoji Number Utility + List Formatter

**Files:**
- Create: `packages/ux-helpers/src/lists/emoji-number.ts`
- Create: `packages/ux-helpers/src/lists/list.formatter.ts`
- Create: `packages/ux-helpers/tests/unit/emoji-number.test.ts`
- Create: `packages/ux-helpers/tests/unit/list.formatter.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-008, Rule LXVIII, Section 13.7

### Emoji Number Utility

- [ ] **Step 1: Write failing tests for `toEmojiNumber`**

Test: 1→"1️⃣", 10→"🔟", 11→"11.", 0 or negative→text fallback.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement `toEmojiNumber`**

```typescript
import { EMOJI_NUMBERS } from '../constants.js';

export function toEmojiNumber(n: number): string {
  if (n >= 1 && n <= EMOJI_NUMBERS.length) {
    return EMOJI_NUMBERS[n - 1]!;
  }
  return `${n}.`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

### List Formatter

- [ ] **Step 5: Write failing tests for `formatList`**

Test: title includes count "(N)", items prefixed with emoji numbers, empty list returns empty state message + button config, `renderItem` callback invoked for each item. Returns `Result<ListFormatResult, AppError>`.

- [ ] **Step 6: Run tests to verify they fail**

- [ ] **Step 7: Implement `formatList`**

Uses `t()` for title and empty state key. Prefixes items with `toEmojiNumber(index + 1)`. Returns `ListFormatResult` with text and optional emptyActionButton.

- [ ] **Step 8: Run tests to verify they pass**

- [ ] **Step 9: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add emoji number utility and list formatter"
```

---

## Task 9: Pagination Builder

**Files:**
- Create: `packages/ux-helpers/src/lists/pagination.builder.ts`
- Create: `packages/ux-helpers/tests/unit/pagination.builder.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-009, Section 13.7

- [ ] **Step 1: Write failing tests**

Test: page 1 has no Previous button, last page has no Next button, single page returns empty keyboard, current page indicator between prev/next. Returns `Result<InlineKeyboard, AppError>`.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement pagination builder**

Uses grammY `InlineKeyboard`. Conditionally adds Previous/Next buttons with callback data `{prefix}:page:{n}`.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add pagination builder with boundary handling"
```

---

## Task 10: Confirmation Builder

**Files:**
- Create: `packages/ux-helpers/src/keyboards/confirmation.builder.ts`
- Create: `packages/ux-helpers/tests/unit/confirmation.builder.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-007, Rule LXVII, Section 13.6, design doc Sections 3 and 9

- [ ] **Step 1: Write failing tests**

Test: confirm button shows action name via i18n (not "Yes"), RTL ordering (Cancel first, Confirm second in array), expiry timestamp encoded in callback data via `encodeWithExpiry`, `isIrreversible: true` produces warningText, returns `Result<ConfirmationResult, AppError>`.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement confirmation builder**

Uses `encodeWithExpiry` for confirm callback data, `t()` for button labels, `CONFIRMATION_EXPIRY_MINUTES` for expiry.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add confirmation builder with expiry and RTL ordering"
```

---

## Task 11: Expiry Checker

**Files:**
- Create: `packages/ux-helpers/src/middleware/expiry.checker.ts`
- Create: `packages/ux-helpers/tests/unit/expiry.checker.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-011 (related), design doc Section 3

- [ ] **Step 1: Write failing tests**

Test: `isExpired()` returns `Result<boolean, AppError>` — true when current time >= expiry, false when before. `checkExpiry()` returns `Result.err()` with CONFIRMATION_EXPIRED code when expired, `ok()` when valid. Handles malformed callback data.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement expiry checker**

Uses `decodeWithExpiry` from callback-data.encoder, compares `expiresAt` to `Math.floor(Date.now() / 1000)`.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add expiry checker for confirmation callback data"
```

---

## Task 12: Golden Rule Fallback + Answer Callback + Typing Indicator

**Files:**
- Create: `packages/ux-helpers/src/helpers/golden-rule.fallback.ts`
- Create: `packages/ux-helpers/src/helpers/answer-callback.ts`
- Create: `packages/ux-helpers/src/helpers/typing.indicator.ts`
- Create: `packages/ux-helpers/tests/unit/golden-rule.fallback.test.ts`
- Create: `packages/ux-helpers/tests/unit/answer-callback.test.ts`
- Create: `packages/ux-helpers/tests/unit/typing.indicator.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-013, FR-014, FR-015, design doc Section 4

### Golden Rule Fallback

- [ ] **Step 1: Write failing tests for `editOrSend`**

Test with mock context: successful edit returns ok, "message is not modified" error returns ok (no-op), "message to edit not found" falls back to ctx.reply + logs warning, "message can't be edited" falls back to ctx.reply, other errors return err. When no callback query/message, uses ctx.reply. Returns `AsyncResult<void, AppError>`.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement `editOrSend`**

Try `ctx.editMessageText()` → catch error → classify via error description → fallback or return err. Log warnings via `logger.warn()`.

- [ ] **Step 4: Run tests to verify they pass**

### Answer Callback

- [ ] **Step 5: Write failing tests for `answerCallback`**

Test: calls `ctx.answerCallbackQuery()` with optional text/alert, catches timeout errors (>30s) gracefully returning ok, returns `AsyncResult<void, AppError>`.

- [ ] **Step 6: Run tests to verify they fail**

- [ ] **Step 7: Implement `answerCallback`**

- [ ] **Step 8: Run tests to verify they pass**

### Typing Indicator

- [ ] **Step 9: Write failing tests for `showTyping`**

Test: calls `ctx.replyWithChatAction('typing')`, catches errors for unsupported chat types returning ok, returns `AsyncResult<void, AppError>`.

- [ ] **Step 10: Run tests to verify they fail**

- [ ] **Step 11: Implement `showTyping`**

- [ ] **Step 12: Run tests to verify they pass**

- [ ] **Step 13: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add golden rule fallback, answer callback, typing indicator"
```

---

## Task 13: Status Sender (Context-Aware)

**Files:**
- Create: `packages/ux-helpers/src/messages/status.sender.ts`
- Create: `packages/ux-helpers/tests/unit/status.sender.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-004, design doc Section 1

- [ ] **Step 1: Write failing tests**

Test with mock context: `sendLoading` formats via Status Formatter + sends via `editOrSend`, `sendSuccess`/`sendError`/`sendWarning` similarly. Optional keyboard can be attached. All return `AsyncResult<void, AppError>`.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement status sender**

Each function: call corresponding format function → call `editOrSend(ctx, { text, replyMarkup: options.keyboard })`.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add context-aware status sender using Golden Rule"
```

---

## Task 14: Feedback Handler

**Files:**
- Create: `packages/ux-helpers/src/feedback/feedback.handler.ts`
- Create: `packages/ux-helpers/tests/unit/feedback.handler.test.ts`
- Modify: `packages/ux-helpers/src/index.ts`

**Reference:** FR-010, Section 13.8, design doc Section 6

- [ ] **Step 1: Write failing tests**

Test: shows loading via `sendLoading`, executes action, on success shows `sendSuccess` with optional keyboard, on failure shows `sendError`. Returns the action's result `AsyncResult<T, AppError>`.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement feedback handler**

```typescript
export async function executeFeedback<T>(
  ctx: Context,
  options: FeedbackOptions<T>,
): AsyncResult<T, AppError> {
  // 1. Show loading
  await sendLoading(ctx, { key: options.loadingKey });

  // 2. Execute action
  const result = await options.action();

  // 3. Show result
  if (result.isOk()) {
    await sendSuccess(ctx, {
      key: options.successKey,
      keyboard: options.keyboard,
    });
  } else {
    await sendError(ctx, {
      key: `errors.${result.error.code}`,
    });
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Update barrel exports and commit**

```bash
git commit -m "feat(ux-helpers): add feedback handler for loading-action-result flow"
```

---

## Task 15: Mock Context Factory (Testing Subpath)

**Files:**
- Create: `packages/ux-helpers/src/testing/mock.context.ts`
- Create: `packages/ux-helpers/tests/unit/mock.context.test.ts`

**Reference:** FR-016, design doc Section 5

**Important:** Do NOT import vitest at runtime. Use plain function mocks with call tracking arrays.

- [ ] **Step 1: Write failing tests**

Test: `createMockContext()` returns object with tracked methods (editMessageText, reply, answerCallbackQuery, replyWithChatAction), `calls` property tracks invocations, configurable chatId/messageId/callbackData/userId, default values work.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement mock context factory**

```typescript
// src/testing/mock.context.ts
import type { MockContextOptions, MockContextCalls } from '../types.js';

interface TrackedFn {
  (...args: unknown[]): Promise<unknown>;
  calls: unknown[][];
  reset: () => void;
}

function createTrackedFn(
  returnValue: unknown = true,
): TrackedFn {
  const calls: unknown[][] = [];
  const fn = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve(returnValue);
  }) as TrackedFn;
  fn.calls = calls;
  fn.reset = () => { calls.length = 0; };
  return fn;
}

export function createMockContext(options?: MockContextOptions) {
  const chatId = options?.chatId ?? 123;
  const messageId = options?.messageId ?? 1;

  const editMessageText = createTrackedFn(true);
  const reply = createTrackedFn({ message_id: messageId + 1 });
  const answerCallbackQuery = createTrackedFn(true);
  const replyWithChatAction = createTrackedFn(true);

  const calls: MockContextCalls = {
    editMessageText: editMessageText.calls,
    reply: reply.calls,
    answerCallbackQuery: answerCallbackQuery.calls,
    replyWithChatAction: replyWithChatAction.calls,
  };

  return {
    chat: { id: chatId, type: 'private' as const },
    message: { message_id: messageId },
    callbackQuery: options?.callbackData
      ? { data: options.callbackData }
      : undefined,
    from: { id: options?.userId ?? 456 },
    editMessageText,
    reply,
    answerCallbackQuery,
    replyWithChatAction,
    calls,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ux-helpers): add mock context factory for testing subpath"
```

---

## Task 16: Barrel Exports + README Update

**Files:**
- Modify: `packages/ux-helpers/src/index.ts` (finalize all exports)
- Modify: `packages/ux-helpers/README.md` (update with actual API docs)

**Reference:** package-creation-checklist (items 8-10)

- [ ] **Step 1: Finalize barrel exports**

Ensure ALL public APIs are exported from `src/index.ts` with section comments. Types via `export type {}`. All imports use `.js` extensions. Verify each export resolves.

- [ ] **Step 2: Verify the `./testing` subpath export works**

Confirm `@tempot/ux-helpers/testing` resolves to `dist/testing/mock.context.js`.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test --filter @tempot/ux-helpers`
Expected: ALL tests pass.

- [ ] **Step 4: Run full build**

Run: `pnpm build --filter @tempot/ux-helpers`
Expected: Clean compile, zero errors.

- [ ] **Step 5: Run 10-point package-creation checklist (final)**

Verify all 10 points pass:
1. `.gitignore` — check
2. `outDir: dist` — check
3. main/types point to dist — check
4. exports field — check
5. build script — check
6. vitest.config.ts — check
7. vitest 4.1.0 exact — check
8. No `console.*` in `src/` — run grep
9. No phantom deps — verify all deps used
10. Clean workspace — no `.js`/`.d.ts` in `src/`

- [ ] **Step 6: Update README.md**

Update with actual API documentation, examples, dependency list.

- [ ] **Step 7: Commit**

```bash
git add packages/ux-helpers/
git commit -m "feat(ux-helpers): finalize barrel exports and update README"
```

---

## Implementation Order Summary

| Order | Task | Component(s) | Dependencies |
|-------|------|--------------|--------------|
| 1 | Infrastructure | package.json, tsconfig, vitest, types, errors, constants | None |
| 2 | Utilities | Label Validator, Callback Data Encoder | types, errors, constants |
| 3 | Status Formatter | Pure status formatting | i18n-core, constants |
| 4 | Message Composer | Text composition rules | i18n-core, constants, errors |
| 5 | Error Formatter | 4 error type formatters | i18n-core, callback-data.encoder |
| 6 | Inline Builder | Inline keyboard wrapper | label.validator, grammY |
| 7 | Reply Builder | Reply keyboard wrapper | label.validator, grammY |
| 8 | List + Emoji Numbers | List formatting | emoji-number, i18n-core |
| 9 | Pagination | Page navigation buttons | grammY InlineKeyboard |
| 10 | Confirmation | Confirm/cancel dialogs | label.validator, callback-data.encoder |
| 11 | Expiry Checker | Confirmation expiry | callback-data.encoder |
| 12 | Ctx-Aware Helpers | Golden Rule, Answer CB, Typing | logger, grammY context |
| 13 | Status Sender | Ctx-aware status messages | status.formatter, golden-rule.fallback |
| 14 | Feedback Handler | Loading→action→result flow | status.sender, answer-callback, typing |
| 15 | Mock Context | Testing subpath | grammY types |
| 16 | Integration | Barrel exports, README | All components |
