# Input Engine — Task Breakdown

**Feature:** 011-input-engine-package  
**Source:** spec.md (Complete) + plan.md (Corrected) + research.md + data-model.md  
**Generated:** 2026-04-03

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Package scaffolding and 10-point checklist validation

### Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)  
**Estimated time:** 5 min  
**FR:** None (infrastructure)

**Files to create:**

- `packages/input-engine/.gitignore`
- `packages/input-engine/tsconfig.json`
- `packages/input-engine/package.json`
- `packages/input-engine/vitest.config.ts`
- `packages/input-engine/src/index.ts` (empty barrel)
- `packages/input-engine/tests/unit/` (directory)

**Test file:** N/A (infrastructure only — validated by 10-point checklist)

**Acceptance criteria:**

- [ ] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [ ] `.gitignore` includes: `dist/`, `node_modules/`, `*.tsbuildinfo`, `src/**/*.js`, `src/**/*.js.map`, `src/**/*.d.ts`, `src/**/*.d.ts.map`, `tests/**/*.js`, `tests/**/*.d.ts`
- [ ] `tsconfig.json` extends `../../tsconfig.json`, has `"outDir": "dist"`, `"rootDir": "src"`
- [ ] `package.json` has `"type": "module"`, `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"exports": { ".": "./dist/index.js" }`
- [ ] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [ ] Dependencies match plan.md: `@grammyjs/conversations` (^2.1.1), `zod` (^4.3.6), `@tempot/shared`, `@tempot/ux-helpers`, `@tempot/i18n-core`, `@tempot/session-manager`
- [ ] Optional dependencies: `@tempot/storage-engine`, `@tempot/ai-core`, `@tempot/regional-engine`
- [ ] Dev dependencies: `grammy` (^1.41.1)
- [ ] `vitest.config.ts` matches existing package patterns
- [ ] `src/index.ts` exists as empty barrel file
- [ ] No compiled artifacts in `src/`
- [ ] Existing placeholder `README.md` is preserved (will be rewritten in Prompt B docs sync)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, contracts, error codes, toggle guard, storage adapter, FieldHandler interface, schema validator, and FormRunner. These MUST be complete before any field handler can be implemented.

### Task 1: Type Definitions, Contracts & Error Codes

**Priority:** P0 (dependency for all other tasks)  
**Estimated time:** 15 min  
**FR:** FR-001, FR-002, FR-003, FR-040  
**Dependencies:** Task 0

**Files to create:**

- `packages/input-engine/src/input-engine.types.ts`
- `packages/input-engine/src/input-engine.contracts.ts`
- `packages/input-engine/src/input-engine.errors.ts`

**Test file:** `packages/input-engine/tests/unit/input-engine.types.test.ts`

**Acceptance criteria:**

- [ ] `FieldType` union type exported with all 39 field types across 9 categories: Text (ShortText, LongText, Email, Phone, URL, RegexValidated), Numbers (Integer, Float, Currency, Percentage, CurrencyAmount), Choice (SingleChoice, MultipleChoice, BooleanToggle, SearchableList), Time/Place (DatePicker, TimePicker, Location, DateRange, SchedulePicker), Media (Photo, Document, Video, Audio, FileGroup, Contact), Smart (ConditionalField, AIExtractorField), Geo (GeoSelectField, GeoAddressField), Identity (NationalID, PassportNumber, IBAN, EgyptianMobile), Interactive (StarRating, MultiStepChoice, QRCode, Toggle, Tags)
- [ ] `FieldMetadata` interface exported with all properties from data-model.md (fieldType, i18nKey, i18nErrorKey, order, optional, conditions, maxRetries, options, min, max, minLength, maxLength, maxSizeKB, allowedExtensions, allowedTypes, maxDurationSeconds, minFiles, maxFiles, minSelections, maxSelections, pattern, targetFields, levels, preserveQuality, use12Hour, dataSource, availableSlots, slotDataSource, slotDuration, countryCodes, defaultCountryCode, defaultCountry, allowedCountries, currency, allowedCurrencies, decimalPlaces, expectedFormat, onLabel, offLabel, defaultValue, minTags, maxTags, allowCustom, predefinedTags, maxTagLength, extractData)
- [ ] `ChoiceOption` interface exported: `value`, `label` (i18n key), `emoji?`, `disabled?`
- [ ] `FieldCondition` interface exported: `dependsOn`, `operator` ('equals'|'notEquals'|'in'|'gt'|'lt'|'custom'), `value?`, `fn?`
- [ ] `MultiStepLevel` interface exported: `label` (i18n key), `options?`, `dataSource?`
- [ ] `FormOptions` interface exported: `partialSave?`, `partialSaveTTL?`, `maxMilliseconds?`, `allowCancel?`, `formId?`
- [ ] `DEFAULT_FORM_OPTIONS` constant exported with defaults: `partialSave: false`, `partialSaveTTL: 86400000`, `maxMilliseconds: 600000`, `allowCancel: true`, `formId: ''`
- [ ] Structural interfaces in contracts: `StorageEngineClient` (upload, validate), `AIExtractionClient` (extract, isAvailable), `RegionalClient` (getStates, getCities), `InputEngineLogger` (info, warn, error, debug), `InputEngineEventBus` (publish)
- [ ] `INPUT_ENGINE_ERRORS` constant exported with all error codes from plan.md (DISABLED, SCHEMA_INVALID, SCHEMA_CIRCULAR_DEPENDENCY, FORM_CANCELLED, FORM_TIMEOUT, FORM_ALREADY_ACTIVE, FIELD_VALIDATION_FAILED, FIELD_MAX_RETRIES, FIELD_PARSE_FAILED, FIELD_RENDER_FAILED, FIELD_TYPE_UNKNOWN, PARTIAL_SAVE_FAILED, PARTIAL_SAVE_RESTORE_FAILED, MEDIA_SIZE_EXCEEDED, MEDIA_TYPE_NOT_ALLOWED, MEDIA_UPLOAD_FAILED, MEDIA_DURATION_EXCEEDED, AI_EXTRACTION_FAILED, AI_UNAVAILABLE, GEO_LOAD_FAILED, EVENT_PUBLISH_FAILED, IBAN_INVALID_CHECKSUM, IBAN_COUNTRY_NOT_ALLOWED, QR_DECODE_FAILED, QR_FORMAT_MISMATCH, SCHEDULE_NO_SLOTS, SCHEDULE_SLOT_UNAVAILABLE, NATIONAL_ID_CHECKSUM_FAILED, NATIONAL_ID_FUTURE_DATE, TAGS_DUPLICATE, TAGS_MAX_LENGTH, CONTACT_NOT_SHARED)
- [ ] No `any` types
- [ ] All tests pass

---

### Task 2: Toggle Guard & Config

