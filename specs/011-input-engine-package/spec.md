# Feature Specification: Input Engine (Dynamic Form Engine)

**Feature Branch**: `011-input-engine-package`  
**Created**: 2026-03-19  
**Clarified**: 2026-04-03  
**Status**: Complete  
**Input**: User description: "Build the @tempot/input-engine package — a dynamic multi-step conversation and form handling engine built on @grammyjs/conversations v2.1.1 and Zod 4 with Registry. Covers 39 field types across 9 categories, partial save via custom conversations storage adapter, cancel/timeout, conditional fields, AI-powered extraction, and geo selection."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Simple Form Collection (Priority: P1)

As a module developer, I want to define a form schema using Zod 4 with Registry metadata and call `runForm()` to have the bot automatically handle the entire multi-step conversation — asking questions, validating input, displaying i18n error messages, and returning type-safe data — so that I can collect structured data without writing boilerplate conversation logic.

**Why this priority**: Core value proposition of input-engine (Architecture Spec §7.3). Every module that collects user input depends on this. Without it, every module must manually handle grammY Conversations, Zod validation, i18n prompts, and UI rendering — massive duplication.

**Independent Test**: Define a 3-field schema (ShortText + Integer + SingleChoice), call `runForm()`, and verify the bot asks each question in order, validates input with i18n error messages, and returns a type-safe `Result<FormData, AppError>`.

**Acceptance Scenarios**:

1. **Given** a schema with `ShortText` (name) and `Integer` (age, min: 18), **When** the developer calls `runForm(conversation, ctx, schema)`, **Then** the bot asks for the name via i18n prompt, waits for text input, asks for the age, validates it is ≥ 18 via Zod, and returns `ok({ name: string, age: number })`.
2. **Given** invalid input (text "abc" for an Integer field), **When** the user responds, **Then** the bot displays an i18n error message from the Zod Registry metadata and re-asks the same question.
3. **Given** a `SingleChoice` field with 4 options, **When** the field is rendered, **Then** the bot uses `createInlineKeyboard` from `@tempot/ux-helpers` to display option buttons.
4. **Given** a `BooleanToggle` field, **When** the field is rendered, **Then** the bot shows exactly two inline buttons (yes/no) using `createInlineKeyboard`.

---

### User Story 2 — Complex Form with Partial Save (Priority: P1)

As a user filling out a long form (7+ fields), I want my progress saved automatically after each valid field so that if the bot restarts or I come back later, I can resume from where I left off instead of starting over.

**Why this priority**: Critical for user trust and experience with long forms. Without partial save, any interruption (bot restart, network issue, user leaving) wastes all prior input. Required by Constitution Rule XXXII (Redis degradation) and Architecture Spec §7.3.7.

**Independent Test**: Start a 5-field form with `partialSave: true`, complete 3 fields, simulate bot restart, call `runForm()` again, and verify the form resumes from field 4 with fields 1-3 pre-filled.

**Acceptance Scenarios**:

1. **Given** a form schema with `partialSave: true`, **When** a user completes field 3 of 7, **Then** fields 1-3 are saved to Redis via the custom conversations storage adapter using `@tempot/shared` CacheService.
2. **Given** a saved partial form, **When** the user returns and `runForm()` is called, **Then** the form uses `conversation.checkpoint()` and `conversation.rewind()` to resume from the next unanswered field.
3. **Given** `partialSaveTTL: 86400000` (24h default), **When** the TTL expires, **Then** the partial save is deleted from Redis and the form starts from scratch.
4. **Given** Redis is unavailable (degradation), **When** partial save fails, **Then** the form continues without saving (graceful degradation per Rule XXXII) and logs a warning.

---

### User Story 3 — AIExtractorField (Priority: P2)

As a user, I want to send a single free-text or voice message like "اسمي أحمد وعمري 30 وأسكن في القاهرة" and have the bot extract multiple field values at once so that I don't have to answer each question individually.

**Why this priority**: High-end UX feature (Architecture Spec §7.3.8) that leverages ai-core. Depends on `@tempot/ai-core` being available. Optional integration — forms work without it.

**Independent Test**: Define a schema with AIExtractorField mapping to 3 sub-fields (name, age, city), send a natural language message, and verify the extracted values are shown for confirmation before acceptance.

**Acceptance Scenarios**:

1. **Given** an `AIExtractorField` with `targetFields: ['name', 'age', 'city']`, **When** the user sends "اسمي أحمد وعمري 30 وأسكن في القاهرة", **Then** the engine uses `@tempot/ai-core` IntentRouter or ResilienceService to extract `{ name: 'أحمد', age: 30, city: 'القاهرة' }` and displays them for confirmation.
2. **Given** partial extraction (only name and age extracted), **When** the user confirms, **Then** the engine accepts the extracted values and asks for the missing fields (city) manually.
3. **Given** AI provider is unavailable (circuit breaker open), **When** `AIExtractorField` is reached, **Then** the engine falls back to manual step-by-step input for each target field (AI Degradation Rule XXXIII) and notifies the user via i18n.
4. **Given** the user rejects the AI extraction, **When** the user taps "reject", **Then** the engine switches to manual step-by-step input for all target fields.

