# Input Engine Design Document

**Date:** 2026-04-03
**Package:** `@tempot/input-engine`
**Spec:** `specs/011-input-engine-package/`
**Status:** Approved

## Overview

`@tempot/input-engine` is a dynamic multi-step conversation and form handling engine built on `@grammyjs/conversations` v2.1.1 and Zod 4 with Registry. Module developers define form schemas using Zod 4 with `z.globalRegistry` metadata and call `runForm()` to have the bot automatically handle the entire multi-step conversation -- asking questions, validating input, displaying i18n error messages, and returning type-safe `Result<FormData, AppError>`.

The package covers 39 field types across 9 categories, partial save via a custom conversations storage adapter (backed by `@tempot/shared` CacheService), cancel/timeout handling, conditional fields, AI-powered extraction, and geo selection.

## Design Decisions

### D1: QR Code Decoding — `jsQR` + `jpeg-js` + `pngjs` (No Native Dependencies)

**Context:** The QR field type (FR-048) requires decoding QR codes from user-sent photos. The bot receives a Telegram photo (JPEG or PNG), downloads it, and must decode any QR code to extract the string content.

**Decision:** Use three pure-JS libraries with zero native dependencies:

- `jsQR` (^1.4.0) — QR code decoder. Takes raw RGBA pixel data (`Uint8ClampedArray`, `width`, `height`), returns `{ data: string }` or `null`. 1.4M weekly downloads, zero deps, built-in TypeScript types. Synchronous API.
- `jpeg-js` (latest) — Pure JS JPEG decoder. Converts JPEG buffer to raw pixel data. ~80KB. Telegram photos are primarily JPEG.
- `pngjs` (latest) — Pure JS PNG decoder. Converts PNG buffer to raw pixel data. ~80KB. Safety net for non-JPEG photos.

**Rejected:** `sharp` (~28MB + native libvips binary). Not used anywhere in the monorepo. Too heavy for a single P2 field type. Would cause Docker/CI build complications.

**Flow:**

```
Telegram photo (Buffer)
  → Detect format (JPEG magic bytes: 0xFF 0xD8 / PNG magic bytes: 0x89 0x50)
  → jpeg-js.decode(buffer) or PNG.sync.read(buffer)
  → Extract { data: Uint8ClampedArray, width, height }
  → jsQR(pixels, width, height)
  → Result<string, AppError>
```

**Error codes:** `INPUT_ENGINE_ERRORS.QR_DECODE_FAILED` (decode error), `INPUT_ENGINE_ERRORS.QR_NOT_FOUND` (no QR in image).

### D2: Testing Strategy — Three-Layer Approach

**Context:** grammY conversations use generator functions with yield-based control flow. Field handlers interact with `conversation.form.build()`, `conversation.menu()`, `conversation.checkpoint()`. How to unit test?

**Decision:** Three testing layers:

1. **Pure function tests (70%)** — Test `validate(input, metadata)` and `parseResponse(message, metadata)` directly. No grammY mocks. These are pure functions that take data and return `Result<T, AppError>`.

2. **Conversation mock tests (20%)** — Test `render(conversation, ctx, metadata, formData)` with mock objects:

   ```typescript
   const mockConversation = {
     form: {
       build: vi.fn().mockImplementation(async (config) => {
         // Simulate user input by calling config.validate()
         const result = config.validate(mockCtx);
         if (result.ok) return result.value;
         throw new Error('validation failed');
       }),
     },
     waitFor: vi.fn().mockResolvedValue(mockCtx),
     waitForCallbackQuery: vi.fn().mockResolvedValue(mockCtx),
     external: vi.fn().mockImplementation((fn) => fn(mockCtx)),
     checkpoint: vi.fn().mockReturnValue({}),
     menu: vi.fn().mockReturnValue(mockMenuBuilder),
   };
   ```

3. **FormRunner integration tests (10%)** — Mock the full field handler registry and conversation. Test orchestration: field iteration, conditional evaluation, partial save, cancel/timeout.

**Mock patterns follow ai-core:** Factory functions (`createMockConversation()`, `createMockCtx()`, `createMockMetadata()`), `vi.clearAllMocks()` in `beforeEach`, `as never` casts for typed parameters.

### D3: Zod 4 Global Registry — No Cleanup Needed

**Context:** `z.globalRegistry` is a singleton. Tests that register schemas could pollute subsequent tests.

**Decision:** No cleanup necessary. Zod 4's `z.globalRegistry.register(schema, metadata)` uses the schema object itself as the key (reference-based, similar to WeakMap). Each test creates new schema instances via `z.object({...})`, producing unique references. No cross-test pollution.