**Priority:** P0 (prerequisite for FormRunner)  
**Estimated time:** 5 min  
**FR:** FR-040, D6, Rule XVI  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/input-engine/src/input-engine.config.ts`

**Test file:** `packages/input-engine/tests/unit/input-engine.config.test.ts`

**Acceptance criteria:**

- [ ] `isInputEngineEnabled()` returns `boolean` — reads `TEMPOT_INPUT_ENGINE` env var, `'false'` = disabled, anything else = enabled (default `true`)
- [x] `guardEnabled<T>(fn)` function exported — when disabled returns `err(AppError(INPUT_ENGINE_ERRORS.DISABLED))` without calling `fn`; when enabled calls and returns `fn()` result (F5)
- [x] `guardEnabledAsync<T>(fn)` async variant exported — same logic for async operations (F5)
- [x] Zero side effects when disabled — no conversation created, no storage initialized (D6, SC-008) (F5)
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: enabled calls fn, disabled returns err without calling fn, fn error propagated, async variant works)

---

### Task 3: Conversations Storage Adapter

**Priority:** P0 (prerequisite for partial save)  
**Estimated time:** 10 min  
**FR:** FR-005, D4, Rule XXXII  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/input-engine/src/storage/conversations-storage.adapter.ts`

**Test file:** `packages/input-engine/tests/unit/conversations-storage.adapter.test.ts`

**Acceptance criteria:**

- [ ] `ConversationsStorageAdapter` class exported
- [ ] Constructor takes `CacheAdapter` (structural interface: get, set, del), `InputEngineLogger`, and optional `ttlMs` (default 86400000 = 24h)
- [ ] `read(key)` returns `Promise<unknown | undefined>` — reads from CacheService, returns `undefined` on failure (graceful degradation)
- [ ] `write(key, value)` returns `Promise<void>` — writes to CacheService with TTL, logs warning on failure (no throw)
- [ ] `delete(key)` returns `Promise<void>` — deletes from CacheService, logs warning on failure (no throw)
- [ ] Redis unavailability is handled gracefully (Rule XXXII) — all operations degrade without throwing
- [ ] Warning log includes error code from `INPUT_ENGINE_ERRORS`
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: read success, read failure returns undefined, write success, write failure logs warning, delete success, delete failure logs warning)

---

### Task 4: FieldHandler Interface & Registry

**Priority:** P0 (prerequisite for all field handlers)  
**Estimated time:** 10 min  
**FR:** FR-003, Research Decision 7  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/input-engine/src/fields/field.handler.ts`

**Test file:** `packages/input-engine/tests/unit/field.handler.test.ts`

**Acceptance criteria:**

- [x] `FieldHandler` interface exported with: `readonly fieldType: FieldType`, `render(conversation, ctx, metadata, formData) → AsyncResult<unknown, AppError>`, `parseResponse(message, metadata) → Result<unknown, AppError>`, `validate(value, schema, metadata) → Result<unknown, AppError>` (F4 — render returns unknown)
- [ ] `FieldHandlerRegistry` class exported with: `register(handler)`, `get(fieldType) → FieldHandler | undefined`, `has(fieldType) → boolean`, `getRegisteredTypes() → FieldType[]`
- [ ] Registry stores handlers in `Map<FieldType, FieldHandler>`
- [ ] Registering a handler for an already-registered field type replaces the previous handler
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: register handler, get by type, get non-existent returns undefined, has returns correct boolean, getRegisteredTypes returns array of keys)

---

### Task 5: Schema Validator

**Priority:** P0 (prerequisite for FormRunner)  
**Estimated time:** 10 min  
**FR:** FR-039, Edge Cases 17, 19  
**Dependencies:** Task 0, Task 1, Task 4

**Files to create:**

- `packages/input-engine/src/runner/schema.validator.ts`

**Test file:** `packages/input-engine/tests/unit/schema.validator.test.ts`

**Acceptance criteria:**

- [ ] `validateSchema(schema, registry)` function exported — returns `Result<void, AppError>`
- [ ] Validates that all field schemas in the z.object have registry metadata via `z.globalRegistry.get(schema)`
- [ ] Detects duplicate field names → returns `err(AppError(INPUT_ENGINE_ERRORS.SCHEMA_INVALID))`
- [ ] Detects missing i18n keys → returns `err(AppError(INPUT_ENGINE_ERRORS.SCHEMA_INVALID))`
- [ ] Detects unknown field types (not in FieldHandlerRegistry) → returns `err(AppError(INPUT_ENGINE_ERRORS.FIELD_TYPE_UNKNOWN))`
- [ ] Detects circular conditional dependencies (Field A depends on Field B depends on Field A) → returns `err(AppError(INPUT_ENGINE_ERRORS.SCHEMA_CIRCULAR_DEPENDENCY))`
- [ ] Validation time < 10ms for schemas with up to 50 fields (NFR-006)
- [ ] No `any` types
- [ ] All tests pass (minimum 7 tests: valid schema passes, duplicate field names detected, missing i18n key detected, unknown field type detected, circular dependency detected, multiple errors reported, empty schema passes)

---

### Task 6: FormRunner Core

**Priority:** P0 (orchestrates all field interactions)  
**Estimated time:** 25 min  
**FR:** FR-001, FR-004, FR-005, FR-006, FR-007, FR-038, FR-041, FR-042  
**Dependencies:** Task 1, Task 2, Task 3, Task 4, Task 5

**Files to create:**

- `packages/input-engine/src/runner/form.runner.ts`

**Test file:** `packages/input-engine/tests/unit/form.runner.test.ts`

**Acceptance criteria:**

- [ ] `runForm(conversation, ctx, schema, options?)` function exported — returns `AsyncResult<T, AppError>` where T is inferred from the Zod schema
- [ ] First check: toggle guard — if disabled returns `err(AppError('input-engine.disabled'))` with zero side effects
- [ ] Second check: schema validation via `validateSchema()` — returns err if invalid
- [x] Check for existing partial save — if found and `partialSave: true`, resume from checkpoint (F2)
- [ ] For each field: evaluate conditions → delegate to FieldHandler.render → wait for response → FieldHandler.parseResponse → FieldHandler.validate → save partial state
- [ ] Handle `/cancel` at any point via `otherwise` callback — returns `err(AppError('input-engine.form.cancelled'))`
- [x] Handle timeout via `maxMilliseconds` (default 10 min) — returns `err(AppError('input-engine.form.timeout'))` (F3)
- [ ] Handle invalid input retry up to `maxRetries` (default 3) — on exceed: skip if optional, or return `err(AppError('input-engine.field.max_retries'))`
- [ ] All user-facing text via i18n keys (Rule XXXIX) — zero hardcoded text
- [ ] Use `encodeCallbackData` from `@tempot/ux-helpers` for all callback data (FR-041)
- [ ] Set/clear `activeConversation` in session-manager (FR-042)
- [x] Emit lifecycle events via fire-and-log: `form.completed`, `form.cancelled`, `form.resumed`, `field.validated` (F1)
- [x] Clean up partial save on successful completion (F2)
- [ ] Auto-generate `formId` (UUID) if not provided in options
- [ ] No `any` types
- [ ] All tests pass (minimum 12 tests: simple form success, schema validation failure, toggle disabled, cancel handling, timeout handling, max retries skip optional, max retries cancel required, partial save write, partial save resume, conditional field skip, event emission, session tracking)

**Checkpoint**: Foundation ready — all field handler implementations can now begin. FormRunner provides the orchestration loop; field handlers provide the render/parse/validate logic.

---

## Phase 3: User Story 1 — Simple Form Collection (Priority: P1)

**Goal**: Developers can define Zod schemas with registry metadata and call `runForm()` to collect ShortText, Integer, and SingleChoice data with full i18n validation.

**Independent Test**: Define a 3-field schema (ShortText + Integer + SingleChoice), call `runForm()`, verify the bot asks each question, validates input, and returns typed `Result<FormData, AppError>`.

### Task 7: [P] [US1] ShortText Field Handler

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-008  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/text/short-text.field.ts`

