# Feature Specification: Input Engine (Dynamic Form Engine)

**Feature Branch**: `011-input-engine-package`  
**Created**: 2026-03-19  
**Clarified**: 2026-04-04  
**Status**: In Progress (Phase 2 — 8 new features)  
**Input**: User description: "Build the @tempot/input-engine package — a dynamic multi-step conversation and form handling engine built on @grammyjs/conversations v2.1.1 and Zod 4 with Registry. Covers 39 field types across 9 categories, partial save via custom conversations storage adapter, cancel/timeout, conditional fields, AI-powered extraction, and geo selection."

## Clarifications

### Session 2026-04-04

- Q: How should action buttons (Skip/Cancel/Back) be rendered relative to field prompts? → A: Action buttons are appended to the field handler's inline keyboard as extra row(s), producing a single message per field. Field handlers return render context including keyboard layout; the FormRunner appends action button rows before sending.
- Q: How should conditional fields behave when a user edits a field from the confirmation summary? → A: Re-evaluate conditions after editing. If editing changes conditional visibility, ask newly-visible fields and remove newly-hidden fields from formData, then re-show the updated summary before allowing final confirmation.
- Q: How should the progress indicator handle conditional fields that change the total field count? → A: Dynamic total — re-count renderable fields after each field completes by evaluating remaining conditions against current formData. The total may change as the user progresses, providing the most accurate progress indication.
- Q: When navigating back to a previously completed field, what happens to the old value? → A: Pre-fill context — show the previous value (e.g., "Current value: Ahmed") and provide a "Keep current ✓" action button. The user can re-enter a new value or tap "Keep current" to retain the existing value without re-entry.
- Q: How is the translation function provided to the FormRunner for error messages and progress? → A: Single `t` function in FormRunnerDeps as a structural interface `(key: string, params?: Record<string, unknown>) => string`. The caller provides a pre-bound translation function — no import from `@tempot/i18n-core`. This follows the existing minimal-interface dependency pattern.

### Session 2026-04-04 (Brainstorming — Phase 2 Design Deepening)

- Q: StorageEngineClient.upload() has a Buffer-based contract but FR-059 describes passing `{ fileId, fileName, mimeType, size }`. Who downloads the file from Telegram? → A: Input-engine downloads first. Input-engine calls `conversation.external()` to download the file from Telegram (via grammY `getFile()`), then passes `Buffer` to `storageClient.upload(buffer, { filename, mimeType })`. This keeps storage-engine Telegram-agnostic.
- Q: AIExtractionClient.extract() accepts only string input but FR-031 says users can send photos/documents. How are media inputs handled? → A: Input-engine extracts text first. For photos, the Telegram message caption is used. For documents, the Telegram message caption is used. No OCR or PDF text extraction is performed in Phase 2 — the user is expected to describe the data in the message caption or as free text. The string is then passed to `aiClient.extract(input, targetFields)`. The AI client contract stays string-only and focused. OCR/document-content extraction may be added in a future phase.
- Q: Should progress indicator and validation error messages be separate Telegram messages or embedded in the field prompt? → A: Embedded in the field prompt message. Progress text is prepended at the top, error text is prepended before the re-rendered prompt. This aligns with the D7 single-message pattern and reduces message clutter.
- Q: When navigating back, should the iterator skip over fields whose conditions evaluate to false? → A: Yes — skip over condition-false fields. The back navigation walks backward past any fields where `shouldRenderField()` returns false, landing on the last user-answered field.
- Q: What happens when the confirmation summary exceeds Telegram's 4096-character limit? → A: Truncate each field value to a max length (100 chars) with '...' for overflow. If the total still exceeds 4096 chars, split across multiple messages.
- Q: When a user edits a field from confirmation and conditions change, where are newly-visible fields inserted? → A: Ask newly-visible fields after the edited field (in field order). After editing the selected field, re-evaluate conditions, ask any newly-visible fields that come after the edited field in the schema order, then re-display the summary.

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

### User Story 7 — Form Navigation & Field Skip (Priority: P2)

As a user filling out a form, I want to skip optional fields, go back to correct previous answers, and cancel the form via inline buttons — so that I have full control over the form-filling experience without relying on text commands.