---

### User Story 4 — GeoSelectField (Priority: P2)

As a user, I want to select my geographical location (state/city) from a hierarchical menu powered by `@tempot/regional-engine` so that the bot can use my location for region-specific features.

**Why this priority**: Depends on `@tempot/regional-engine` which provides `GeoSelectField`, `GeoOption`, `GeoState`, `GeoCity`, and `DateService`. Common requirement for location-aware bots.

**Independent Test**: Define a schema with `GeoSelectField`, interact with the hierarchical state → city selection, and verify the selected `GeoOption` is returned.

**Acceptance Scenarios**:

1. **Given** a `GeoSelectField`, **When** the field is rendered, **Then** the bot displays states from `@tempot/regional-engine` as an inline keyboard with pagination via `buildPagination` from `@tempot/ux-helpers`.
2. **Given** the user selects a state, **When** the state has cities, **Then** the bot displays the cities within that state as a second-level inline keyboard.
3. **Given** the user selects a city, **When** the selection is confirmed, **Then** the field returns a `GeoOption` object with state and city data.

---

### User Story 5 — Identity and Interactive Fields (Priority: P2)

As a module developer, I want specialized field types for collecting identity documents (NationalID with data extraction, PassportNumber, IBAN, EgyptianMobile) and interactive data (StarRating, MultiStepChoice, QRCode, Toggle, Tags) so that I can build comprehensive forms without custom validation logic.

**Why this priority**: Extends the field library beyond basic types. Identity fields require region-specific validation (Egyptian 14-digit national ID with checksum, IBAN per ISO 13616, Egyptian mobile with operator detection). Interactive fields provide rich Telegram UX patterns.

**Independent Test**: Define a form with NationalID (extractData: true) + IBAN + StarRating + Tags fields, verify the national ID is validated with checksum and data extracted, IBAN validated per ISO 13616, star rating renders as emoji buttons, and tags supports add/remove/confirm flow.

**Acceptance Scenarios**:

1. **Given** a `NationalID` field with `extractData: true`, **When** the user enters a valid 14-digit number, **Then** the engine validates the format and checksum, extracts birth date, governorate, and gender, and returns a `NationalIDResult` object. **When** the user enters fewer digits, **Then** the engine shows an i18n error and re-asks.
2. **Given** a `NationalID` field with `extractData: false` (default), **When** the user enters a valid 14-digit number, **Then** the engine returns a plain string (backward compatible).
3. **Given** a `StarRating` field with `min: 1, max: 5`, **When** the field is rendered, **Then** the bot displays 5 inline buttons using `EMOJI_NUMBERS` from `@tempot/ux-helpers`.
4. **Given** a `MultiStepChoice` field with 3 levels (category → subcategory → item), **When** the user makes selections, **Then** each level is presented as a paginated inline keyboard, and the final selection includes the full path.
5. **Given** an `IBAN` field with `defaultCountry: 'EG'`, **When** the user enters "EG800002000156789012345678901", **Then** the engine validates the country code, check digits, and BBAN length (29 for Egypt). **When** the user enters an IBAN with invalid check digits, **Then** the engine shows an i18n error.
6. **Given** an `EgyptianMobile` field, **When** the field is rendered, **Then** the bot shows an inline keyboard for country code selection (+20 default). **When** the user enters "01012345678", **Then** the engine detects Vodafone as the operator and returns `{ number: '01012345678', countryCode: '+20', operator: 'Vodafone' }`.
7. **Given** a `Tags` field with `minTags: 1, maxTags: 5`, **When** the user adds 3 tags by typing and taps "done", **Then** the engine returns `['tag1', 'tag2', 'tag3']`. **When** the user tries to add a duplicate tag, **Then** the engine rejects it with an i18n message.

---

### User Story 6 — Media Fields with FileGroup (Priority: P2)

As a user, I want to upload photos, documents, videos, and audio files as part of a form, with automatic validation of file type, size, and dimensions, so that the bot can collect media assets safely.

**Why this priority**: Media collection is common in enterprise bots (receipts, identity documents, product photos). Requires optional integration with `@tempot/storage-engine` for upload/validation.

**Independent Test**: Define a form with a Photo field (maxSizeKB: 5000, allowedTypes: ['image/jpeg', 'image/png']), upload a valid and invalid file, and verify validation and upload behavior.

**Acceptance Scenarios**:

1. **Given** a `Photo` field with `maxSizeKB: 5000`, **When** the user sends a JPEG under 5MB, **Then** the engine validates the file and stores it via `@tempot/storage-engine` (if available), returning the file reference.
2. **Given** a `Document` field with `allowedExtensions: ['.pdf', '.xlsx']`, **When** the user sends a `.docx` file, **Then** the engine rejects it with an i18n error listing the allowed extensions.
3. **Given** a `FileGroup` field with `minFiles: 2, maxFiles: 5`, **When** the user has uploaded 1 file, **Then** the engine shows a "add more or finish" prompt. **When** the user finishes with 2+ files, **Then** the field returns an array of file references.
4. **Given** `@tempot/storage-engine` is not available, **When** a media field is used, **Then** the engine returns the raw Telegram file metadata without upload validation (graceful degradation).