**Test file:** `packages/input-engine/tests/unit/short-text.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'ShortText'`
- [ ] `render()`: sends i18n prompt message via `conversation.form.build()` or direct message
- [ ] `parseResponse()`: extracts text from message, returns `ok(string)` or `err(FIELD_PARSE_FAILED)`
- [ ] `validate()`: validates via Zod schema (min/max length from metadata), returns `ok(string)` or `err(FIELD_VALIDATION_FAILED)`
- [ ] Trims whitespace from user input
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: valid input, too short, too long, empty input on required field, whitespace trimming)

---

### Task 8: [P] [US1] LongText Field Handler

**Priority:** P1  
**Estimated time:** 8 min  
**FR:** FR-009  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/text/long-text.field.ts`

**Test file:** `packages/input-engine/tests/unit/long-text.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'LongText'`
- [ ] `render()`: sends i18n prompt with multi-line hint
- [ ] `parseResponse()`: extracts text, supports multi-line (newlines preserved)
- [ ] `validate()`: validates via Zod schema with `maxLength` constraint
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid multi-line input, exceeds maxLength, empty input, preserves newlines)

---

### Task 9: [P] [US1] Email Field Handler

**Priority:** P1  
**Estimated time:** 8 min  
**FR:** FR-010  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/text/email.field.ts`

**Test file:** `packages/input-engine/tests/unit/email.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Email'`
- [ ] `validate()`: validates via Zod `.email()` — RFC-compliant email validation
- [ ] Normalizes to lowercase before validation
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid email, invalid format, uppercase normalization, empty on required)

---

### Task 10: [P] [US1] Phone Field Handler

**Priority:** P1  
**Estimated time:** 8 min  
**FR:** FR-011  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/text/phone.field.ts`

**Test file:** `packages/input-engine/tests/unit/phone.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Phone'`
- [ ] `validate()`: validates international phone format including country code (e.g., `+201234567890`)
- [ ] Strips common formatting characters (spaces, dashes, parentheses) before validation
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid international number, missing country code, letters in input, formatting stripped)

---

### Task 11: [P] [US1] URL Field Handler

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-012  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/text/url.field.ts`

**Test file:** `packages/input-engine/tests/unit/url.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'URL'`
- [ ] `validate()`: validates via Zod `.url()` — valid URL format
- [ ] No `any` types
- [ ] All tests pass (minimum 3 tests: valid URL, invalid format, empty on required)

---

### Task 12: [P] [US1] RegexValidated Field Handler

**Priority:** P1  
**Estimated time:** 8 min  
**FR:** FR-013  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/text/regex-validated.field.ts`

**Test file:** `packages/input-engine/tests/unit/regex-validated.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'RegexValidated'`
- [ ] `validate()`: validates text against `metadata.pattern` (RegExp)
- [ ] Returns `err(FIELD_VALIDATION_FAILED)` when pattern is missing from metadata
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: matches pattern, doesn't match, missing pattern in metadata, empty input)

---

### Task 13: [P] [US1] Integer Field Handler

**Priority:** P1  
**Estimated time:** 8 min  
**FR:** FR-014  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/numbers/integer.field.ts`

**Test file:** `packages/input-engine/tests/unit/integer.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Integer'`
- [ ] `parseResponse()`: parses text to integer via `parseInt`, returns `err(FIELD_PARSE_FAILED)` for non-numeric text
- [ ] `validate()`: validates via Zod `.int()` with optional `.min()` / `.max()` from metadata
- [ ] Rejects float values (e.g., "3.5" for integer field)
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: valid integer, non-numeric text, float rejected, below min, above max)

---

### Task 14: [P] [US1] Float Field Handler

**Priority:** P1  
**Estimated time:** 8 min  
**FR:** FR-015  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/numbers/float.field.ts`

**Test file:** `packages/input-engine/tests/unit/float.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Float'`
- [ ] `parseResponse()`: parses text to float via `parseFloat`, returns `err(FIELD_PARSE_FAILED)` for non-numeric
- [ ] `validate()`: validates via Zod with optional min/max and decimal precision
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid float, non-numeric, below min, above max)

---

### Task 15: [P] [US1] Currency Field Handler

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-016, Edge Case 14  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/numbers/currency.field.ts`

**Test file:** `packages/input-engine/tests/unit/currency.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Currency'`
- [ ] `parseResponse()`: normalizes locale-specific formatting — handles both English "1,000.50" and Arabic "١٬٠٠٠٫٥٠" number formats
- [ ] `validate()`: validates via Zod with min/max amount constraints
- [ ] Strips currency symbols before parsing
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: English format, Arabic numeral format, currency symbol stripped, below min, above max)

---

### Task 16: [P] [US1] Percentage Field Handler

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-017  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/numbers/percentage.field.ts`

**Test file:** `packages/input-engine/tests/unit/percentage.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Percentage'`
- [ ] `validate()`: validates via Zod `.min(0).max(100)`
- [ ] Strips `%` suffix if present before parsing
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid percentage, below 0, above 100, strips % symbol)

---

### Task 17: [P] [US1] SingleChoice Field Handler

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-018  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/choice/single-choice.field.ts`

**Test file:** `packages/input-engine/tests/unit/single-choice.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'SingleChoice'`
- [ ] `render()`: for ≤8 options, uses `createInlineKeyboard` from `@tempot/ux-helpers`; for >8 options, uses `buildPagination`
- [ ] Uses `encodeCallbackData` for callback data with form-instance-specific prefix (FR-041)
- [ ] `parseResponse()`: decodes callback data to extract selected value
- [ ] `validate()`: validates selected value is in the options list
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: select valid option, invalid callback data, option not in list, ≤8 options renders inline keyboard, >8 options renders paginated)

---

### Task 18: [P] [US1] BooleanToggle Field Handler

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-020  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/choice/boolean-toggle.field.ts`

**Test file:** `packages/input-engine/tests/unit/boolean-toggle.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'BooleanToggle'`
- [ ] `render()`: shows exactly two inline buttons (yes/no) via `createInlineKeyboard`
- [ ] Button labels are i18n keys
- [ ] `parseResponse()`: decodes callback to `true` / `false`
- [ ] No `any` types
- [ ] All tests pass (minimum 3 tests: select yes → true, select no → false, renders exactly 2 buttons)

**Checkpoint**: User Story 1 core fields (ShortText, Integer, SingleChoice, BooleanToggle) are functional. A developer can define a simple form and collect type-safe data.

---

## Phase 4: User Story 2 — Complex Form with Partial Save (Priority: P1)

**Goal**: Long forms (7+ fields) with automatic progress saving. Users can resume after interruption.

**Independent Test**: Start a 5-field form with `partialSave: true`, complete 3 fields, simulate restart, verify resume from field 4.

### Task 19: [US2] MultipleChoice Field Handler