**Why this priority**: Core UX infrastructure. Without navigation buttons, users are trapped in a linear forward-only flow with no way to correct mistakes, skip irrelevant fields, or cancel cleanly via UI. These are table-stakes UX features for any multi-step form.

**Independent Test**: Define a 4-field form with field 2 optional, fill field 1, skip field 2 via "Skip ⏭" button, fill field 3, go back to field 1 via "⬅ Back" button, re-enter field 1, proceed to field 4, cancel via "Cancel ❌" button, and verify all navigation behaviors.

**Acceptance Scenarios**:

1. **Given** a field with `metadata.optional === true`, **When** the field is rendered, **Then** the inline keyboard includes a "Skip ⏭" action button row. **When** the user taps "Skip", **Then** the field value is set to `undefined` in formData, the field is marked complete, and iteration continues to the next field.
2. **Given** a field with `metadata.optional === true` AND `maxRetries` is exceeded, **When** all retries fail, **Then** the field is auto-skipped (value = `undefined`) instead of returning `err(FIELD_MAX_RETRIES)`.
3. **Given** any field except the first, **When** the field is rendered, **Then** the inline keyboard includes a "⬅ Back" action button. **When** the user taps "Back", **Then** the previous field is re-rendered with its previous value shown as context and a "Keep current ✓" button.
4. **Given** a form with `allowCancel: true` (default), **When** any field is rendered, **Then** the inline keyboard includes a "Cancel ❌" action button. **When** the user taps "Cancel" or types `/cancel`, **Then** the form returns `err(FORM_CANCELLED)` and partial save data is preserved.
5. **Given** a form with `allowCancel: false`, **When** a field is rendered, **Then** no cancel button is shown and `/cancel` text is treated as normal input.
6. **Given** back navigation to a field that a conditional field depends on, **When** the user changes the answer, **Then** conditional fields are re-evaluated. Newly-hidden conditional fields are removed from formData; newly-visible conditional fields will be asked when iteration reaches them.

---

### User Story 8 — Progress, Errors & Confirmation (Priority: P2)

As a user, I want to see my progress through the form, receive clear error messages when I enter invalid data, and review a summary of my answers before final submission — so that I understand where I am, what went wrong, and can verify my data before committing.

**Why this priority**: Essential UX polish. Without progress indicators, users don't know how many fields remain. Without error messages, users have no idea why their input was rejected. Without confirmation, users can't review or correct their answers before submission.

**Independent Test**: Define a 5-field form with `showProgress: true` and `showConfirmation: true`, enter invalid data for field 2 to trigger an error message, complete all fields, verify the progress indicator updates dynamically, review the confirmation summary, edit field 3 from the summary, and confirm submission.

**Acceptance Scenarios**:

1. **Given** `showProgress: true` (default), **When** each field is rendered, **Then** a progress message is sent: `t('input-engine.progress', { current: X, total: Y })` where Y is dynamically computed (excluding conditionally hidden fields).
2. **Given** `showProgress: false`, **When** fields are rendered, **Then** no progress message is shown.
3. **Given** invalid input (parseResponse or validate fails), **When** the user enters bad data, **Then** the engine sends an i18n error message using `metadata.i18nErrorKey` (or a default per field type) with retry count context, BEFORE re-rendering the field.
4. **Given** `showConfirmation: true` (default), **When** all fields are completed, **Then** a summary message is displayed showing each field label and collected value, with three buttons: "✅ Confirm", "✏️ Edit field", "❌ Cancel".
5. **Given** the user taps "✏️ Edit field" on the confirmation summary, **Then** a secondary keyboard lists all field names. The user selects a field, re-enters its value (with previous value shown as context), conditional fields are re-evaluated, and the updated summary is re-displayed.
6. **Given** the user taps "✅ Confirm", **Then** the form returns `ok(formData)`.
7. **Given** the user taps "❌ Cancel" on the confirmation, **Then** the form returns `err(FORM_CANCELLED)` with partial save preserved.

---

### User Story 9 — Storage Integration & AI Extraction (Priority: P2)