---

## Edge Cases

1. **Conversation Timeout**: User stops responding mid-form. After `maxMilliseconds` (default 10 minutes, configurable per form), the conversation auto-cancels and returns `err(AppError('input-engine.form.timeout'))`. Partial save data is preserved for resume.

2. **User Cancellation via /cancel**: User types `/cancel` at any point. The engine immediately terminates via `conversation.halt()` or equivalent and returns `err(AppError('input-engine.form.cancelled'))`. Partial save data is preserved.

3. **Bot Restart Mid-Form**: Bot process restarts while user is on field 5 of 10. With `partialSave: true`, the custom conversations storage adapter restores the conversation state. The form resumes from field 6 (or the last checkpointed field). Without partial save, the form starts over.

4. **Invalid Input Retry Limit**: User repeatedly enters invalid data. After `maxRetries` (default 3, configurable per field), the engine either skips the field (if optional) or cancels the form with `err(AppError('input-engine.field.max_retries'))`.

5. **Redis Unavailable During Partial Save**: CacheService from `@tempot/shared` handles Redis degradation (Rule XXXII). Falls back to in-memory cache. Partial save works in-process but not across restarts. Warning logged.

6. **Empty Optional Fields**: User skips an optional field (sends empty or taps "skip" button). The field value is set to `undefined` in the result. Zod schema must mark the field as `.optional()`.

7. **Inline Keyboard Callback Collision**: Multiple forms running for different users. Callback data uses `encodeCallbackData` from `@tempot/ux-helpers` with form-instance-specific prefixes to avoid collision.

8. **SearchableList with 10,000+ Items**: Items are loaded lazily with server-side filtering and `buildPagination` from `@tempot/ux-helpers`. Only matching items are sent to the client. Never loads all items into memory.

9. **DatePicker Edge Cases**: February 29 on non-leap years, timezone differences (uses `DateService` from `@tempot/regional-engine`), min/max date constraints. Calendar UI built with inline keyboard buttons.

10. **TimePicker Format Ambiguity**: User enters "3:00" — AM or PM? Engine uses 24-hour format by default. If `use12Hour: true`, renders AM/PM toggle buttons.

11. **Location Field Without GPS**: User's device doesn't support GPS sharing. Engine provides fallback: text input for address with optional geocoding.

12. **MultipleChoice — No Selection Then Confirm**: User taps "confirm" without selecting any option. If `minSelections: 1` (default), engine shows i18n error. If `minSelections: 0`, returns empty array.

13. **AIExtractorField — Malformed AI Response**: AI returns unparseable JSON or hallucinated values. Engine validates extracted values against Zod schemas of target fields. Invalid extractions are treated as missing — user is asked manually.

14. **Currency Field — Locale-Specific Formatting**: User enters "1,000.50" (English) or "١٬٠٠٠٫٥٠" (Arabic). Engine normalizes to numeric value based on user's locale from i18n settings.

15. **Photo Field — Telegram Compression**: Telegram compresses photos by default. Engine requests uncompressed version via `document` type when `preserveQuality: true` is set in field config.

16. **Concurrent Form Instances**: Same user starts two forms in different chats/groups. Each form instance has a unique ID. Session-manager tracks `activeConversation` per chat, not per user globally.

17. **Form Schema Validation at Definition Time**: Invalid schema (duplicate field names, missing i18n keys, circular conditional dependencies) is caught at `runForm()` call time before any user interaction, returning `err(AppError('input-engine.schema.invalid'))`.

18. **FileGroup — Upload Timeout Per File**: Each file in a FileGroup has individual upload timeout. If one file times out, the user can retry that specific file without losing previously uploaded files.

19. **ConditionalField — Circular Dependencies**: Field A depends on Field B which depends on Field A. Detected at schema validation time. Returns `err(AppError('input-engine.schema.circular_dependency'))`.

20. **MultiStepChoice — Deep Nesting (5+ Levels)**: Engine supports arbitrary depth but warns developers if nesting exceeds 5 levels. UX degrades with deep nesting. Breadcrumb navigation shows current path.

21. **StarRating — Custom Scale**: Developer sets `min: 0, max: 10`. Engine renders paginated number buttons using `EMOJI_NUMBERS` from `@tempot/ux-helpers`, splitting into rows per `ROW_LIMITS`.

22. **Toggle Guard — Disabled State**: When `TEMPOT_INPUT_ENGINE=false`, `runForm()` immediately returns `err(AppError('input-engine.disabled'))` without initializing any conversation or storage. No side effects.

23. **QRCode — Decode Failure**: User sends a blurry photo or a photo with no QR code. Engine fails to decode. Shows i18n error asking user to retry with a clearer photo. After `maxRetries`, field fails per standard retry logic.

24. **QRCode — Format Mismatch**: User sends a QR code that decodes to a URL but `expectedFormat: 'json'`. Engine rejects the decoded data with an i18n error specifying the expected format.