**Priority:** P1  
**Estimated time:** 12 min  
**FR:** FR-019, Edge Case 12  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/choice/multiple-choice.field.ts`

**Test file:** `packages/input-engine/tests/unit/multiple-choice.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'MultipleChoice'`
- [ ] `render()`: shows toggle buttons for each option + confirm button via `createInlineKeyboard`
- [ ] Toggles track selected/deselected state (visual indicator in button label)
- [ ] `parseResponse()`: collects selected values into array
- [ ] `validate()`: validates against `minSelections` / `maxSelections` from metadata
- [ ] Edge case: confirm with 0 selections when `minSelections: 1` → shows i18n error
- [ ] Edge case: confirm with 0 selections when `minSelections: 0` → returns empty array
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: select multiple, deselect toggle, confirm with valid count, below minSelections, above maxSelections, empty selection when allowed)

---

### Task 20: [P] [US2] SearchableList Field Handler

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-021, Edge Case 8  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/choice/searchable-list.field.ts`

**Test file:** `packages/input-engine/tests/unit/searchable-list.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'SearchableList'`
- [ ] `render()`: prompts user to type search query, loads options lazily via `metadata.dataSource()`
- [ ] Displays matching results with `buildPagination` from `@tempot/ux-helpers`
- [ ] Server-side filtering — never loads all 10K+ items into memory (Edge Case 8)
- [ ] User can refine search or select from displayed results
- [ ] Pagination response < 200ms for up to 10,000 items (NFR-003)
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: search and select, no results found, pagination navigation, dataSource error handled, large dataset performance)

---

### Task 21: [P] [US2] Callback Data Utils

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-041, Edge Case 7, Research Decision 11  
**Dependencies:** Task 1

**Files to create:**

- `packages/input-engine/src/utils/callback-data.utils.ts`

**Test file:** (Tested inline with field handler tests)

**Acceptance criteria:**

- [ ] Helper functions for form-specific callback data: `encodeFormCallback(formId, fieldName, value)`, `decodeFormCallback(data)`, `isFormCallback(data, formId)`
- [ ] Uses `encodeCallbackData` / `decodeCallbackData` from `@tempot/ux-helpers` internally
- [ ] Callback format: `ie:{formId}:{fieldName}:{value}` — prevents collision between concurrent form instances (Edge Case 7)
- [ ] Respects Telegram's 64-byte callback data limit
- [ ] No `any` types

**Checkpoint**: Partial save infrastructure (Task 3) + choice fields + callback utils enable long forms with save/resume.

---

## Phase 5: User Story 3 — AIExtractorField (Priority: P2)

**Goal**: Users can send free-text and have multiple field values extracted via AI, with confirmation and fallback to manual input.

**Independent Test**: Define AIExtractorField targeting 3 sub-fields, send natural language, verify extraction + confirmation + fallback.

### Task 22: [US3] ConditionalField (Smart)

**Priority:** P2  
**Estimated time:** 10 min  
**FR:** FR-030, Edge Cases 17, 19  
**Dependencies:** Task 4, Task 5

**Files to create:**

- `packages/input-engine/src/fields/smart/conditional.field.ts`

**Test file:** `packages/input-engine/tests/unit/conditional.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'ConditionalField'`
- [ ] Evaluates `metadata.conditions` against previously collected `formData`
- [ ] Operators: `equals`, `notEquals`, `in`, `gt`, `lt`, `custom` (via `fn()`)
- [ ] When condition met → delegates to the wrapped field's handler for render/parse/validate
- [ ] When condition NOT met → skips field, returns `ok(undefined)`
- [ ] Circular dependencies already caught by schema validator (Task 5)
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: condition met shows field, condition not met skips, equals operator, custom fn operator, multiple conditions AND logic, field value used in evaluation)

---

### Task 23: [US3] AIExtractorField (Smart)

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-031, Edge Cases 3, 13, Rule XXXIII  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/smart/ai-extractor.field.ts`

**Test file:** `packages/input-engine/tests/unit/ai-extractor.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'AIExtractorField'`
- [ ] Uses `AIExtractionClient` structural interface (from contracts) — no direct `@tempot/ai-core` import
- [ ] `render()`: prompts user to send free-text or voice message for multi-value extraction
- [ ] Calls `AIExtractionClient.extract(input, targetFields)` via `conversation.external()`
- [ ] On successful extraction: displays extracted values for user confirmation (i18n formatted)
- [ ] On partial extraction: accepts extracted values, asks remaining fields manually
- [ ] On AI unavailability (`isAvailable() === false` or circuit breaker open): falls back to manual step-by-step input (Rule XXXIII, SC-007)
- [ ] Fallback detected within 1s of AI unavailability (SC-007)
- [ ] On user rejection of AI extraction: switches to manual input for all target fields
- [ ] On malformed AI response: validates extracted values against Zod schemas, treats invalid as missing (Edge Case 13)
- [ ] No `any` types
- [ ] All tests pass (minimum 8 tests: full extraction success, partial extraction, AI unavailable fallback, user rejects extraction, malformed response handled, all target fields extracted, no target fields extracted, confirmation UI rendered)

---

## Phase 6: User Story 4 — GeoSelectField (Priority: P2)

**Goal**: Hierarchical state/city selection using regional-engine data.

**Independent Test**: Render GeoSelectField, select state, select city, verify GeoOption returned.

### Task 24: [P] [US4] GeoSelectField Handler

**Priority:** P2  
**Estimated time:** 12 min  
**FR:** FR-032  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/geo/geo-select.field.ts`

**Test file:** `packages/input-engine/tests/unit/geo-select.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'GeoSelectField'`
- [ ] Uses `RegionalClient` structural interface (from contracts) — no direct `@tempot/regional-engine` import
- [ ] `render()`: loads states from `RegionalClient.getStates()`, displays as paginated inline keyboard via `buildPagination`
- [ ] On state selection: loads cities from `RegionalClient.getCities(stateId)`, displays second-level keyboard
- [ ] On city selection: returns `ok(GeoOption)` with state + city data
- [ ] Handles `GEO_LOAD_FAILED` error gracefully — shows i18n error message
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: full state→city flow, state list pagination, city list pagination, geo load failure handled, selection returns GeoOption)

---

### Task 25: [P] [US4] GeoAddressField Handler

**Priority:** P2  
**Estimated time:** 8 min  
**FR:** FR-033  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/geo/geo-address.field.ts`

**Test file:** `packages/input-engine/tests/unit/geo-address.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'GeoAddressField'`
- [ ] `render()`: prompts for free-text address input
- [ ] `parseResponse()`: extracts text from message
- [ ] `validate()`: validates via Zod schema (non-empty string, optional format constraints)
- [ ] No `any` types
- [ ] All tests pass (minimum 3 tests: valid address, empty address on required, whitespace-only rejected)

---

## Phase 7: User Story 5 — Identity and Interactive Fields (Priority: P2)

**Goal**: Specialized fields for identity documents and interactive data collection.

**Independent Test**: Form with NationalID + StarRating, verify 14-digit validation and emoji button rendering.

### Task 26: [P] [US5] NationalID Field Handler

**Priority:** P2  
**Estimated time:** 12 min  
**FR:** FR-034, Edge Cases 28, 29  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/identity/national-id.field.ts`