```typescript
// Each test gets a unique schema reference
it('validates ShortText metadata', () => {
  const schema = z.object({ name: z.string() });
  z.globalRegistry.register(schema, { fieldType: 'ShortText', label: 'test.name' });
  // SchemaValidator sees this schema only
});
```

### D4: Conversations Storage Adapter — `VersionedStateStorage<string, ConversationData>`

**Context:** `@grammyjs/conversations` v2.1.1 requires a storage adapter for persisting conversation state between updates.

**Decision:** Implement `VersionedStateStorage<string, ConversationData>` from `@grammyjs/conversations`. Three methods:

```typescript
interface VersionedStateStorage<K, S> {
  read(key: K): MaybePromise<VersionedState<S> | undefined>;
  write(key: K, state: VersionedState<S>): MaybePromise<void>;
  delete(key: K): MaybePromise<void>;
}
```

Where `VersionedState<S> = { version: [number, string | number]; state: S }`.

**Implementation details:**

- `read(key)` — calls `cacheService.get<VersionedState<ConversationData>>(cacheKey)`, unwraps `Result`, returns value or `undefined`
- `write(key, state)` — calls `cacheService.set(cacheKey, state, ttlSeconds)`, unwraps `Result`, swallows errors with logging
- `delete(key)` — calls `cacheService.del(cacheKey)`, unwraps `Result`, swallows errors with logging
- Cache key format: `ie:conv:{key}` (key is chatId from grammY)
- TTL: configurable, default 86400 (24h)
- **Graceful degradation (Rule XXXII):** If CacheService `read` fails, return `undefined` (conversation restarts from scratch). If `write` fails, log warning + emit `input-engine.storage.degraded` event. Conversation continues in-memory via grammY defaults.

**Important:** This adapter does NOT return `Result<T, AppError>` -- it implements grammY's interface which expects plain values. Internally, `Result` is used for CacheService calls and errors are handled by falling back to in-memory behavior.

### D5: Contact Field — ReplyKeyboardMarkup within `render()`

**Context:** The Contact field requires `ReplyKeyboardMarkup` with `request_contact: true` (Telegram API requirement). All other fields use inline keyboards.

**Decision:** Handle within the Contact handler's `render()` method. Transparent to FormRunner.

```typescript
// In contact.field.ts render():
await ctx.reply(t(metadata.label), {
  reply_markup: {
    keyboard: [[{ text: t('input-engine.contact.share_button'), request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
});

const contactCtx = await conversation.waitFor(':contact');

// Remove reply keyboard after receiving contact
await contactCtx.reply(t('input-engine.contact.received'), {
  reply_markup: { remove_keyboard: true },
});
```

The `parseResponse()` method extracts `phone_number`, `first_name`, `last_name`, `user_id` from `message.contact`. No changes to the `FieldHandler` interface or `FormRunner`.

### D6: Callback Data — `crypto.randomUUID().slice(0, 8)` + Numeric Index

**Context:** Telegram limits callback data to 64 bytes. The original `ie:{formId}:{fieldName}:{value}` format is too long with UUID formIds and string field names.

**Decision:** Use compressed identifiers:

- `formId`: `crypto.randomUUID().slice(0, 8)` — 8-char hex from Node.js built-in. No nanoid dependency. Collision risk negligible for concurrent form instances.
- `fieldName`: numeric index (position in form schema, 1-3 chars)
- `value`: compressed via `encodeCallbackData()` from `@tempot/ux-helpers`

**Format:** `ie:{8charId}:{fieldIndex}:{value}`

**Budget analysis:**

- `ie:` = 3 bytes
- formId = 8 bytes
- `:` = 1 byte
- fieldIndex = 1-3 bytes
- `:` = 1 byte
- **Remaining for value: 47-49 bytes** (sufficient for all field types)

**MultiStepChoice:** Value encodes `L{level}:{optionIndex}` = `L0:2` (4 bytes). Even 3-level deep: `L2:15` = 5 bytes.

**SearchableList:** Stores option index (small integer), not option text.

### D7: NationalID Governorate Mapping — Hardcoded Const

**Context:** Egyptian National ID digits 8-9 map to governorate names.

**Decision:** Hardcode as `const` in `national-id.field.ts`. This is ID-structure parsing logic (stable, defined by Civil Status Authority), not geographic data from `@tempot/regional-engine`.

```typescript
const GOVERNORATE_CODES: Record<string, string> = {
  '01': 'Cairo',
  '02': 'Alexandria',
  '03': 'Port Said',
  '04': 'Suez',
  '11': 'Damietta',
  '12': 'Dakahlia',
  // ... ~27 entries
} as const;
```