25. **IBAN — Checksum Validation**: User enters an IBAN with correct format but invalid MOD-97 check digits. Engine rejects with i18n error. IBAN validation uses ISO 7064 MOD 97-10 algorithm.

26. **IBAN — Country Not Allowed**: User enters a valid GB IBAN but `allowedCountries: ['EG', 'SA']`. Engine rejects with i18n error listing allowed countries.

27. **EgyptianMobile — Unknown Prefix**: User enters "01612345678" (016 is not a known operator prefix). Engine validates the number format but sets `operator` to `undefined` in the result.

28. **NationalID — Checksum Failed**: User enters 14 digits that pass the regex but fail checksum validation. Engine rejects with i18n error about invalid national ID.

29. **NationalID — Future Birth Date**: Extracted birth date from digits 1-7 is in the future. Engine rejects with i18n error.

30. **Tags — Duplicate Rejection**: User types a tag that already exists in the collected tags. Engine shows i18n error and does not add the duplicate. Case-insensitive comparison.

31. **Tags — Max Length Exceeded**: User types a tag longer than `maxTagLength`. Engine shows i18n error with the maximum allowed length.

32. **SchedulePicker — No Available Slots**: User selects a date that has zero available time slots. Engine shows i18n message "no slots available for this date" and asks user to pick a different date.

33. **SchedulePicker — Slot Becomes Unavailable**: Between rendering slots and user selection, the slot becomes unavailable (race condition with dynamic `slotDataSource`). Engine re-fetches slots and shows error if selected slot is no longer available.

34. **Contact — No Contact Shared**: User sends a text message instead of sharing a contact. Engine shows i18n error explaining how to share a contact via the keyboard button.

35. **CurrencyAmount — Arabic Numeral Normalization**: User enters "١٢٣٫٥٠" (Arabic numerals). Engine normalizes to 123.50 before validation. Supports Eastern Arabic (٠-٩) and Western Arabic (0-9) numerals.

## Design Decisions & Clarifications

### D1. Build on @grammyjs/conversations v2.1.1

input-engine uses `@grammyjs/conversations` v2.1.1 native APIs directly. No abstraction layer on top:

- `conversation.form.build()` for field rendering
- `conversation.menu()` for interactive inline keyboards
- `conversation.checkpoint()` and `conversation.rewind()` for partial save resume
- `maxMilliseconds` for form-level timeout
- `otherwise` callbacks for handling unexpected messages during field input
- `conversation.external()` for calling external services (CacheService, storage-engine, ai-core)

This is NOT an abstraction over conversations — it is a structured use of the conversations API for form-specific patterns.

### D2. Zod 4 with Registry for Field Metadata

Field metadata (type, i18n key, conditions, rendering options) is stored in the Zod 4 global registry:

```typescript
import { z } from 'zod';

const nameField = z.string().min(2).max(100);
z.globalRegistry.register(nameField, {
  fieldType: 'ShortText',
  i18nKey: 'fields.name',
  conditions: [],
});
```

This replaces the custom `FormSchema` configuration object from the architecture spec. Benefits: validation and metadata are co-located, schemas are standard Zod, no custom DSL.

### D3. All 39 Field Types in One Package

9 categories, 39 field types:

| Category    | Count | Field Types                                                 |
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

> **Note**: The architecture spec §7.3.4 lists 22 field types. This spec extends to 39 by splitting combined types (Video/Audio → separate), adding DateRange, FileGroup, GeoAddressField, NationalID (with optional checksum + data extraction), PassportNumber, StarRating, MultiStepChoice, SchedulePicker, IBAN, EgyptianMobile, CurrencyAmount, QRCode, Toggle, and Tags. The Contact type from §7.3.4 is RESTORED as a dedicated field type in the Media category (Telegram contact sharing via `message.contact`).

### D4. Conversations Storage Adapter for Partial Save

A custom Redis storage adapter using `@tempot/shared` CacheService replaces the default conversations storage. This adapter:

- Implements the `@grammyjs/conversations` storage interface
- Uses `CacheService.set<T>()` and `CacheService.get<T>()` for persistence
- Respects `partialSaveTTL` for automatic expiry
- Falls back gracefully when Redis is unavailable (Rule XXXII) — CacheService handles this internally