**Test file:** `packages/input-engine/tests/unit/national-id.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'NationalID'`
- [ ] `validate()`: validates against `metadata.pattern` (default: Egyptian 14-digit `/^\d{14}$/`)
- [ ] Default pattern applied when `metadata.pattern` is not provided
- [ ] Checksum validation for Egyptian national IDs (always performed)
- [ ] When `metadata.extractData: true`: extracts birth date (digits 1-7), governorate (digits 8-9), gender (digit 13: odd=male, even=female)
- [ ] When `extractData: true`: returns `NationalIDResult { id, birthDate?, governorate?, gender? }` instead of plain string
- [ ] When `extractData: false` (default): returns plain validated string (backward compatible)
- [ ] Rejects IDs with invalid checksum with `NATIONAL_ID_CHECKSUM_FAILED` error
- [ ] Rejects IDs where extracted birth date is in the future with `NATIONAL_ID_FUTURE_DATE` error
- [ ] No `any` types
- [ ] All tests pass (minimum 8 tests: valid 14-digit, too few digits, letters included, custom pattern override, checksum validation, data extraction with extractData:true, future birth date rejected, extractData:false returns string)

---

### Task 27: [P] [US5] PassportNumber Field Handler

**Priority:** P2  
**Estimated time:** 5 min  
**FR:** FR-035  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/identity/passport.field.ts`

**Test file:** `packages/input-engine/tests/unit/passport.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'PassportNumber'`
- [ ] `validate()`: validates against configurable format pattern from `metadata.pattern`
- [ ] No `any` types
- [ ] All tests pass (minimum 3 tests: valid passport number, invalid format, custom pattern)

---

### Task 28: [P] [US5] StarRating Field Handler

**Priority:** P2  
**Estimated time:** 8 min  
**FR:** FR-036, Edge Case 21  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/interactive/star-rating.field.ts`

**Test file:** `packages/input-engine/tests/unit/star-rating.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'StarRating'`
- [ ] `render()`: displays emoji number buttons using `EMOJI_NUMBERS` from `@tempot/ux-helpers`
- [ ] Default scale: `min: 1, max: 5` (from metadata)
- [ ] Custom scale support: e.g., `min: 0, max: 10` with paginated rows per `ROW_LIMITS` (Edge Case 21)
- [ ] `parseResponse()`: decodes callback data to numeric rating value
- [ ] `validate()`: validates rating is within min/max range
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: select rating, default 1-5 scale, custom 0-10 scale pagination, below min rejected, above max rejected)

---

### Task 29: [P] [US5] MultiStepChoice Field Handler

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-037, Edge Case 20  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/interactive/multi-step-choice.field.ts`

**Test file:** `packages/input-engine/tests/unit/multi-step-choice.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'MultiStepChoice'`
- [ ] Renders hierarchical levels from `metadata.levels` — each level is a paginated inline keyboard
- [ ] Supports both static `options` and dynamic `dataSource` per level
- [ ] Breadcrumb navigation shows current selection path (i18n formatted)
- [ ] Final selection includes full path value
- [ ] Supports arbitrary depth; logs developer warning at 5+ levels (Edge Case 20)
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: 2-level selection, 3-level selection, dynamic dataSource, breadcrumb display, 5+ level warning logged, back navigation)

---

## Phase 8: User Story 6 — Media Fields (Priority: P2)

**Goal**: Upload photos, documents, videos, audio with validation. FileGroup for multi-file collection.

**Independent Test**: Photo field with maxSizeKB, upload valid/invalid files, verify validation and storage.

### Task 30: [P] [US6] Photo Field Handler

**Priority:** P2  
**Estimated time:** 10 min  
**FR:** FR-026, Edge Case 15  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/media/photo.field.ts`

**Test file:** `packages/input-engine/tests/unit/photo.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Photo'`
- [ ] `render()`: prompts user to send a photo with i18n constraints description
- [ ] `parseResponse()`: extracts photo from message, gets file info from Telegram API
- [ ] `validate()`: validates `maxSizeKB` and `allowedTypes` from metadata
- [ ] When `StorageEngineClient` available: uploads via `StorageEngineClient.upload()`, returns file reference
- [ ] When `StorageEngineClient` unavailable: returns raw Telegram file metadata (graceful degradation, US6 scenario 4)
- [ ] `preserveQuality: true`: requests uncompressed via document type (Edge Case 15)
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: valid photo upload, size exceeded, type not allowed, storage-engine upload, fallback without storage-engine, preserveQuality flag)

---

### Task 31: [P] [US6] Document Field Handler

**Priority:** P2  
**Estimated time:** 8 min  
**FR:** FR-027  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/media/document.field.ts`

**Test file:** `packages/input-engine/tests/unit/document.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Document'`
- [ ] `validate()`: validates `allowedExtensions` and `maxSizeKB` from metadata
- [ ] Rejects files with non-allowed extensions with i18n error listing allowed extensions (US6 scenario 2)
- [ ] Integration with `StorageEngineClient` when available
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: valid document, wrong extension, size exceeded, storage upload, fallback without storage)

---

### Task 32: [P] [US6] Video Field Handler

**Priority:** P2  
**Estimated time:** 8 min  
**FR:** FR-028  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/media/video.field.ts`

**Test file:** `packages/input-engine/tests/unit/video.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Video'`
- [ ] `validate()`: validates `maxSizeKB` and `maxDurationSeconds` from metadata
- [ ] Returns `err(MEDIA_DURATION_EXCEEDED)` when duration exceeds limit
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid video, size exceeded, duration exceeded, storage upload)

---

### Task 33: [P] [US6] Audio Field Handler

**Priority:** P2  
**Estimated time:** 8 min  
**FR:** FR-028  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/media/audio.field.ts`

**Test file:** `packages/input-engine/tests/unit/audio.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Audio'`
- [ ] `validate()`: validates `maxSizeKB` and `maxDurationSeconds` from metadata
- [ ] Returns `err(MEDIA_DURATION_EXCEEDED)` when duration exceeds limit
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid audio, size exceeded, duration exceeded, storage upload)

---

### Task 34: [P] [US6] FileGroup Field Handler

**Priority:** P2  
**Estimated time:** 12 min  
**FR:** FR-029, Edge Case 18  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/media/file-group.field.ts`

**Test file:** `packages/input-engine/tests/unit/file-group.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'FileGroup'`
- [ ] `render()`: prompts user to upload files with "add more or finish" buttons
- [ ] Collects multiple files in a loop until user taps "finish" or reaches `maxFiles`
- [ ] `validate()`: validates `minFiles` / `maxFiles` from metadata
- [ ] Individual file upload timeout — single file failure doesn't lose previously uploaded files (Edge Case 18)
- [ ] Returns array of file references
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: upload 2 files, below minFiles rejected, at maxFiles auto-finish, single file timeout retry, finish with valid count, per-file validation)

---

## Phase 9: Time/Place Fields (Part of US1/US2)

**Goal**: Date, time, location, and date range collection with interactive UIs.

### Task 35: [P] DatePicker Field Handler

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-022, Edge Case 9  
**Dependencies:** Task 4, Task 1 (contracts)

**Files to create:**

- `packages/input-engine/src/fields/time-place/date-picker.field.ts`

**Test file:** `packages/input-engine/tests/unit/date-picker.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'DatePicker'`
- [ ] `render()`: displays interactive calendar via inline keyboard buttons (month view)
- [ ] Month/year navigation buttons (previous month, next month)
- [ ] `min`/`max` date constraints from metadata — disable out-of-range dates
- [ ] Uses `DateService` from `@tempot/regional-engine` (via `RegionalClient`) for locale-aware date formatting
- [ ] Handles Feb 29 on non-leap years (Edge Case 9)
- [ ] Calendar rendering < 150ms per month view (NFR-004)
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: select valid date, before min rejected, after max rejected, month navigation, Feb 29 leap year, non-leap year February)

---

### Task 36: [P] TimePicker Field Handler

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-023, Edge Case 10  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/time-place/time-picker.field.ts`