When `metadata.extractData === true`, the handler returns `NationalIDResult` with `birthDate`, `governorate`, `gender`, and `isValid` (checksum). When `false`, returns just the validated string.

### D8: IBAN Validation — Self-Implemented MOD-97 + Country Length Map

**Context:** IBAN validation requires MOD-97 checksum + country-specific length verification.

**Decision:** Implement MOD-97 in ~20 lines. No `ibantools` dependency (avoids adding a package for simple arithmetic).

```typescript
const IBAN_LENGTHS: Record<string, number> = {
  EG: 29,
  SA: 24,
  AE: 23,
  BH: 22,
  KW: 30,
  QA: 29,
  OM: 23,
  JO: 30,
  IQ: 23,
  LB: 28,
  DE: 22,
  GB: 22,
  FR: 27,
  IT: 27,
  ES: 24,
  // ... ~75 SWIFT countries
} as const;

function validateMOD97(iban: string): boolean {
  // 1. Move first 4 chars to end
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  // 2. Replace letters with numbers (A=10...Z=35)
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  // 3. Piece-wise MOD-97 (handles numbers > Number.MAX_SAFE_INTEGER)
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = String(parseInt(block, 10) % 97) + remainder.slice(block.length);
  }
  return parseInt(remainder, 10) % 97 === 1;
}
```

**Validation flow:**

1. Strip spaces, uppercase
2. Regex check: `^[A-Z]{2}[0-9]{2}[A-Z0-9]+$`
3. Look up country in `IBAN_LENGTHS`, verify total length
4. MOD-97 checksum
5. Return `ok(normalizedIban)` or `err()` with `IBAN_INVALID_FORMAT` or `IBAN_INVALID_CHECKSUM`

### D9: Toggle Guard — Separate `input-engine.guard.ts` File

**Context:** The plan.md places the toggle guard in `input-engine.config.ts`, but ai-core uses a separate `ai-core.guard.ts` file.

**Decision:** Follow ai-core pattern. Create `input-engine.guard.ts` with:

```typescript
export function guardEnabled<T>(
  enabled: boolean,
  fn: () => AsyncResult<T, AppError>,
): AsyncResult<T, AppError> {
  if (!enabled) {
    return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.DISABLED)));
  }
  return fn();
}
```

Config loading stays in `input-engine.config.ts` (reads `TEMPOT_INPUT_ENGINE` env var). Guard function in its own file for clean separation.

## Architecture

### Component Hierarchy

```
runForm() API
  └── guardEnabled() ─── input-engine.guard.ts
  └── SchemaValidator ─── runner/schema.validator.ts
  │     ├── Validates Zod 4 registry metadata
  │     ├── Checks duplicate field names
  │     ├── Detects circular conditional deps
  │     └── Verifies i18n key existence
  └── FormRunner ─── runner/form.runner.ts
        ├── ConversationsStorageAdapter ─── storage/conversations-storage.adapter.ts
        │     └── CacheService (from @tempot/shared)
        ├── FieldHandlerRegistry ─── fields/field.handler.ts
        │     └── Map<FieldType, FieldHandler> — 39 handlers
        ├── Callback data utils ─── utils/callback-data.utils.ts
        │     └── encodeCallbackData/decodeCallbackData (from @tempot/ux-helpers)
        └── Event emission (fire-and-log via InputEngineEventBus)
```

### Field Handler Categories (39 total)

| Category    | Count | Handlers                                                    |
| ----------- | ----- | ----------------------------------------------------------- |
| Text        | 6     | ShortText, LongText, Email, Phone, URL, RegexValidated      |
| Numbers     | 5     | Integer, Float, Currency, Percentage, CurrencyAmount        |
| Choice      | 4     | SingleChoice, MultipleChoice, BooleanToggle, SearchableList |
| Time/Place  | 5     | DatePicker, TimePicker, Location, DateRange, SchedulePicker |
| Media       | 6     | Photo, Document, Video, Audio, FileGroup, Contact           |
| Smart       | 2     | ConditionalField, AIExtractorField                          |
| Geo         | 2     | GeoSelectField, GeoAddressField                             |
| Identity    | 4     | NationalID, PassportNumber, IBAN, EgyptianMobile            |
| Interactive | 5     | StarRating, MultiStepChoice, QRCode, Toggle, Tags           |

### Dependencies

**Required (workspace):**