As a module developer, I want media field handlers to automatically upload files to the storage engine when available, and the AI extractor to perform full extraction with user confirmation — so that media assets are properly stored and AI extraction provides a complete, reliable UX.

**Why this priority**: Completes the integration story for two external dependencies (`@tempot/storage-engine` and `@tempot/ai-core`) that are specified but not wired. Without storage integration, media files exist only as Telegram file IDs. Without full AI extraction, the feature is a non-functional stub.

**Independent Test**: (a) Define a form with a Photo field, provide a mock StorageEngineClient, upload a photo, and verify the result includes `storageUrl`. (b) Define a form with AIExtractorField, provide a mock AIExtractionClient, send free-text, and verify extraction → confirmation → acceptance flow.

**Acceptance Scenarios**:

1. **Given** `StorageEngineClient` is provided in deps AND a Photo field receives a valid image, **When** parse/validate succeeds, **Then** the handler calls `storageClient.upload()` via `conversation.external()` and returns `{ telegramFileId, storageUrl, fileName, mimeType, size }`.
2. **Given** `StorageEngineClient` is provided but `upload()` fails, **When** the upload error occurs, **Then** the handler logs a warning and returns `{ telegramFileId }` only (graceful degradation).
3. **Given** `StorageEngineClient` is NOT provided, **When** a media field is used, **Then** the handler returns `{ telegramFileId }` only (current behavior, no change).
4. **Given** an `AIExtractorField` with target fields, **When** the user sends free-text, **Then** the handler calls `aiClient.extract()`, displays extracted values for confirmation with "✅ Accept all", "✏️ Edit", "📝 Manual input" buttons.
5. **Given** partial AI extraction (some fields extracted, some not), **When** the user accepts, **Then** extracted values are accepted and remaining fields are asked manually one by one.
6. **Given** AI is unavailable (`aiClient.isAvailable()` returns false or circuit breaker open), **When** the AIExtractorField is reached, **Then** the engine skips AI extraction, shows an i18n message about unavailability, and falls back to manual step-by-step input for all target fields.

---

## Edge Cases

1. **Conversation Timeout**: User stops responding mid-form. After `maxMilliseconds` (default 10 minutes, configurable per form), the conversation auto-cancels and returns `err(AppError('input-engine.form.timeout'))`. Partial save data is preserved for resume.

2. **User Cancellation via /cancel or Cancel Button**: User types `/cancel` or taps the "Cancel ❌" inline button at any point during field collection. The engine immediately terminates and returns `err(AppError('input-engine.form.cancelled'))`. Partial save data is PRESERVED for future resume (not deleted). When `allowCancel: false`, the cancel button is not shown and `/cancel` text is treated as normal input. Cancel button callback data: `ie:{formId}:{fieldIndex}:__cancel__`.

3. **Bot Restart Mid-Form**: Bot process restarts while user is on field 5 of 10. With `partialSave: true`, the custom conversations storage adapter restores the conversation state. The form resumes from field 6 (or the last checkpointed field). Without partial save, the form starts over.

4. **Invalid Input Retry Limit**: User repeatedly enters invalid data. After `maxRetries` (default 3, configurable per field): if `metadata.optional === true`, the field is auto-skipped (value = `undefined` in formData, field marked complete, `input-engine.field.skipped` event emitted with reason `max_retries_skip`). If `metadata.optional === false` (default), the form returns `err(AppError('input-engine.field.max_retries'))`.

5. **Redis Unavailable During Partial Save**: CacheService from `@tempot/shared` handles Redis degradation (Rule XXXII). Falls back to in-memory cache. Partial save works in-process but not across restarts. Warning logged.

6. **Empty Optional Fields**: When `metadata.optional === true`, the field render includes a "Skip ⏭" inline keyboard button (callback data: `ie:{formId}:{fieldIndex}:__skip__`). When the user taps "Skip", the field value is set to `undefined` in formData, the field is marked complete in `completedFieldNames`, and `input-engine.field.skipped` event is emitted with reason `user_skip`. The Zod schema for optional fields MUST use `.optional()` to allow `undefined` values.

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