**Test file:** `packages/input-engine/tests/unit/time-picker.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'TimePicker'`
- [ ] `render()`: shows hour/minute selection buttons or accepts text input in HH:MM format
- [ ] Default: 24-hour format. When `metadata.use12Hour: true`: renders AM/PM toggle buttons (Edge Case 10)
- [ ] `parseResponse()`: parses time from callback or text (HH:MM)
- [ ] `validate()`: validates time is a valid time value
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: select via buttons, text input HH:MM, 12-hour AM/PM toggle, invalid time format, edge case 23:59)

---

### Task 37: [P] Location Field Handler

**Priority:** P1  
**Estimated time:** 8 min  
**FR:** FR-024, Edge Case 11  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/time-place/location.field.ts`

**Test file:** `packages/input-engine/tests/unit/location.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Location'`
- [ ] `render()`: prompts user to share GPS location or type address
- [ ] `parseResponse()`: handles both `message.location` (GPS) and `message.text` (address fallback, Edge Case 11)
- [ ] Returns location data (latitude/longitude for GPS, text for address)
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: GPS location shared, text address fallback, empty input rejected, location data format)

---

### Task 38: [P] DateRange Field Handler

**Priority:** P2  
**Estimated time:** 10 min  
**FR:** FR-025  
**Dependencies:** Task 4, Task 35 (DatePicker)

**Files to create:**

- `packages/input-engine/src/fields/time-place/date-range.field.ts`

**Test file:** `packages/input-engine/tests/unit/date-range.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'DateRange'`
- [ ] Renders two DatePicker instances: start date then end date
- [ ] `validate()`: validates that end date ≥ start date
- [ ] Returns `{ startDate, endDate }` object
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: valid range, end before start rejected, same date allowed, uses DatePicker for both)

---

## Phase 10: Cross-Cutting & Polish

**Purpose**: Event registration, barrel exports, and final validation.

### Task 39: Event Registration (Cross-Package)

**Priority:** P1 (cross-package modification)  
**Estimated time:** 5 min  
**FR:** Spec § Event Payloads  
**Dependencies:** Task 1

**Files to modify:**

- `packages/event-bus/src/event-bus.events.ts`

**Test file:** N/A (type-level change — validated by TypeScript compilation)

**Acceptance criteria:**

- [ ] `TempotEvents` interface updated with `'input-engine.form.completed'` event with inline payload: `formId`, `userId`, `fieldCount`, `durationMs`, `hadPartialSave`
- [x] `TempotEvents` interface updated with `'input-engine.form.cancelled'` event with inline payload: `formId`, `userId`, `fieldsCompleted`, `totalFields`, `reason` ('user_cancel'|'timeout'|'max_retries') (F3)
- [x] `TempotEvents` interface updated with `'input-engine.form.resumed'` event with inline payload: `formId`, `userId`, `resumedFromField`, `totalFields` (F1)
- [ ] `TempotEvents` interface updated with `'input-engine.field.validated'` event with inline payload: `formId`, `userId`, `fieldType`, `fieldName`, `valid`, `retryCount`
- [ ] Payload types defined **inline** in event-bus.events.ts — do NOT import from `@tempot/input-engine` (avoids circular dependency)
- [ ] No other files in `packages/event-bus/` are modified
- [ ] TypeScript compilation passes with no errors

---

### Task 40: Barrel Exports (`src/index.ts`)

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** All (final integration)  
**Dependencies:** All Tasks 1–48

**Files to update:**

- `packages/input-engine/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [ ] Exports `runForm` function from `form.runner.ts`
- [ ] Exports all types: `FieldType`, `FieldMetadata`, `FieldCondition`, `ChoiceOption`, `MultiStepLevel`, `FormOptions`
- [ ] Exports `DEFAULT_FORM_OPTIONS` constant
- [ ] Exports structural interfaces: `StorageEngineClient`, `AIExtractionClient`, `RegionalClient`, `InputEngineLogger`, `InputEngineEventBus`
- [ ] Exports `INPUT_ENGINE_ERRORS` constant
- [ ] Exports config functions: `isInputEngineEnabled`, `guardEnabled`, `guardEnabledAsync`
- [ ] Exports `FieldHandler` interface and `FieldHandlerRegistry` class
- [ ] Exports `ConversationsStorageAdapter` class
- [ ] Exports `validateSchema` function
- [ ] All relative imports use `.js` extensions (ESM/NodeNext compliance)
- [ ] Exports new types: `TimeSlot`, `CountryCode`, `NationalIDResult`, `ContactResult`, `SchedulePickerResult`, `EgyptianMobileResult`, `CurrencyAmountResult`
- [ ] Exports all 39 field handler implementations registered in `FieldHandlerRegistry`
- [ ] All existing tests still pass after barrel update
- [ ] 10-point package-creation-checklist passes final verification
- [ ] No `any` types in any file across the package
- [ ] No `console.*` in any file across the package

---

### Task 41: [P] CurrencyAmount Field Handler

**Priority:** P2  
**Estimated time:** 10 min  
**FR:** FR-047, Edge Case 35  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/numbers/currency-amount.field.ts`

**Test file:** `packages/input-engine/tests/unit/currency-amount.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'CurrencyAmount'`
- [ ] Currency determined from config: (1) `metadata.currency`, (2) `DEFAULT_CURRENCY` env var, (3) fallback 'EGP'
- [ ] `parseResponse()`: normalizes Arabic numerals (٠-٩) to Western (0-9) before parsing
- [ ] `validate()`: validates amount via Zod with min/max and `decimalPlaces` constraints
- [ ] Returns `CurrencyAmountResult { amount, currency }`
- [ ] Supports `allowedCurrencies` validation if configured
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: valid amount, Arabic numeral normalization, currency from metadata, currency from env, below min, decimal places validation)

---

### Task 42: [P] IBAN Field Handler

**Priority:** P2  
**Estimated time:** 12 min  
**FR:** FR-045, Edge Cases 25, 26  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/identity/iban.field.ts`

**Test file:** `packages/input-engine/tests/unit/iban.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'IBAN'`
- [ ] Strips spaces and converts to uppercase before validation
- [ ] Validates format: 2-letter country code + 2 check digits + up to 30 alphanumeric BBAN
- [ ] Validates MOD-97 checksum per ISO 7064 MOD 97-10 algorithm
- [ ] Validates country-specific BBAN length (e.g., EG = 29 chars total)
- [ ] Supports `defaultCountry` (default: 'EG') and `allowedCountries` config
- [ ] Returns `err(IBAN_INVALID_CHECKSUM)` for invalid check digits
- [ ] Returns `err(IBAN_COUNTRY_NOT_ALLOWED)` when country not in allowed list
- [ ] No `any` types
- [ ] All tests pass (minimum 7 tests: valid EG IBAN, valid non-EG IBAN, invalid checksum, wrong length, country not allowed, spaces stripped, lowercase converted)

---

### Task 43: [P] EgyptianMobile Field Handler

**Priority:** P2  
**Estimated time:** 10 min  
**FR:** FR-046, Edge Case 27  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/identity/egyptian-mobile.field.ts`