- `@tempot/shared` — CacheService, AppError, AsyncResult, Result
- `@tempot/ux-helpers` — createInlineKeyboard, buildPagination, encodeCallbackData, EMOJI_NUMBERS, ROW_LIMITS
- `@tempot/i18n-core` — t() translation function
- `@tempot/session-manager` — activeConversation tracking
- `@tempot/event-bus` — event type registration only (TempotEvents interface)

**Required (npm):**

- `@grammyjs/conversations` ^2.1.1 — conversation plugin
- `grammy` ^1.41.1 — bot framework (peer dep)
- `zod` ^4.3.6 — schema validation with registry
- `neverthrow` 8.2.0 — Result pattern
- `jsqr` ^1.4.0 — QR code decoding (QRCode field only)
- `jpeg-js` (latest) — JPEG to raw pixels (QRCode field only)
- `pngjs` (latest) — PNG to raw pixels (QRCode field only)

**Optional (structural interfaces in input-engine.contracts.ts):**

- `StorageEngineClient` — for media upload (Photo, Document, Video, Audio, FileGroup fields)
- `AIExtractionClient` — for AI-powered field extraction (AIExtractorField)
- `RegionalClient` — for geographic data (GeoSelectField, GeoAddressField) and date formatting (DatePicker, TimePicker)

### File Structure

```
packages/input-engine/
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts                                    # barrel exports
│   ├── input-engine.types.ts                       # types + defaults
│   ├── input-engine.contracts.ts                   # structural interfaces
│   ├── input-engine.errors.ts                      # error codes
│   ├── input-engine.config.ts                      # config loading
│   ├── input-engine.guard.ts                       # toggle guard
│   ├── storage/
│   │   └── conversations-storage.adapter.ts        # grammY storage adapter
│   ├── runner/
│   │   ├── schema.validator.ts                     # form schema validation
│   │   └── form.runner.ts                          # form lifecycle orchestration
│   ├── utils/
│   │   └── callback-data.utils.ts                  # callback data encoding
│   ├── fields/
│   │   ├── field.handler.ts                        # interface + registry
│   │   ├── text/
│   │   │   ├── short-text.field.ts
│   │   │   ├── long-text.field.ts
│   │   │   ├── email.field.ts
│   │   │   ├── phone.field.ts
│   │   │   ├── url.field.ts
│   │   │   └── regex-validated.field.ts
│   │   ├── numbers/
│   │   │   ├── integer.field.ts
│   │   │   ├── float.field.ts
│   │   │   ├── currency.field.ts
│   │   │   ├── percentage.field.ts
│   │   │   └── currency-amount.field.ts
│   │   ├── choice/
│   │   │   ├── single-choice.field.ts
│   │   │   ├── multiple-choice.field.ts
│   │   │   ├── boolean-toggle.field.ts
│   │   │   └── searchable-list.field.ts
│   │   ├── time-place/
│   │   │   ├── date-picker.field.ts
│   │   │   ├── time-picker.field.ts
│   │   │   ├── location.field.ts
│   │   │   ├── date-range.field.ts
│   │   │   └── schedule-picker.field.ts
│   │   ├── media/
│   │   │   ├── photo.field.ts
│   │   │   ├── document.field.ts
│   │   │   ├── video.field.ts
│   │   │   ├── audio.field.ts
│   │   │   ├── file-group.field.ts
│   │   │   └── contact.field.ts
│   │   ├── smart/
│   │   │   ├── conditional.field.ts
│   │   │   └── ai-extractor.field.ts
│   │   ├── geo/
│   │   │   ├── geo-select.field.ts
│   │   │   └── geo-address.field.ts
│   │   ├── identity/
│   │   │   ├── national-id.field.ts
│   │   │   ├── passport.field.ts
│   │   │   ├── iban.field.ts
│   │   │   └── egyptian-mobile.field.ts
│   │   └── interactive/
│   │       ├── star-rating.field.ts
│   │       ├── multi-step-choice.field.ts
│   │       ├── qr-code.field.ts
│   │       ├── toggle.field.ts
│   │       └── tags.field.ts
└── tests/
    └── unit/
        ├── input-engine.types.test.ts
        ├── input-engine.config.test.ts
        ├── input-engine.guard.test.ts
        ├── conversations-storage.adapter.test.ts
        ├── field.handler.test.ts
        ├── schema.validator.test.ts
        ├── form.runner.test.ts
        ├── callback-data.utils.test.ts
        ├── short-text.field.test.ts
        ├── long-text.field.test.ts
        ├── email.field.test.ts
        ├── phone.field.test.ts
        ├── url.field.test.ts
        ├── regex-validated.field.test.ts
        ├── integer.field.test.ts
        ├── float.field.test.ts
        ├── currency.field.test.ts
        ├── percentage.field.test.ts
        ├── currency-amount.field.test.ts
        ├── single-choice.field.test.ts
        ├── multiple-choice.field.test.ts
        ├── boolean-toggle.field.test.ts
        ├── searchable-list.field.test.ts
        ├── date-picker.field.test.ts
        ├── time-picker.field.test.ts
        ├── location.field.test.ts
        ├── date-range.field.test.ts
        ├── schedule-picker.field.test.ts
        ├── photo.field.test.ts
        ├── document.field.test.ts
        ├── video.field.test.ts
        ├── audio.field.test.ts
        ├── file-group.field.test.ts
        ├── contact.field.test.ts
        ├── conditional.field.test.ts
        ├── ai-extractor.field.test.ts
        ├── geo-select.field.test.ts
        ├── geo-address.field.test.ts
        ├── national-id.field.test.ts
        ├── passport.field.test.ts
        ├── iban.field.test.ts
        ├── egyptian-mobile.field.test.ts
        ├── star-rating.field.test.ts
        ├── multi-step-choice.field.test.ts
        ├── qr-code.field.test.ts
        ├── toggle.field.test.ts
        └── tags.field.test.ts
```