36. **Back Navigation Past Conditional Field**: User navigates back past a conditional field whose condition was previously met. After changing the earlier field's value, the condition is re-evaluated. If no longer met, the conditional field is removed from `completedFieldNames` and its value deleted from `formData`. If still met, it remains.

37. **Back Navigation on First Field**: The first field in the form does NOT show a "⬅ Back" button since there is no previous field to navigate to.

38. **Back Navigation After Partial Save Restore**: After restoring from partial save, back navigation works within restored fields. The user can go back to any field that was restored, re-enter its value (with previous value shown), and the partial save is updated.

39. **Confirmation Step — Edit Changes Conditional Visibility**: User edits a field from the confirmation summary that other conditional fields depend on. Conditions are re-evaluated: newly-visible fields are asked (inserted into the flow), newly-hidden fields are removed from formData. Updated summary is re-displayed.

40. **Confirmation Step Timeout**: The confirmation step does NOT count toward `maxMilliseconds`. The form deadline is reset when the confirmation summary is displayed, giving the user unlimited time to review.

41. **Confirmation Summary — Field Type Display**: Each of the 39 field types has a concise display format in the summary: text fields show value directly, choice fields show selected label, media fields show "✓ File uploaded" (not raw file ID), boolean fields show ✓/✗, skipped optional fields show "—".

42. **Progress Indicator with Dynamic Total**: When a conditional field is skipped mid-form, the progress total decreases. Progress message is re-computed after each field: `t('input-engine.progress', { current, total })` where `total` reflects only fields expected to be rendered given current formData.

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

### D7. Action Button Rendering (Single-Message Pattern)