**Test file:** `packages/input-engine/tests/unit/egyptian-mobile.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'EgyptianMobile'`
- [ ] `render()`: shows inline keyboard for country code selection (+20 default from `metadata.defaultCountryCode`)
- [ ] Validates 01x-xxxx-xxxx format (11 digits starting with 01)
- [ ] Detects operator from prefix: 010→Vodafone, 011→Etisalat, 012→Orange, 015→WE
- [ ] Unknown prefix (e.g., 016) accepted but `operator` set to `undefined`
- [ ] Returns `EgyptianMobileResult { number, countryCode, operator? }`
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: valid Vodafone number, valid Etisalat, unknown prefix accepted, invalid format rejected, country code selection, operator detection)

---

### Task 44: [P] SchedulePicker Field Handler

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-043, Edge Cases 32, 33  
**Dependencies:** Task 4, Task 35 (DatePicker)

**Files to create:**

- `packages/input-engine/src/fields/time-place/schedule-picker.field.ts`

**Test file:** `packages/input-engine/tests/unit/schedule-picker.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'SchedulePicker'`
- [ ] `render()`: first renders DatePicker for date selection, then shows available slots for that date as inline keyboard
- [ ] Supports static `metadata.availableSlots` and dynamic `metadata.slotDataSource(date)` for slot loading
- [ ] Shows only `available: true` slots
- [ ] Handles no available slots: shows i18n message, asks user to pick different date (Edge Case 32)
- [ ] Handles slot becoming unavailable between render and selection: re-fetches and shows error (Edge Case 33)
- [ ] Returns `SchedulePickerResult { date, time, slotId? }`
- [ ] No `any` types
- [ ] All tests pass (minimum 7 tests: valid slot selection, static slots, dynamic slotDataSource, no available slots, slot unavailable race, slot filtering, result format)

---

### Task 45: [P] QRCode Field Handler

**Priority:** P2  
**Estimated time:** 10 min  
**FR:** FR-048, Edge Cases 23, 24  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/interactive/qr-code.field.ts`

**Test file:** `packages/input-engine/tests/unit/qr-code.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'QRCode'`
- [ ] `render()`: prompts user to send a photo containing a QR code
- [ ] `parseResponse()`: extracts photo from message, decodes QR code data
- [ ] Returns `err(QR_DECODE_FAILED)` when QR cannot be decoded from photo (Edge Case 23)
- [ ] Validates decoded data against `metadata.expectedFormat` ('url' | 'text' | 'json' | 'any')
- [ ] Returns `err(QR_FORMAT_MISMATCH)` when decoded format doesn't match expected (Edge Case 24)
- [ ] Graceful retry on decode failure — shows i18n error asking for clearer photo
- [ ] Returns decoded string on success
- [ ] No `any` types
- [ ] All tests pass (minimum 6 tests: valid QR decode, decode failure, format mismatch, any format accepts all, retry on failure, photo without QR)

---

### Task 46: [P] Toggle Field Handler

**Priority:** P2  
**Estimated time:** 5 min  
**FR:** FR-049  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/interactive/toggle.field.ts`

**Test file:** `packages/input-engine/tests/unit/toggle.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Toggle'`
- [ ] `render()`: shows two inline buttons with ✓/✗ prefix (on/off)
- [ ] Button labels from `metadata.onLabel` / `metadata.offLabel` (i18n keys), defaults to generic on/off
- [ ] Single tap to select — no separate confirm step (unlike BooleanToggle)
- [ ] Supports `metadata.defaultValue` for pre-selected state (visual indicator)
- [ ] `parseResponse()`: decodes callback to boolean
- [ ] Returns boolean value
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: select on → true, select off → false, custom labels, default value display)

---

### Task 47: [P] Tags Field Handler

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-050, Edge Cases 30, 31  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/interactive/tags.field.ts`

**Test file:** `packages/input-engine/tests/unit/tags.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Tags'`
- [ ] `render()`: shows current tags as removable inline buttons + "done" button + prompt to type new tag
- [ ] Supports `metadata.predefinedTags` as selectable buttons (when `allowCustom: true`, also accepts typed tags)
- [ ] Add flow: user types tag → added to list → re-render with updated tags
- [ ] Remove flow: user taps existing tag button → removed from list → re-render
- [ ] Rejects duplicate tags with i18n error (case-insensitive comparison, Edge Case 30)
- [ ] Rejects tags longer than `metadata.maxTagLength` with i18n error (Edge Case 31)
- [ ] `validate()`: validates `minTags` / `maxTags` from metadata
- [ ] Returns `string[]`
- [ ] No `any` types
- [ ] All tests pass (minimum 8 tests: add single tag, add multiple, remove tag, duplicate rejected, max length exceeded, below minTags, above maxTags, predefined tags selection)

---

### Task 48: [P] Contact Field Handler

**Priority:** P2  
**Estimated time:** 8 min  
**FR:** FR-044, Edge Case 34  
**Dependencies:** Task 4

**Files to create:**

- `packages/input-engine/src/fields/media/contact.field.ts`

**Test file:** `packages/input-engine/tests/unit/contact.field.test.ts`

**Acceptance criteria:**

- [ ] Implements `FieldHandler` interface with `fieldType: 'Contact'`
- [ ] `render()`: shows ReplyKeyboardMarkup (NOT inline keyboard) with "Share Contact" button using `request_contact: true`
- [ ] `parseResponse()`: extracts `message.contact` data (phoneNumber, firstName, lastName, userId)
- [ ] Returns `err(CONTACT_NOT_SHARED)` when user sends text instead of contact (Edge Case 34)
- [ ] Returns `ContactResult { phoneNumber, firstName, lastName?, userId? }`
- [ ] Removes ReplyKeyboardMarkup after contact is received (cleanup)
- [ ] No `any` types
- [ ] All tests pass (minimum 5 tests: valid contact shared, text sent instead of contact, contact with all fields, contact without optional fields, keyboard cleanup)

---

## Task Dependency Graph

