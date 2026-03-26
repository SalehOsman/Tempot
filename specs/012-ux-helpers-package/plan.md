# @tempot/ux-helpers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the centralized UX component library with dual API (pure + context-aware) enforcing Constitution Rules LXIV-LXIX and Architecture Spec Section 13.

**Architecture:** Dual-layer design (Decision D1):

- **Pure layer** — functions returning formatted strings/objects, synchronous, no side effects
- **Context-aware layer** — wrappers taking grammY `ctx`, enforcing Golden Rule (edit existing messages)

Both layers wrap grammY's native keyboard classes (InlineKeyboard, Keyboard) rather than rebuilding keyboard logic (Decision D6).

---

## Tech Stack

| Component        | Technology             | Version      |
| ---------------- | ---------------------- | ------------ |
| Runtime          | Node.js                | 20+          |
| Language         | TypeScript Strict Mode | 5.9.3        |
| Bot Framework    | grammY                 | ^1.0.0       |
| Error Handling   | neverthrow             | 8.2.0        |
| Shared Utilities | @tempot/shared         | workspace:\* |
| i18n             | @tempot/i18n-core      | workspace:\* |
| Logging          | @tempot/logger         | workspace:\* |
| Testing          | Vitest                 | 4.1.0        |

**NOT a dependency:** @tempot/session-manager (language detection happens internally via @tempot/i18n-core's `t()` function).

---

## Design Decisions

| #   | Decision       | Choice                                        | Rationale                                              |
| --- | -------------- | --------------------------------------------- | ------------------------------------------------------ |
| D1  | API Layer      | Dual: Pure + Context-aware                    | Pure = testable, ctx-aware = Golden Rule enforcement   |
| D2  | Keyboard Types | Inline + Reply with different limits          | Section 13.1 defines both                              |
| D3  | Expiry         | Timestamp in callback data (stateless)        | Survives restart, no DB                                |
| D4  | RTL Order      | Cancel first in code, Confirm second          | Telegram RTL renders right-to-left                     |
| D5  | Char Counting  | First-char language detection                 | Arabic first-char = Arabic limits, else English limits |
| D6  | grammY         | Full dependency, wrap InlineKeyboard/Keyboard | Reuse grammY's builder logic, add enforcement          |
| D7  | @grammyjs/menu | NOT used (reserved for search-engine)         | YAGNI per ADR-025                                      |

---

## File Structure

```
packages/ux-helpers/
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts                          # Barrel exports
│   ├── types.ts                          # All interfaces/types
│   ├── errors.ts                         # UX error codes
│   ├── constants.ts                      # Button limits, emojis, expiry, message limits
│   ├── messages/
│   │   ├── status.formatter.ts           # Pure: 4 status types → string
│   │   ├── status.sender.ts             # Ctx-aware: edits message via Golden Rule
│   │   ├── error.formatter.ts           # Pure: 4 error types per Rule LXIX
│   │   └── message.composer.ts          # Section 13.2 text rules
│   ├── keyboards/
│   │   ├── inline.builder.ts            # Wraps grammY InlineKeyboard
│   │   ├── reply.builder.ts             # Wraps grammY Keyboard
│   │   ├── confirmation.builder.ts      # 5-min expiry, RTL order
│   │   └── label.validator.ts           # Char counting, language detection
│   ├── lists/
│   │   ├── list.formatter.ts            # Title+count, emoji numbers, empty state
│   │   ├── pagination.builder.ts        # Prev/next buttons
│   │   └── emoji-number.ts             # 1️⃣ 2️⃣ mapping utility
│   ├── feedback/
│   │   └── feedback.handler.ts          # Loading→action→result flow
│   ├── callback-data/
│   │   └── callback-data.encoder.ts     # Type-safe encode/decode, 64-byte limit
│   ├── middleware/
│   │   └── expiry.checker.ts            # Confirms confirmation expiry from callback data
│   ├── helpers/
│   │   ├── golden-rule.fallback.ts      # editMessageText fallback
│   │   ├── answer-callback.ts           # Auto answerCallbackQuery
│   │   └── typing.indicator.ts          # Chat action typing
│   └── testing/
│       └── mock.context.ts              # Mock grammY Context factory
└── tests/unit/
    ├── status.formatter.test.ts
    ├── status.sender.test.ts
    ├── error.formatter.test.ts
    ├── message.composer.test.ts
    ├── inline.builder.test.ts
    ├── reply.builder.test.ts
    ├── confirmation.builder.test.ts
    ├── label.validator.test.ts
    ├── list.formatter.test.ts
    ├── pagination.builder.test.ts
    ├── emoji-number.test.ts
    ├── feedback.handler.test.ts
    ├── callback-data.encoder.test.ts
    ├── expiry.checker.test.ts
    ├── golden-rule.fallback.test.ts
    ├── answer-callback.test.ts
    ├── typing.indicator.test.ts
    └── mock.context.test.ts
```

---

## Package Configuration

### package.json

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

### tsconfig.json

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

### vitest.config.ts

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

---

## Component API Specifications

### 1. Status Formatter (Pure) — FR-001

```typescript
// src/messages/status.formatter.ts
import { t } from '@tempot/i18n-core';

interface StatusFormatOptions {
  readonly key: string;
  readonly interpolation?: Record<string, unknown>;
}

function formatLoading(options: StatusFormatOptions): string;
function formatSuccess(options: StatusFormatOptions): string;
function formatError(options: StatusFormatOptions): string;
function formatWarning(options: StatusFormatOptions): string;
```

Returns: `string` — synchronous, no side effects.

### 2. Status Sender (Context-Aware) — FR-004

```typescript
// src/messages/status.sender.ts
import type { Context } from 'grammy';

interface StatusSendOptions {
  readonly key: string;
  readonly interpolation?: Record<string, unknown>;
  readonly keyboard?: InlineKeyboard;
}

function sendLoading(ctx: Context, options: StatusSendOptions): AsyncResult<void, AppError>;
function sendSuccess(ctx: Context, options: StatusSendOptions): AsyncResult<void, AppError>;
function sendError(ctx: Context, options: StatusSendOptions): AsyncResult<void, AppError>;
function sendWarning(ctx: Context, options: StatusSendOptions): AsyncResult<void, AppError>;
```

Uses Golden Rule Fallback internally.

### 3. Error Formatter (Pure) — FR-002

```typescript
// src/messages/error.formatter.ts
interface UserErrorOptions {
  readonly problemKey: string;
  readonly solutionKey: string;
  readonly interpolation?: Record<string, unknown>;
}

interface SystemErrorOptions {
  readonly referenceCode: string;
}

interface PermissionErrorOptions {
  readonly reasonKey: string;
}

interface SessionExpiredOptions {
  readonly restartCallbackData: string;
}

function formatUserError(options: UserErrorOptions): string;
function formatSystemError(options: SystemErrorOptions): string;
function formatPermissionError(options: PermissionErrorOptions): string;
function formatSessionExpired(options: SessionExpiredOptions): SessionExpiredResult;
```

### 4. Message Composer — FR-003

```typescript
// src/messages/message.composer.ts
interface ComposerBuilder {
  paragraph(key: string, interpolation?: Record<string, unknown>): ComposerBuilder;
  bulletList(items: readonly string[]): ComposerBuilder;
  separator(): ComposerBuilder;
  build(): Result<string, AppError>;
}

function createComposer(): ComposerBuilder;
```

Validates 4096-char limit on `build()`.

### 5. Inline Keyboard Builder — FR-005

```typescript
// src/keyboards/inline.builder.ts
import { InlineKeyboard } from 'grammy';

interface InlineButtonConfig {
  readonly label: string;
  readonly callbackData: string;
}

interface TempotInlineKeyboard {
  button(config: InlineButtonConfig): Result<TempotInlineKeyboard, AppError>;
  row(): TempotInlineKeyboard;
  build(): Result<InlineKeyboard, AppError>;
  toGrammyKeyboard(): InlineKeyboard;
}

function createInlineKeyboard(): TempotInlineKeyboard;
```

Wraps grammY InlineKeyboard. Validates labels via Label Validator. Auto-wraps rows.

### 6. Reply Keyboard Builder — FR-006

```typescript
// src/keyboards/reply.builder.ts
import { Keyboard } from 'grammy';

interface TempotReplyKeyboard {
  button(label: string): Result<TempotReplyKeyboard, AppError>;
  row(): TempotReplyKeyboard;
  build(): Result<Keyboard, AppError>;
  toGrammyKeyboard(): Keyboard;
  oneTime(value?: boolean): TempotReplyKeyboard;
  resized(value?: boolean): TempotReplyKeyboard;
}

function createReplyKeyboard(): TempotReplyKeyboard;
```

Different char limits from inline (15 Arabic / 18 English, max 2/row).

### 7. Label Validator — FR-012

```typescript
// src/keyboards/label.validator.ts
type KeyboardType = 'inline' | 'reply';

function validateLabel(label: string, type: KeyboardType): Result<void, AppError>;
function detectLanguage(text: string): 'ar' | 'en';
function getCharLimit(type: KeyboardType, language: 'ar' | 'en'): number;
function getRowLimit(type: KeyboardType): number;
```

First-character detection for language (Decision D5).

### 8. Confirmation Builder — FR-007

```typescript
// src/keyboards/confirmation.builder.ts
interface ConfirmationOptions {
  readonly actionNameKey: string;
  readonly cancelKey?: string;
  readonly callbackPrefix: string;
  readonly isIrreversible?: boolean;
}

interface ConfirmationResult {
  readonly keyboard: InlineKeyboard;
  readonly warningText?: string;
}

function createConfirmation(options: ConfirmationOptions): Result<ConfirmationResult, AppError>;
```

Encodes expiry timestamp in callback data. RTL-aware ordering (Decision D4).

### 9. List Formatter — FR-008

```typescript
// src/lists/list.formatter.ts
interface ListFormatOptions<T> {
  readonly titleKey: string;
  readonly items: readonly T[];
  readonly renderItem: (item: T, index: number) => string;
  readonly emptyStateKey?: string;
  readonly emptyActionConfig?: InlineButtonConfig;
}

interface ListFormatResult {
  readonly text: string;
  readonly emptyActionButton?: InlineButtonConfig;
}

function formatList<T>(options: ListFormatOptions<T>): Result<ListFormatResult, AppError>;
```

### 10. Pagination Builder — FR-009

```typescript
// src/lists/pagination.builder.ts
interface PaginationOptions {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly callbackPrefix: string;
}

function createPagination(options: PaginationOptions): Result<InlineKeyboard, AppError>;
```

### 11. Emoji Number Utility

```typescript
// src/lists/emoji-number.ts
function toEmojiNumber(n: number): string;
```

Maps 1-10 to emoji numbers. 11+ returns string number with period.

### 12. Feedback Handler — FR-010

```typescript
// src/feedback/feedback.handler.ts
interface FeedbackOptions<T> {
  readonly loadingKey: string;
  readonly action: () => AsyncResult<T, AppError>;
  readonly successKey: string;
  readonly keyboard?: InlineKeyboard;
}

function executeFeedback<T>(ctx: Context, options: FeedbackOptions<T>): AsyncResult<T, AppError>;
```

### 13. Callback Data Encoder — FR-011

```typescript
// src/callback-data/callback-data.encoder.ts
function encodeCallbackData(parts: readonly string[]): Result<string, AppError>;
function decodeCallbackData(data: string): Result<readonly string[], AppError>;
function encodeWithExpiry(
  parts: readonly string[],
  expiryMinutes: number,
): Result<string, AppError>;
function decodeWithExpiry(
  data: string,
): Result<{ parts: readonly string[]; expiresAt: number }, AppError>;
```

### 14. Expiry Checker — FR-011 (related)

```typescript
// src/middleware/expiry.checker.ts
function isExpired(callbackData: string): Result<boolean, AppError>;
function checkExpiry(callbackData: string): Result<void, AppError>;
```

### 15. Golden Rule Fallback — FR-013

```typescript
// src/helpers/golden-rule.fallback.ts
interface EditOptions {
  readonly text: string;
  readonly parseMode?: 'HTML' | 'MarkdownV2';
  readonly replyMarkup?: InlineKeyboard;
}

function editOrSend(ctx: Context, options: EditOptions): AsyncResult<void, AppError>;
```

### 16. Answer Callback Query — FR-014

```typescript
// src/helpers/answer-callback.ts
interface AnswerOptions {
  readonly text?: string;
  readonly showAlert?: boolean;
}

function answerCallback(ctx: Context, options?: AnswerOptions): AsyncResult<void, AppError>;
```

### 17. Typing Indicator — FR-015

```typescript
// src/helpers/typing.indicator.ts
function showTyping(ctx: Context): AsyncResult<void, AppError>;
```

### 18. Mock Context Factory — FR-016

```typescript
// src/testing/mock.context.ts
interface MockContextOptions {
  readonly chatId?: number;
  readonly messageId?: number;
  readonly callbackData?: string;
  readonly userId?: number;
}

interface MockContext extends Partial<Context> {
  editMessageText: ReturnType<typeof vi.fn>;
  reply: ReturnType<typeof vi.fn>;
  answerCallbackQuery: ReturnType<typeof vi.fn>;
  replyWithChatAction: ReturnType<typeof vi.fn>;
  readonly calls: {
    editMessageText: unknown[][];
    reply: unknown[][];
    answerCallbackQuery: unknown[][];
    replyWithChatAction: unknown[][];
  };
}

function createMockContext(options?: MockContextOptions): MockContext;
```

---

## Dependency Graph (Internal)

```
label.validator ─────────┐
                         ├──→ inline.builder
callback-data.encoder ──┤    reply.builder
                         ├──→ confirmation.builder
                         └──→ expiry.checker

status.formatter ────────┐
                          ├──→ status.sender
golden-rule.fallback ────┘

error.formatter ──────────── (standalone pure)
message.composer ─────────── (standalone pure)
emoji-number ────────────┐
                          ├──→ list.formatter
                          └──→ pagination.builder

status.sender ───────────┐
answer-callback ──────────├──→ feedback.handler
typing.indicator ────────┘

mock.context ─────────────── (standalone, testing subpath)
```

---

## Implementation Order

Tasks are ordered to satisfy the dependency graph:

1. **Infrastructure** — package.json, tsconfig, vitest, .gitignore, types, errors, constants, index.ts
2. **Label Validator + Callback Data Encoder** — foundational utilities
3. **Status Formatter** — pure, no deps beyond i18n
4. **Message Composer** — pure, no deps beyond i18n
5. **Error Formatter** — pure, no deps beyond i18n + callback data encoder
6. **Inline Keyboard Builder** — depends on label.validator
7. **Reply Keyboard Builder** — depends on label.validator
8. **Emoji Number + List Formatter** — depends on emoji-number
9. **Pagination Builder** — depends on inline keyboard concepts
10. **Confirmation Builder** — depends on label.validator + callback-data.encoder
11. **Expiry Checker** — depends on callback-data.encoder
12. **Golden Rule Fallback + Answer Callback + Typing Indicator** — ctx-aware helpers
13. **Status Sender** — depends on status.formatter + golden-rule.fallback
14. **Feedback Handler** — depends on status.sender + answer-callback + typing
15. **Mock Context Factory** — testing subpath
16. **Barrel exports + README update** — final integration