### FormRunner Lifecycle (8 Steps)

1. **Toggle guard** — `guardEnabled(config.enabled, fn)`. Returns `err(DISABLED)` if `TEMPOT_INPUT_ENGINE=false`.
2. **Schema validation** — `SchemaValidator.validate(formSchema)`. Checks duplicate names, missing i18n keys, circular conditions.
3. **Session lock** — Set `activeConversation` on session-manager. Prevents concurrent forms.
4. **Field iteration** — Loop through form schema fields in order. For each field:
   a. **Condition evaluation** — Check `FieldCondition` against collected `formData`. Skip if condition not met.
   b. **Render** — Call `handler.render(conversation, ctx, metadata, formData)`. Handler sends prompt + keyboard.
   c. **Parse response** — Call `handler.parseResponse(message, metadata)`. Extract typed value from user message.
   d. **Validate** — Call `handler.validate(input, metadata)`. Return `Result<T, AppError>`. On error, show i18n message via `otherwise` callback, re-prompt (up to `maxRetries`).
5. **Partial save** — After each field, save `formData` to conversations storage (automatic via grammY storage adapter).
6. **Event emission** — `input-engine.field.validated` per field, `input-engine.form.completed` on finish, `input-engine.form.resumed` when resuming from partial save.
7. **Session unlock** — Clear `activeConversation`.
8. **Return** — `ok(formData)` as typed `Record<string, unknown>`.

**Cancel/Timeout handling:**

- Cancel: `/cancel` command detected via `conversation.waitForCommand('cancel')` check. Emits `input-engine.form.cancelled` with `reason: 'user_cancel'`.
- Timeout: `maxMillisecondsToWait` per-conversation config. On timeout, partial data is preserved in storage. Emits `input-engine.form.cancelled` with `reason: 'timeout'`.

### Event Registration

Five events registered in `packages/event-bus/src/event-bus.events.ts` with inline payload types:

```typescript
// Addition (not in spec.md, approved during design review)
'input-engine.form.started': { formId: string; userId: string; chatId: number; fieldCount: number; timestamp: Date };

// From spec.md (source of truth for payloads)
'input-engine.form.completed': { formId: string; userId: string; fieldCount: number; durationMs: number; hadPartialSave: boolean };
'input-engine.form.cancelled': { formId: string; userId: string; fieldsCompleted: number; totalFields: number; reason: 'user_cancel' | 'timeout' | 'max_retries' };
'input-engine.form.resumed': { formId: string; userId: string; resumedFromField: number; totalFields: number };
'input-engine.field.validated': { formId: string; userId: string; fieldType: string; fieldName: string; valid: boolean; retryCount: number };
```

## Testing Conventions

Following ai-core patterns:

- **Naming:** `{feature}.field.test.ts` in `tests/unit/`
- **Mocks:** Factory functions at top of file (`createMockConversation()`, `createMockCtx()`, `createMockMetadata()`)
- **Assertions:** `result.isOk()`, `result.isErr()`, `result._unsafeUnwrap()`, `result._unsafeUnwrapErr().code`
- **Isolation:** `vi.clearAllMocks()` in `beforeEach`
- **ESM imports:** `.js` extensions in import paths
- **Coverage:** `serviceCoverageThresholds` from shared vitest config base