```
Task 0 (scaffolding)
  └─→ Task 1 (types/contracts/errors)
        ├─→ Task 2 (toggle guard)
        ├─→ Task 3 (storage adapter)
        ├─→ Task 4 (FieldHandler interface)
        │     ├─→ Task 5 (schema validator) ←── T4
        │     │     └─→ Task 6 (FormRunner) ←── T1,T2,T3,T4,T5
        │     │
        │     ├─→ Tasks 7-12 [P] (text fields)        ─┐
        │     ├─→ Tasks 13-16 [P] (number fields)      ─┤── Phase 3 (US1)
        │     ├─→ Task 41 [P] (currency-amount) ←── T4   ─── Numbers
        │     ├─→ Tasks 17-18 [P] (choice: single, bool)─┘
        │     │
        │     ├─→ Task 19 (multiple choice)             ─┐
        │     ├─→ Task 20 [P] (searchable list)          ─┤── Phase 4 (US2)
        │     └─→ Task 21 [P] (callback data utils) ←── T1─┘
        │
        │     ├─→ Task 22 (conditional field) ←── T4,T5  ─┐── Phase 5 (US3)
        │     └─→ Task 23 (AI extractor) ←── T4,T1       ─┘
        │
        │     ├─→ Task 24 [P] (geo select) ←── T4,T1     ─┐── Phase 6 (US4)
        │     └─→ Task 25 [P] (geo address) ←── T4       ─┘
        │
        │     ├─→ Tasks 26-27 [P] (identity fields)      ─┐
        │     ├─→ Task 42 [P] (IBAN) ←── T4                  ─┐
        │     ├─→ Task 43 [P] (egyptian-mobile) ←── T4        ─┤── Identity
        │     ├─→ Task 28 [P] (star rating)               ─┤── Phase 7 (US5)
        │     └─→ Task 29 [P] (multi-step choice)        ─┘
        │
        │     ├─→ Tasks 30-34 [P] (media fields)         ─── Phase 8 (US6)
        │     ├─→ Task 48 [P] (contact) ←── T4                ─── Media
        │
        │     ├─→ Task 35 [P] (date picker)               ─┐
        │     ├─→ Task 36 [P] (time picker)                ─┤── Phase 9
        │     ├─→ Task 37 [P] (location)                   ─┤
        │     ├─→ Task 38 [P] (date range) ←── T35        ─┘
        │     ├─→ Task 44 [P] (schedule-picker) ←── T4,T35   ─── Time/Place
        │
        │     ├─→ Task 45 [P] (qr-code) ←── T4                ─┐
        │     ├─→ Task 46 [P] (toggle) ←── T4                  ─┤── Interactive
        │     └─→ Task 47 [P] (tags) ←── T4                   ─┘
        │
        ├─→ Task 39 (event registration — cross-package)
        │
        └───────── All tasks (0-48) ─→ Task 40 (barrel exports)
```

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundation)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phases 3–9 (User Stories + Fields)**: All depend on Phase 2 completion (especially Task 4 — FieldHandler interface). Once Phase 2 is done, all field handler tasks within and across phases can run in parallel.
- **Phase 10 (Polish)**: Task 39 (events) depends on Task 1; Task 40 (barrel) depends on ALL tasks

### Parallel Opportunities

Once Phase 2 is complete:

- **All field handlers** (Tasks 7–18, 19–20, 22–38, 41–48) can be implemented in parallel — each is an independent file implementing the same interface
- Within each phase, tasks marked `[P]` have no inter-dependencies
- Task 38 (DateRange) depends on Task 35 (DatePicker) — sequential
- Task 44 (SchedulePicker) depends on Task 35 (DatePicker) — sequential

### Within Each Field Handler

1. Implement the handler (render, parseResponse, validate)
2. Write tests
3. Register in FieldHandlerRegistry (done in barrel exports)

---

## Summary

| Task  | Name                   | Priority | Est. Time   | Phase | FR Coverage                  |
| ----- | ---------------------- | -------- | ----------- | ----- | ---------------------------- |
| 0     | Package Scaffolding    | P0       | 5 min       | 1     | Infrastructure               |
| 1     | Types/Contracts/Errors | P0       | 15 min      | 2     | FR-001,002,003,040           |
| 2     | Toggle Guard & Config  | P0       | 5 min       | 2     | FR-040, D6, Rule XVI         |
| 3     | Storage Adapter        | P0       | 10 min      | 2     | FR-005, D4, Rule XXXII       |
| 4     | FieldHandler Interface | P0       | 10 min      | 2     | FR-003, Research 7           |
| 5     | Schema Validator       | P0       | 10 min      | 2     | FR-039, EC-17,19             |
| 6     | FormRunner Core        | P0       | 25 min      | 2     | FR-001,004-007,038,041,042   |
| 7     | ShortText Field        | P1       | 10 min      | 3     | FR-008                       |
| 8     | LongText Field         | P1       | 8 min       | 3     | FR-009                       |
| 9     | Email Field            | P1       | 8 min       | 3     | FR-010                       |
| 10    | Phone Field            | P1       | 8 min       | 3     | FR-011                       |
| 11    | URL Field              | P1       | 5 min       | 3     | FR-012                       |
| 12    | RegexValidated Field   | P1       | 8 min       | 3     | FR-013                       |
| 13    | Integer Field          | P1       | 8 min       | 3     | FR-014                       |
| 14    | Float Field            | P1       | 8 min       | 3     | FR-015                       |
| 15    | Currency Field         | P1       | 10 min      | 3     | FR-016, EC-14                |
| 16    | Percentage Field       | P1       | 5 min       | 3     | FR-017                       |
| 17    | SingleChoice Field     | P1       | 10 min      | 3     | FR-018                       |
| 18    | BooleanToggle Field    | P1       | 5 min       | 3     | FR-020                       |
| 19    | MultipleChoice Field   | P1       | 12 min      | 4     | FR-019, EC-12                |
| 20    | SearchableList Field   | P1       | 15 min      | 4     | FR-021, EC-8                 |
| 21    | Callback Data Utils    | P1       | 5 min       | 4     | FR-041, EC-7                 |
| 22    | ConditionalField       | P2       | 10 min      | 5     | FR-030, EC-17,19             |
| 23    | AIExtractorField       | P2       | 15 min      | 5     | FR-031, EC-3,13, Rule XXXIII |
| 24    | GeoSelectField         | P2       | 12 min      | 6     | FR-032                       |
| 25    | GeoAddressField        | P2       | 8 min       | 6     | FR-033                       |
| 26    | NationalID Field       | P2       | 12 min      | 7     | FR-034, EC-28,29             |
| 27    | PassportNumber Field   | P2       | 5 min       | 7     | FR-035                       |
| 28    | StarRating Field       | P2       | 8 min       | 7     | FR-036, EC-21                |
| 29    | MultiStepChoice Field  | P2       | 15 min      | 7     | FR-037, EC-20                |
| 30    | Photo Field            | P2       | 10 min      | 8     | FR-026, EC-15                |
| 31    | Document Field         | P2       | 8 min       | 8     | FR-027                       |
| 32    | Video Field            | P2       | 8 min       | 8     | FR-028                       |
| 33    | Audio Field            | P2       | 8 min       | 8     | FR-028                       |
| 34    | FileGroup Field        | P2       | 12 min      | 8     | FR-029, EC-18                |
| 35    | DatePicker Field       | P1       | 15 min      | 9     | FR-022, EC-9                 |
| 36    | TimePicker Field       | P1       | 10 min      | 9     | FR-023, EC-10                |
| 37    | Location Field         | P1       | 8 min       | 9     | FR-024, EC-11                |
| 38    | DateRange Field        | P2       | 10 min      | 9     | FR-025                       |
| 39    | Event Registration     | P1       | 5 min       | 10    | Spec § Events                |
| 40    | Barrel Exports         | P1       | 5 min       | 10    | All                          |
| 41    | CurrencyAmount Field   | P2       | 10 min      | 3     | FR-047, EC-35                |
| 42    | IBAN Field             | P2       | 12 min      | 7     | FR-045, EC-25,26             |
| 43    | EgyptianMobile Field   | P2       | 10 min      | 7     | FR-046, EC-27                |
| 44    | SchedulePicker Field   | P2       | 15 min      | 9     | FR-043, EC-32,33             |
| 45    | QRCode Field           | P2       | 10 min      | 7     | FR-048, EC-23,24             |
| 46    | Toggle Field           | P2       | 5 min       | 7     | FR-049                       |
| 47    | Tags Field             | P2       | 15 min      | 7     | FR-050, EC-30,31             |
| 48    | Contact Field          | P2       | 8 min       | 8     | FR-044, EC-34                |
| **—** | **Total**              |          | **474 min** |       |                              |