Field action buttons (Skip, Cancel, Back) are appended as extra row(s) to the field handler's inline keyboard, producing a single message per field. The FormRunner is responsible for composing the final keyboard: field-specific rows from the handler + action button row(s) from the runner. This avoids message clutter (two messages per field) and provides a clean single-message UX. Field handlers return a `RenderResult` that may include keyboard layout; the FormRunner appends action buttons before sending via `conversation.form.build()` or `conversation.menu()`.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use `@grammyjs/conversations` v2.1.1 as the underlying conversation engine. All form interactions run within a grammY conversation context using native APIs: `conversation.form.build()`, `conversation.menu()`, `conversation.checkpoint()`, `conversation.rewind()`, `maxMilliseconds`, `otherwise` callbacks, and `conversation.external()` (D1).
- **FR-002**: System MUST use Zod 4 with `z.globalRegistry` for schema definition, validation, and field metadata. Each field schema has registry metadata: `fieldType`, `i18nKey`, `conditions`, and rendering options (D2).
- **FR-003**: System MUST support 39 built-in field types across 9 categories: Text (6), Numbers (5), Choice (4), Time/Place (5), Media (6), Smart (2), Geo (2), Identity (4), Interactive (5) (D3).
- **FR-004**: System MUST enforce the i18n-Only Rule (Rule XXXIX) for all user-facing text. All prompts, error messages, labels, button text, and confirmation messages use `@tempot/i18n-core` keys. Zero hardcoded user text.
- **FR-005**: System MUST implement Partial Save via a custom conversations storage adapter using `@tempot/shared` CacheService. After each valid field entry, the conversation state is persisted to Redis. Forms with `partialSave: true` resume from the last checkpoint on re-entry (D4, Rule XXXII, Architecture Spec §7.3.7).
- **FR-006**: System MUST provide automatic handling for `/cancel` text input and "Cancel ❌" inline button at any point during a form (when `allowCancel: true`). Cancellation immediately terminates the conversation and returns `err(AppError('input-engine.form.cancelled'))`. Partial save data is PRESERVED for future resume (not deleted). Cancel button callback data: `ie:{formId}:{fieldIndex}:__cancel__`.
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
- **FR-031**: System MUST implement `AIExtractorField` with full extraction flow: (1) `render()` sends i18n prompt asking user to send a photo, document, or free-text message; (2) `parseResponse()` receives the user's input; (3) handler calls `aiClient.extract(input, targetFields)` via `conversation.external()`; (4) on success, displays extracted values for confirmation with "✅ Accept all", "✏️ Edit", "📝 Manual input" buttons; (5) on partial success, accepts confirmed values and asks remaining fields manually; (6) when AI unavailable (`aiClient.isAvailable()` returns false), skips extraction entirely, shows i18n unavailability message, falls back to manual step-by-step input (Rule XXXIII graceful degradation); (7) on extraction failure, falls back to manual input with warning logged.
- **FR-032**: System MUST implement `GeoSelectField` — hierarchical state → city selection using `GeoSelectField`, `GeoOption`, `GeoState`, `GeoCity` from `@tempot/regional-engine`. Renders paginated inline keyboards.
- **FR-033**: System MUST implement `GeoAddressField` — free-text address input with optional geocoding and format validation.
- **FR-034**: System MUST implement `NationalID` field with configurable regex validation (default: Egyptian 14-digit format). MUST support optional checksum validation for Egyptian IDs. When `extractData: true`, MUST extract embedded data from the 14-digit ID: birth date (digits 1-7 encode century+year+month+day), governorate code (digits 8-9), and gender (digit 13: odd=male, even=female), returning `NationalIDResult` instead of plain string.
- **FR-035**: System MUST implement `PassportNumber` field with configurable format validation.
- **FR-036**: System MUST implement `StarRating` field with configurable `min`/`max` scale, rendered as emoji number buttons using `EMOJI_NUMBERS` from `@tempot/ux-helpers`.
- **FR-037**: System MUST implement `MultiStepChoice` field — hierarchical multi-level selection with breadcrumb navigation. Each level is a paginated inline keyboard. Supports arbitrary depth with developer warning at 5+ levels.
- **FR-038**: System MUST provide a `FormRunner` function/class that orchestrates the full form lifecycle: schema validation → field iteration (bidirectional with back navigation) → conditional evaluation → input collection → validation error display → optional field skip → progress indicator → partial save → confirmation step → result assembly. Action buttons (Skip, Cancel, Back, Keep current) are appended to field handler inline keyboards as extra rows (D7).
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
- **FR-051**: System MUST implement optional field skip mechanism. When `metadata.optional === true`, the field's inline keyboard includes a "Skip ⏭" action button (callback data: `ie:{formId}:{fieldIndex}:__skip__`). When tapped, the field value is set to `undefined`, the field is marked complete, and a `input-engine.field.skipped` event is emitted with reason `user_skip`. When `metadata.optional === true` AND `maxRetries` is exceeded, the field is auto-skipped (reason `max_retries_skip`) instead of returning `err(FIELD_MAX_RETRIES)`. Zod schema for optional fields MUST use `.optional()`.
- **FR-052**: System MUST render a "Cancel ❌" inline keyboard button alongside each field prompt when `allowCancel: true` (default). Button callback data: `ie:{formId}:{fieldIndex}:__cancel__`. When tapped, the form returns `err(FORM_CANCELLED)` and partial save data is PRESERVED (not deleted). The engine MUST also intercept `/cancel` text input and treat it as cancellation when `allowCancel: true`.
- **FR-053**: System MUST enforce `allowCancel` option. When `allowCancel === true` (default): cancel button shown and `/cancel` text intercepted. When `allowCancel === false`: no cancel button shown and `/cancel` text treated as normal input (passed to field handler for parsing).
- **FR-054**: System MUST display i18n validation error messages to the user when `parseResponse()` or `validate()` fails, BEFORE re-rendering the field. Error message key is `metadata.i18nErrorKey` if defined, otherwise a default key per field type (e.g., `input-engine.errors.short_text_invalid`). Error message includes retry context: `t(errorKey, { attempt: retryCount, maxRetries })`. Requires `t` function in `FormRunnerDeps`.
- **FR-055**: System MUST display a progress indicator before rendering each field when `showProgress: true` (default). Progress message: `t('input-engine.progress', { current: fieldsCompleted + 1, total: dynamicTotal })`. The `dynamicTotal` is re-computed after each field by evaluating remaining conditions against current formData, excluding conditionally hidden fields. When `showProgress: false`, no progress message is shown.
- **FR-056**: System MUST implement back navigation via "⬅ Back" inline keyboard button rendered with each field EXCEPT the first field. Button callback data: `ie:{formId}:{fieldIndex}:__back__`. When tapped: the last completed field is removed from `completedFieldNames`, its value removed from `formData`, the field index moves backward to re-render the previous field with its previous value shown as context and a "Keep current ✓" button. If partial save is enabled, the updated state is saved. Conditional fields are re-evaluated when going back past them. The field iteration loop MUST be restructured from forward-only to bidirectional (while loop with index).
- **FR-057**: System MUST implement a confirmation step when `showConfirmation: true` (default). After all fields are completed, a summary message displays each field label (from `i18nKey`) and its collected value with three inline buttons: "✅ Confirm" (returns `ok(formData)`), "✏️ Edit field" (shows field list for re-entry), "❌ Cancel" (returns `err(FORM_CANCELLED)`). The confirmation step does NOT count toward `maxMilliseconds` — the deadline is reset. Field display format: text fields show value, choice fields show label, media shows "✓ File uploaded", booleans show ✓/✗, skipped optionals show "—".
- **FR-058**: System MUST implement edit-from-confirmation flow. When the user taps "✏️ Edit field", a secondary inline keyboard lists all field names. The user selects a field, re-enters its value (with previous value shown and "Keep current ✓" button), conditional fields are re-evaluated (newly-visible fields asked, newly-hidden fields removed from formData), and the updated summary is re-displayed.
- **FR-059**: System MUST implement storage engine integration in media handlers (Photo, Document, Video, Audio, FileGroup). When `StorageEngineClient` is provided in deps: after successful parse/validate, the handler downloads the file from Telegram via `conversation.external(() => ctx.api.getFile(fileId))`, then calls `storageClient.upload(buffer, { filename, mimeType })` via `conversation.external()` and returns `{ telegramFileId, storageUrl, fileName, mimeType, size }`. Input-engine downloads the file to a Buffer — storage-engine stays Telegram-agnostic (D22). If `upload()` fails, logs a warning and returns `{ telegramFileId }` only (graceful degradation). When `StorageEngineClient` is NOT provided, returns `{ telegramFileId }` only (current behavior).

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
  allowCancel?: boolean; // Allow /cancel command and button (default true)
  formId?: string; // Unique form instance ID (auto-generated if not provided)
  showProgress?: boolean; // Show "Field X of Y" progress indicator (default true)
  showConfirmation?: boolean; // Show summary before submission (default true)
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