NOT `@grammyjs/storage-redis` (different purpose — that's for session storage, not conversations state).
NOT session-manager metadata (conversations have their own state management separate from session data).

### D5. Result Pattern via neverthrow

All public methods return `Result<T, AppError>` or `AsyncResult<T, AppError>` via `neverthrow`. The architecture spec §7.3.3 uses `{ success: true, data }` / `{ success: false, reason }` — this is WRONG per Constitution Rule XXI. Corrected to:

- Success: `ok(formData)` where `formData` is the type-safe validated data
- Cancel: `err(AppError('input-engine.form.cancelled'))`
- Timeout: `err(AppError('input-engine.form.timeout'))`
- Validation failure: `err(AppError('input-engine.field.validation_failed'))`
- Disabled: `err(AppError('input-engine.disabled'))`

### D6. Toggle Guard

`TEMPOT_INPUT_ENGINE` environment variable (`true`/`false`, default `true`) controls the package per Constitution Rule XVI (Pluggable Architecture). When disabled:

- `runForm()` returns `err(AppError('input-engine.disabled'))` immediately
- No conversation is created
- No storage adapter is initialized
- No side effects

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use `@grammyjs/conversations` v2.1.1 as the underlying conversation engine. All form interactions run within a grammY conversation context using native APIs: `conversation.form.build()`, `conversation.menu()`, `conversation.checkpoint()`, `conversation.rewind()`, `maxMilliseconds`, `otherwise` callbacks, and `conversation.external()` (D1).
- **FR-002**: System MUST use Zod 4 with `z.globalRegistry` for schema definition, validation, and field metadata. Each field schema has registry metadata: `fieldType`, `i18nKey`, `conditions`, and rendering options (D2).
- **FR-003**: System MUST support 39 built-in field types across 9 categories: Text (6), Numbers (5), Choice (4), Time/Place (5), Media (6), Smart (2), Geo (2), Identity (4), Interactive (5) (D3).
- **FR-004**: System MUST enforce the i18n-Only Rule (Rule XXXIX) for all user-facing text. All prompts, error messages, labels, button text, and confirmation messages use `@tempot/i18n-core` keys. Zero hardcoded user text.
- **FR-005**: System MUST implement Partial Save via a custom conversations storage adapter using `@tempot/shared` CacheService. After each valid field entry, the conversation state is persisted to Redis. Forms with `partialSave: true` resume from the last checkpoint on re-entry (D4, Rule XXXII, Architecture Spec §7.3.7).
- **FR-006**: System MUST provide automatic handling for `/cancel` at any point during a form. Cancellation immediately terminates the conversation and returns `err(AppError('input-engine.form.cancelled'))`. Partial save data is preserved for resume.
- **FR-007**: System MUST provide configurable form-level timeout via `maxMilliseconds` (default 10 minutes). On timeout, returns `err(AppError('input-engine.form.timeout'))`. Partial save data is preserved.
- **FR-008**: System MUST implement `ShortText` field with `min`/`max` length constraints, Zod string validation, and i18n prompt/error messages.
- **FR-009**: System MUST implement `LongText` field with paragraph-level text input, `maxLength` constraint, and multi-line support.
- **FR-010**: System MUST implement `Email` field with RFC-compliant email validation via Zod `.email()`.
- **FR-011**: System MUST implement `Phone` field with international phone number validation including country code.
- **FR-012**: System MUST implement `URL` field with valid URL validation via Zod `.url()`.
- **FR-013**: System MUST implement `RegexValidated` field with configurable regex pattern for custom formats (national ID, promo code, etc.).
- **FR-014**: System MUST implement `Integer` field with optional `min`/`max` constraints via Zod `.int().min().max()`.
- **FR-015**: System MUST implement `Float` field with optional `min`/`max` and decimal precision constraints.
- **FR-016**: System MUST implement `Currency` field with `min`/`max` amount constraints and locale-aware formatting.
- **FR-017**: System MUST implement `Percentage` field constrained between 0 and 100 via Zod `.min(0).max(100)`.
- **FR-018**: System MUST implement `SingleChoice` field. For ≤8 options: inline keyboard via `createInlineKeyboard`. For >8 options: paginated list via `buildPagination` from `@tempot/ux-helpers`.
- **FR-019**: System MUST implement `MultipleChoice` field with toggle buttons, configurable `minSelections`/`maxSelections`, and a confirm button.
- **FR-020**: System MUST implement `BooleanToggle` field with exactly two inline buttons (yes/no or custom labels) via `createInlineKeyboard`.
- **FR-021**: System MUST implement `SearchableList` field with lazy loading from a data source, server-side text filtering, and pagination via `buildPagination` for up to 10,000+ items.
- **FR-022**: System MUST implement `DatePicker` field with interactive calendar inline keyboard, month/year navigation, and min/max date constraints. Uses `DateService` from `@tempot/regional-engine` for locale-aware dates.
- **FR-023**: System MUST implement `TimePicker` field with hour/minute selection via inline buttons or text input in HH:MM format. Supports 12/24 hour mode.
- **FR-024**: System MUST implement `Location` field accepting GPS location sharing or text address input with optional geocoding.
- **FR-025**: System MUST implement `DateRange` field combining two DatePicker instances (start date, end date) with validation that end ≥ start.
- **FR-026**: System MUST implement `Photo` field accepting image uploads with configurable `maxSizeKB`, `allowedTypes`, and optional `preserveQuality` flag. Integrates with `@tempot/storage-engine` when available.
- **FR-027**: System MUST implement `Document` field accepting file uploads with configurable `allowedExtensions` and `maxSizeKB`. Integrates with `@tempot/storage-engine` when available.
- **FR-028**: System MUST implement `Video` and `Audio` fields accepting media uploads with configurable `maxDurationSeconds` and `maxSizeKB`.
- **FR-029**: System MUST implement `FileGroup` field for collecting multiple files with `minFiles`/`maxFiles` constraints and per-file validation.
- **FR-030**: System MUST implement `ConditionalField` — a wrapper that evaluates a condition function against previously collected form data and shows/skips the wrapped field accordingly. Circular dependencies detected at schema validation time.
- **FR-031**: System MUST implement `AIExtractorField` — accepts free-text or voice input, uses `@tempot/ai-core` to extract multiple field values at once. Shows extracted values for user confirmation. Falls back to manual step-by-step input when AI is unavailable (Rule XXXIII). Handles partial extraction by asking remaining fields manually.
- **FR-032**: System MUST implement `GeoSelectField` — hierarchical state → city selection using `GeoSelectField`, `GeoOption`, `GeoState`, `GeoCity` from `@tempot/regional-engine`. Renders paginated inline keyboards.
- **FR-033**: System MUST implement `GeoAddressField` — free-text address input with optional geocoding and format validation.
- **FR-034**: System MUST implement `NationalID` field with configurable regex validation (default: Egyptian 14-digit format). MUST support optional checksum validation for Egyptian IDs. When `extractData: true`, MUST extract embedded data from the 14-digit ID: birth date (digits 1-7 encode century+year+month+day), governorate code (digits 8-9), and gender (digit 13: odd=male, even=female), returning `NationalIDResult` instead of plain string.
- **FR-035**: System MUST implement `PassportNumber` field with configurable format validation.
- **FR-036**: System MUST implement `StarRating` field with configurable `min`/`max` scale, rendered as emoji number buttons using `EMOJI_NUMBERS` from `@tempot/ux-helpers`.
- **FR-037**: System MUST implement `MultiStepChoice` field — hierarchical multi-level selection with breadcrumb navigation. Each level is a paginated inline keyboard. Supports arbitrary depth with developer warning at 5+ levels.
- **FR-038**: System MUST provide a `FormRunner` function/class that orchestrates the full form lifecycle: schema validation → field iteration → conditional evaluation → input collection → validation → partial save → result assembly.
- **FR-039**: System MUST validate form schemas at `runForm()` call time before any user interaction. Invalid schemas (duplicate field names, missing i18n keys, circular conditional dependencies) return `err(AppError('input-engine.schema.invalid'))` or `err(AppError('input-engine.schema.circular_dependency'))`.
- **FR-040**: System MUST support a `TEMPOT_INPUT_ENGINE` environment variable (`true`/`false`, default `true`) to enable/disable the package per Constitution Rule XVI. When disabled, `runForm()` returns `err(AppError('input-engine.disabled'))` with zero side effects (D6).
- **FR-041**: System MUST use `encodeCallbackData` and `decodeCallbackData` from `@tempot/ux-helpers` for all inline keyboard callback data to prevent collision between concurrent form instances.
- **FR-042**: System MUST track `activeConversation` in `@tempot/session-manager` session data when a form is active, and clear it when the form completes or is cancelled.
- **FR-043**: System MUST implement `SchedulePicker` field — date+time selection with available time slot filtering. Renders DatePicker for date selection, then shows available slots for that date as inline keyboard. Supports static `availableSlots` and dynamic `slotDataSource`. Returns `SchedulePickerResult { date, time, slotId? }`.
- **FR-044**: System MUST implement `Contact` field — Telegram contact sharing via `message.contact`. Renders a keyboard button (ReplyKeyboardMarkup, NOT inline keyboard) for "Share Contact". Validates presence of `phoneNumber` and `firstName`. Returns `ContactResult { phoneNumber, firstName, lastName?, userId? }`.
- **FR-045**: System MUST implement `IBAN` field — International Bank Account Number validation per ISO 13616. Validates format: 2-letter country code + 2 check digits + up to 30 alphanumeric BBAN. Supports country-specific length validation. Config: `defaultCountry` (default: 'EG'), `allowedCountries`. Strips spaces and converts to uppercase before validation.
- **FR-046**: System MUST implement `EgyptianMobile` field — Egyptian mobile number with operator detection and country code selection. Validates 01x-xxxx-xxxx format. Detects operator from prefix: Vodafone (010), Etisalat (011), Orange (012), WE (015). Renders inline keyboard for country code selection (+20 default, configurable). Returns `EgyptianMobileResult { number, countryCode, operator? }`.
- **FR-047**: System MUST implement `CurrencyAmount` field — monetary amount with currency. Currency determined from config (`metadata.currency` override or `DEFAULT_CURRENCY` env var). Supports locale-aware formatting via `@tempot/regional-engine`. Handles Arabic numeral input (٠-٩). Returns `CurrencyAmountResult { amount, currency }`. Different from `Currency` field — `CurrencyAmount` includes explicit currency config and returns structured result.
- **FR-048**: System MUST implement `QRCode` field — QR code scanning from photo. User sends a photo containing a QR code, engine decodes and extracts the data string. Validates against `expectedFormat` ('url' | 'text' | 'json' | 'any') if specified. Falls back gracefully on decode failure — asks user to retry with clearer photo. Returns decoded string.
- **FR-049**: System MUST implement `Toggle` field — simple on/off toggle with two inline buttons. Displays visual toggle state indicator (✓/✗ emoji prefix on buttons). Single tap to select — no separate confirm step. Supports custom `onLabel`/`offLabel` i18n keys and `defaultValue`. Returns boolean.
- **FR-050**: System MUST implement `Tags` field — free-form tag input. User adds tags one by one by typing, sees current tags displayed, can remove individual tags by tapping them, confirms when done. Supports `predefinedTags` as selectable buttons. Validates `minTags`/`maxTags` and `maxTagLength` per tag. Rejects duplicate tags. Returns `string[]`.

### Key Entities

#### FormSchema (Zod 4 Registry-based)

```typescript
// Conceptual — actual implementation uses z.globalRegistry

// Developer defines individual field schemas with registry metadata:
const nameField = z.string().min(2).max(100);
z.globalRegistry.register(nameField, {
  fieldType: 'ShortText' as const,
  i18nKey: 'mymodule.fields.name',
  i18nErrorKey: 'mymodule.errors.name_invalid',
  order: 1,
  optional: false,
  conditions: [],
});

// Form schema is a z.object() combining field schemas:
const myFormSchema = z.object({
  name: nameField,
  age: ageField,
  city: cityField,
});
```

#### FieldMetadata (Registry Metadata)

```typescript
interface FieldMetadata {
  fieldType: FieldType; // One of 39 field types
  i18nKey: string; // i18n key for prompt text
  i18nErrorKey?: string; // i18n key for validation error (optional, has default)
  order?: number; // Field display order (optional, defaults to schema key order)
  optional?: boolean; // Whether the field can be skipped
  conditions?: FieldCondition[]; // Conditional display rules
  // Field-type-specific options:
  options?: ChoiceOption[]; // For SingleChoice, MultipleChoice
  min?: number; // For Integer, Float, Currency, StarRating
  max?: number; // For Integer, Float, Currency, StarRating, Percentage
  minLength?: number; // For ShortText, LongText
  maxLength?: number; // For ShortText, LongText
  maxSizeKB?: number; // For Photo, Document, Video, Audio
  allowedExtensions?: string[]; // For Document
  allowedTypes?: string[]; // For Photo
  maxDurationSeconds?: number; // For Video, Audio
  minFiles?: number; // For FileGroup
  maxFiles?: number; // For FileGroup
  minSelections?: number; // For MultipleChoice
  maxSelections?: number; // For MultipleChoice
  maxRetries?: number; // Max invalid input retries (default 3)
  pattern?: RegExp; // For RegexValidated, NationalID, PassportNumber
  targetFields?: string[]; // For AIExtractorField
  levels?: MultiStepLevel[]; // For MultiStepChoice
  preserveQuality?: boolean; // For Photo
  use12Hour?: boolean; // For TimePicker
  dataSource?: () => AsyncResult<ChoiceOption[], AppError>; // For SearchableList
  // SchedulePicker
  availableSlots?: TimeSlot[]; // Static available time slots
  slotDataSource?: (date: string) => AsyncResult<TimeSlot[], AppError>; // Dynamic slot loader
  slotDuration?: number; // Slot duration in minutes
  // EgyptianMobile
  countryCodes?: CountryCode[]; // Selectable country codes
  defaultCountryCode?: string; // Default country code (e.g., '+20')
  // IBAN
  defaultCountry?: string; // Default IBAN country (e.g., 'EG')
  allowedCountries?: string[]; // Allowed IBAN countries
  // CurrencyAmount
  currency?: string; // Currency override (e.g., 'EGP')
  allowedCurrencies?: string[]; // Allowed currencies
  decimalPlaces?: number; // Decimal precision
  // QRCode
  expectedFormat?: 'url' | 'text' | 'json' | 'any'; // Expected QR data format
  // Toggle
  onLabel?: string; // i18n key for "on" button
  offLabel?: string; // i18n key for "off" button
  defaultValue?: boolean; // Default toggle state
  // Tags
  minTags?: number; // Minimum tags required
  maxTags?: number; // Maximum tags allowed
  allowCustom?: boolean; // Allow typing custom tags
  predefinedTags?: ChoiceOption[]; // Selectable predefined tags
  maxTagLength?: number; // Max length per tag
  // NationalID (enhanced)
  extractData?: boolean; // Extract birth date, governorate, gender from Egyptian ID
}
```

#### FormResult

```typescript
// Success: ok(formData) — type-safe validated data matching the Zod schema
type FormResult<T extends z.ZodObject<z.ZodRawShape>> = AsyncResult<z.infer<T>, AppError>;

// Error cases:
// - err(AppError('input-engine.disabled')) — package disabled
// - err(AppError('input-engine.form.cancelled')) — user cancelled
// - err(AppError('input-engine.form.timeout')) — form timed out
// - err(AppError('input-engine.field.max_retries')) — max retries exceeded
// - err(AppError('input-engine.field.validation_failed')) — validation failed
// - err(AppError('input-engine.schema.invalid')) — invalid schema
// - err(AppError('input-engine.schema.circular_dependency')) — circular condition
```

#### TimeSlot (for SchedulePicker)

```typescript
interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  slotId?: string; // Optional slot identifier
  available: boolean; // Whether slot is bookable
  label?: string; // i18n key for display label
}
```

#### CountryCode (for EgyptianMobile)

```typescript
interface CountryCode {
  code: string; // ISO 3166-1 alpha-2 (e.g., 'EG')
  dialCode: string; // Dial prefix (e.g., '+20')
  name: string; // i18n key for country name
  flag?: string; // Flag emoji (e.g., '🇪🇬')
}
```

#### NationalIDResult (when extractData: true)

```typescript
interface NationalIDResult {
  id: string; // The 14-digit national ID
  birthDate?: string; // Extracted birth date (ISO 8601)
  governorate?: string; // Governorate name from code (digits 8-9)
  gender?: 'male' | 'female'; // Digit 13: odd=male, even=female
}
```

#### ContactResult (for Contact field)

```typescript
interface ContactResult {
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  userId?: number; // Telegram user ID if available
}
```

#### SchedulePickerResult (for SchedulePicker field)

```typescript
interface SchedulePickerResult {
  date: string; // ISO 8601 date
  time: string; // HH:MM format
  slotId?: string; // Slot identifier if provided
}
```

#### EgyptianMobileResult (for EgyptianMobile field)

```typescript
interface EgyptianMobileResult {
  number: string; // 01x-xxxx-xxxx format
  countryCode: string; // e.g., '+20'
  operator?: string; // Detected operator name
}
```

#### CurrencyAmountResult (for CurrencyAmount field)

```typescript
interface CurrencyAmountResult {
  amount: number; // Numeric amount
  currency: string; // ISO 4217 currency code (e.g., 'EGP')
}
```

#### FormOptions

```typescript
interface FormOptions {
  partialSave?: boolean; // Enable partial save (default false)
  partialSaveTTL?: number; // TTL in ms for partial save (default 86400000 = 24h)
  maxMilliseconds?: number; // Form timeout in ms (default 600000 = 10 min)
  allowCancel?: boolean; // Allow /cancel command (default true)
  formId?: string; // Unique form instance ID (auto-generated if not provided)
}
```

### Event Payloads

```typescript
// Registered in packages/event-bus/src/event-bus.events.ts TempotEvents interface

// input-engine.form.completed — form successfully completed
interface FormCompletedPayload {
  formId: string;
  userId: string;
  fieldCount: number;
  durationMs: number;
  hadPartialSave: boolean;
}

// input-engine.form.cancelled — form cancelled by user
interface FormCancelledPayload {
  formId: string;
  userId: string;
  fieldsCompleted: number;
  totalFields: number;
  reason: 'user_cancel' | 'timeout' | 'max_retries';
}

// input-engine.form.resumed — form resumed from partial save
interface FormResumedPayload {
  formId: string;
  userId: string;
  resumedFromField: number;
  totalFields: number;
}

// input-engine.field.validated — field validated (for analytics)
interface FieldValidatedPayload {
  formId: string;
  userId: string;
  fieldType: string;
  fieldName: string;
  valid: boolean;
  retryCount: number;
}
```

### Cross-Package Modifications

- `packages/event-bus/src/event-bus.events.ts`: Register input-engine events in `TempotEvents` interface (inline payload types — do NOT import from `@tempot/input-engine`)

---

## Non-Functional Requirements

- **NFR-001**: Validation response time (from user input to error/next prompt) < 100ms for all synchronous field types (Text, Numbers, Choice, Identity).
- **NFR-002**: Partial save write time < 50ms per field (CacheService set operation).
- **NFR-003**: SearchableList pagination response < 200ms for up to 10,000 items with text filtering.
- **NFR-004**: DatePicker calendar rendering < 150ms per month view.
- **NFR-005**: AIExtractorField extraction time < 5s excluding AI API latency (delegated to ai-core ResilienceService).
- **NFR-006**: Form schema validation at `runForm()` time < 10ms for schemas with up to 50 fields.
- **NFR-007**: Memory usage for a single active form instance < 1MB (excluding file uploads).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developer effort to build a 5-field form is reduced to defining a single Zod schema object with registry metadata — zero conversation boilerplate.
- **SC-002**: Validation response time (from user input to error/next prompt) < 100ms for synchronous field types (NFR-001).
- **SC-003**: 100% of forms support the `/cancel` command at any stage when `allowCancel: true` (default).
- **SC-004**: System successfully resumes 100% of partial sessions after simulated bot restart (within TTL) when `partialSave: true`.
- **SC-005**: All 39 field types pass independent unit tests with valid input, invalid input, and edge case scenarios.
- **SC-006**: Zero hardcoded user-facing text in the entire package — 100% i18n coverage verified by test.
- **SC-007**: AIExtractorField gracefully degrades to manual input within 1s of detecting AI unavailability.
- **SC-008**: Toggle guard (`TEMPOT_INPUT_ENGINE=false`) returns `err` with zero side effects — no conversation created, no storage initialized.