// input-engine.field.skipped — field skipped (optional skip or condition skip)
interface FieldSkippedPayload {
  formId: string;
  userId: string;
  fieldName: string;
  fieldType: string;
  reason: 'user_skip' | 'max_retries_skip' | 'condition';
}
```

#### FormRunnerDeps (New Dependencies for Phase 2)

```typescript
// Added to existing FormRunnerDeps interface:
interface FormRunnerDeps {
  // ... existing deps (registry, logger, eventBus, etc.) ...
  t?: (key: string, params?: Record<string, unknown>) => string; // i18n translation function (structural interface)
  storageClient?: StorageEngineClient; // For media upload integration (FR-059)
  aiClient?: AIExtractionClient; // For AI extraction integration (FR-031/US9)
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
- **SC-009**: Optional fields display "Skip ⏭" button and successfully skip when tapped — value is `undefined` in formData.
- **SC-010**: Optional fields are auto-skipped on maxRetries exhaustion instead of failing the form.
- **SC-011**: "Cancel ❌" button and `/cancel` text interception both produce `err(FORM_CANCELLED)` with partial save preserved.
- **SC-012**: Validation errors display i18n messages to the user before re-rendering, with retry count context.
- **SC-013**: Progress indicator shows dynamic "Field X of Y" that adjusts when conditional fields are skipped.
- **SC-014**: Back navigation successfully re-renders the previous field with its old value shown and "Keep current ✓" button.
- **SC-015**: Confirmation summary displays all field values with correct formatting per field type, and supports edit → re-evaluation → re-display flow.
- **SC-016**: Media handlers (Photo, Document, Video, Audio, FileGroup) call `storageClient.upload()` when available and degrade gracefully when it fails or is unavailable.
- **SC-017**: AIExtractorField performs full extraction → confirmation → acceptance flow, with graceful fallback to manual input when AI is unavailable.
