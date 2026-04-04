> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

# Implementation Plan: Input Engine — Dynamic Form Engine (011)

**Spec**: `specs/011-input-engine-package/spec.md` (Complete)
**Created**: 2026-04-03
**Dependencies**: `@grammyjs/conversations` (^2.1.1), `zod` (^4.3.6), `@tempot/shared`, `@tempot/ux-helpers`, `@tempot/i18n-core`, `@tempot/session-manager`
**Optional Dependencies**: `@tempot/storage-engine`, `@tempot/ai-core`, `@tempot/regional-engine`

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                           runForm() API                               │
│  (conversation, ctx, schema, options?) → AsyncResult<T, AppError>    │
├──────────┬──────────────────────────────────────────┬─────────────────┤
│          │                                          │                 │
│  SchemaValidator              FormRunner             ToggleGuard     │
│  (validate schema             (orchestrate form      (TEMPOT_INPUT   │
│   at call time)                lifecycle)             _ENGINE check) │
├──────────┴──────────────────────────────────────────┴─────────────────┤
│                                                                       │
│  FieldHandlerRegistry                                                 │
│  Map<FieldType, FieldHandler>                                         │
│  39 handlers, one per field type                                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Text Handlers     │  Number Handlers   │  Choice Handlers            │
│  ─────────────     │  ───────────────   │  ───────────────            │
│  short-text.field  │  integer.field     │  single-choice.field       │
│  long-text.field   │  float.field       │  multiple-choice.field     │
│  email.field       │  currency.field    │  boolean-toggle.field      │
│  phone.field       │  percentage.field  │  searchable-list.field     │
│  url.field         │  currency-amount   │                             │
│  regex.field       │    .field          │                             │
├────────────────────┼────────────────────┼─────────────────────────────┤
│                    │                    │                             │
│  Time/Place        │  Media Handlers    │  Smart Handlers            │
│  ────────────      │  ──────────────    │  ──────────────            │
│  date-picker.field │  photo.field       │  conditional.field         │
│  time-picker.field │  document.field    │  ai-extractor.field        │
│  location.field    │  video.field       │                             │
│  date-range.field  │  audio.field       │                             │
│  schedule-picker   │  file-group.field  │                             │
│    .field          │  contact.field     │                             │
├────────────────────┼────────────────────┼─────────────────────────────┤
│                    │                    │                             │
│  Geo Handlers      │  Identity Handlers │  Interactive Handlers      │
│  ────────────      │  ─────────────     │  ───────────────────       │
│  geo-select.field  │  national-id.field │  star-rating.field         │
│  geo-address.field │  passport.field    │  multi-step-choice.field   │
│                    │  iban.field        │  qr-code.field             │
│                    │  egyptian-mobile   │  toggle.field              │
│                    │    .field          │  tags.field                │
├────────────────────┴────────────────────┴─────────────────────────────┤
│                                                                       │
│  ConversationsStorageAdapter            PartialSaveManager            │
│  (implements conversations              (checkpoint/rewind logic      │
│   storage interface via                  using adapter state)         │
│   @tempot/shared CacheService)                                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Phase 2 — UX & Integration Layer                                     │
│  ────────────────────────────────                                     │
│  ActionButtonsBuilder  │  ProgressRenderer    │  ConfirmationRenderer │
│  (Skip/Cancel/Back/    │  (dynamic "X of Y"   │  (summary + edit +   │
│   KeepCurrent buttons) │   progress messages) │   confirm flow)      │
│  ──────────────────────┼──────────────────────┼───────────────────────│
│  ValidationErrorDisplay│  BackNavigator       │  FieldSkipHandler    │
│  (i18n error + retry   │  (bidirectional      │  (optional skip +    │
│   count rendering)     │   iteration index)   │   auto-skip on max)  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  External Dependencies (structural interfaces — injected at runtime)  │
│  ──────────────────────────────────────────────────────────────────   │
│  StorageEngineClient?  │  AIExtractionClient?  │  RegionalClient?    │
│  (@tempot/storage)     │  (@tempot/ai-core)    │  (@tempot/regional) │
│  t? (i18n function)    │                       │                     │
└────────────────────────┴───────────────────────┴─────────────────────┘
```

**Five Phases:**

- **Phase 1A — Foundation**: Package scaffolding, types/contracts/errors, toggle guard, conversations storage adapter, FieldHandler interface, FormRunner core
- **Phase 1B — Text & Number Fields**: All 6 text fields + all 5 number fields (11 handlers)
- **Phase 1C — Choice & Time/Place Fields**: All 4 choice fields + all 5 time/place fields (9 handlers)
- **Phase 1D — Advanced Fields + Polish**: Media (6), Smart (2), Geo (2), Identity (4), Interactive (5), barrel exports, event registration (19 handlers + infrastructure)
- **Phase 2 — UX & Integration**: Action buttons, optional field skip, cancel interception, validation error display, progress indicator, back navigation, confirmation step, storage integration, AI extraction full flow (8 new features, 12 tasks)

---

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Strict Mode)
**Primary Dependencies**: `@grammyjs/conversations` ^2.1.1, `zod` ^4.3.6, `neverthrow` 8.2.0
**Workspace Dependencies**: `@tempot/shared`, `@tempot/ux-helpers`, `@tempot/i18n-core`, `@tempot/session-manager`
**Optional Dependencies**: `@tempot/storage-engine`, `@tempot/ai-core`, `@tempot/regional-engine`
**Storage**: Redis via `@tempot/shared` CacheService (for partial save)
**Testing**: Vitest 4.1.0
**Target Platform**: Node.js 20+
**Project Type**: Library (monorepo package)
**Constraints**: Zero hardcoded user text (Rule XXXIX), Result pattern only (Rule XXI), no `any` types, no `console.*`

---

## Constitution Check

| Rule   | Requirement                           | Status                                                           |
| ------ | ------------------------------------- | ---------------------------------------------------------------- |
| III    | File naming: `{Feature}.{type}.ts`    | Pass — all files follow pattern                                  |
| XVI    | Toggle guard: `TEMPOT_INPUT_ENGINE`   | Pass — D6                                                        |
| XXI    | Result pattern: `Result<T, AppError>` | Pass — D5, correcting architecture spec                          |
| XXXII  | Redis degradation                     | Pass — CacheService handles fallback                             |
| XXXIII | AI degradation                        | Pass — AIExtractorField falls back to manual                     |
| XXXIX  | i18n-Only                             | Pass — FR-004, FR-054 (error msgs via t())                       |
| XLIII  | No zombie code                        | Will verify                                                      |
| LXVII  | Confirmation expiry                   | Pass — FR-057 confirmation step; timeout reset on display (EC40) |
| LXXVII | No phantom dependencies               | Pass — structural interfaces for optional deps                   |

---

## Project Structure

### Documentation

```text
specs/011-input-engine-package/
├── spec.md              # Feature specification (Complete)
├── plan.md              # This file
├── research.md          # Design decisions
├── data-model.md        # Entity definitions
└── tasks.md             # Task breakdown
```

### Source Code

```text
packages/input-engine/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── README.md                              # Existing placeholder (preserve)
├── src/
│   ├── index.ts                           # Barrel exports
│   ├── input-engine.types.ts              # Core type definitions
│   ├── input-engine.contracts.ts          # Structural interfaces for optional deps
│   ├── input-engine.errors.ts             # Error code constants
│   ├── input-engine.config.ts             # Config loading + toggle guard
│   ├── runner/
│   │   ├── form.runner.ts                 # FormRunner — orchestrates form lifecycle
│   │   ├── field.iterator.ts              # Field iteration loop (bidirectional in Phase 2)
│   │   ├── schema.validator.ts            # Schema validation at call time
│   │   ├── condition.evaluator.ts         # Conditional field evaluation
│   │   ├── event.emitter.ts               # Lifecycle event emission
│   │   ├── partial-save.helper.ts         # Partial save read/write/delete
│   │   ├── action-buttons.builder.ts      # [Phase 2] Skip/Cancel/Back/KeepCurrent buttons
│   │   ├── progress.renderer.ts           # [Phase 2] Dynamic "X of Y" progress messages
│   │   ├── validation-error.renderer.ts   # [Phase 2] i18n error message display
│   │   └── confirmation.renderer.ts       # [Phase 2] Summary + edit + confirm flow
│   ├── storage/
│   │   └── conversations-storage.adapter.ts  # Custom conversations storage via CacheService
│   ├── fields/
│   │   ├── field.handler.ts               # FieldHandler interface + handler registry
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
│   └── utils/
│       └── callback-data.helper.ts         # Form-specific callback data helpers
└── tests/
    └── unit/
        ├── input-engine.types.test.ts
        ├── input-engine.config.test.ts
        ├── schema.validator.test.ts
        ├── form.runner.test.ts
        ├── conversations-storage.adapter.test.ts
        ├── field.handler.test.ts
        ├── action-buttons.builder.test.ts       # [Phase 2]
        ├── progress.renderer.test.ts            # [Phase 2]
        ├── validation-error.renderer.test.ts    # [Phase 2]
        ├── confirmation.renderer.test.ts        # [Phase 2]
        ├── field.iterator.test.ts               # [Phase 2] bidirectional iteration tests
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

**Structure Decision**: Single-directory package within the Tempot monorepo at `packages/input-engine/`. Field handlers organized by category in subdirectories under `src/fields/`. This keeps related fields together while maintaining a flat test directory for discoverability.

---

## Task 0 — Package Scaffolding

### Files Created

- `packages/input-engine/package.json`
- `packages/input-engine/tsconfig.json`
- `packages/input-engine/.gitignore`
- `packages/input-engine/vitest.config.ts`
- `packages/input-engine/src/index.ts` (empty barrel)

### package.json

```jsonc
{
  "name": "@tempot/input-engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts",
    },
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
  },
  "dependencies": {
    "neverthrow": "8.2.0",
    "@grammyjs/conversations": "^2.1.1",
    "zod": "^4.3.6",
    "@tempot/shared": "workspace:*",
    "@tempot/ux-helpers": "workspace:*",
    "@tempot/i18n-core": "workspace:*",
    "@tempot/session-manager": "workspace:*",
  },
  "optionalDependencies": {
    "@tempot/storage-engine": "workspace:*",
    "@tempot/ai-core": "workspace:*",
    "@tempot/regional-engine": "workspace:*",
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0",
    "grammy": "^1.41.1",
  },
}
```

### 10-Point Checklist

All items from `docs/developer/package-creation-checklist.md` must pass before first code commit.

---

## Task 1 — Type Definitions, Contracts & Error Codes

### FR Covered: FR-001, FR-002, FR-003, FR-040

### Files

- `src/input-engine.types.ts` — Core type definitions (FieldType union, FieldMetadata, FormOptions, ChoiceOption, FieldCondition, MultiStepLevel)
- `src/input-engine.contracts.ts` — Structural interfaces for optional dependencies (StorageEngineClient, AIExtractionClient, RegionalClient, InputEngineLogger, InputEngineEventBus)
- `src/input-engine.errors.ts` — Error code constants (hierarchical, matching spec error codes)

### Types (`src/input-engine.types.ts`)

```typescript
import type { ZodType } from 'zod';
import type { AsyncResult, Result } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** All 39 supported field types across 9 categories */
export type FieldType =
  // Text (6)
  | 'ShortText'
  | 'LongText'
  | 'Email'
  | 'Phone'
  | 'URL'
  | 'RegexValidated'
  // Numbers (5)
  | 'Integer'
  | 'Float'
  | 'Currency'
  | 'Percentage'
  | 'CurrencyAmount'
  // Choice (4)
  | 'SingleChoice'
  | 'MultipleChoice'
  | 'BooleanToggle'
  | 'SearchableList'
  // Time/Place (5)
  | 'DatePicker'
  | 'TimePicker'
  | 'Location'
  | 'DateRange'
  | 'SchedulePicker'
  // Media (6)
  | 'Photo'
  | 'Document'
  | 'Video'
  | 'Audio'
  | 'FileGroup'
  | 'Contact'
  // Smart (2)
  | 'ConditionalField'
  | 'AIExtractorField'
  // Geo (2)
  | 'GeoSelectField'
  | 'GeoAddressField'
  // Identity (4)
  | 'NationalID'
  | 'PassportNumber'
  | 'IBAN'
  | 'EgyptianMobile'
  // Interactive (5)
  | 'StarRating'
  | 'MultiStepChoice'
  | 'QRCode'
  | 'Toggle'
  | 'Tags';

/** Selectable option for choice fields */
export interface ChoiceOption {
  value: string;
  label: string; // i18n key
  emoji?: string;
  disabled?: boolean;
}

/** Condition for ConditionalField */
export interface FieldCondition {
  dependsOn: string;
  operator: 'equals' | 'notEquals' | 'in' | 'gt' | 'lt' | 'custom';
  value?: unknown;
  fn?: (formData: Record<string, unknown>) => boolean;
}

/** Level definition for MultiStepChoice */
export interface MultiStepLevel {
  label: string; // i18n key
  options?: ChoiceOption[];
  dataSource?: (parentValue: string) => AsyncResult<ChoiceOption[], AppError>;
}

/** Field metadata attached via z.globalRegistry.register() */
export interface FieldMetadata {
  fieldType: FieldType;
  i18nKey: string;
  i18nErrorKey?: string;
  order?: number;
  optional?: boolean;
  conditions?: FieldCondition[];
  maxRetries?: number;
  // Field-type-specific options
  options?: ChoiceOption[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  maxSizeKB?: number;
  allowedExtensions?: string[];
  allowedTypes?: string[];
  maxDurationSeconds?: number;
  minFiles?: number;
  maxFiles?: number;
  minSelections?: number;
  maxSelections?: number;
  pattern?: RegExp;
  targetFields?: string[];
  levels?: MultiStepLevel[];
  preserveQuality?: boolean;
  use12Hour?: boolean;
  dataSource?: () => AsyncResult<ChoiceOption[], AppError>;
  // SchedulePicker
  availableSlots?: TimeSlot[];
  slotDataSource?: (date: string) => AsyncResult<TimeSlot[], AppError>;
  slotDuration?: number;
  // EgyptianMobile
  countryCodes?: CountryCode[];
  defaultCountryCode?: string;
  // IBAN
  defaultCountry?: string;
  allowedCountries?: string[];
  // CurrencyAmount
  currency?: string;
  allowedCurrencies?: string[];
  decimalPlaces?: number;
  // QRCode
  expectedFormat?: 'url' | 'text' | 'json' | 'any';
  // Toggle
  onLabel?: string;
  offLabel?: string;
  defaultValue?: boolean;
  // Tags
  minTags?: number;
  maxTags?: number;
  allowCustom?: boolean;
  predefinedTags?: ChoiceOption[];
  maxTagLength?: number;
  // NationalID (enhanced)
  extractData?: boolean;
}

/** Available time slot for SchedulePicker */
export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  slotId?: string;
  available: boolean;
  label?: string; // i18n key
}

/** Country code option for EgyptianMobile */
export interface CountryCode {
  code: string; // ISO 3166-1 alpha-2
  dialCode: string; // e.g., '+20'
  name: string; // i18n key
  flag?: string; // Flag emoji
}

/** Result from NationalID with extractData: true */
export interface NationalIDResult {
  id: string;
  birthDate?: string; // ISO 8601
  governorate?: string;
  gender?: 'male' | 'female';
}

/** Result from Contact field */
export interface ContactResult {
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  userId?: number;
}

/** Result from SchedulePicker field */
export interface SchedulePickerResult {
  date: string; // ISO 8601 date
  time: string; // HH:MM
  slotId?: string;
}

/** Result from EgyptianMobile field */
export interface EgyptianMobileResult {
  number: string;
  countryCode: string;
  operator?: string;
}

/** Result from CurrencyAmount field */
export interface CurrencyAmountResult {
  amount: number;
  currency: string; // ISO 4217
}

/** Options for runForm() */
export interface FormOptions {
  partialSave?: boolean;
  partialSaveTTL?: number; // ms, default 86400000 (24h)
  maxMilliseconds?: number; // ms, default 600000 (10 min)
  allowCancel?: boolean; // default true
  formId?: string; // auto-generated if not provided
}

/** Default form options */
export const DEFAULT_FORM_OPTIONS: Required<FormOptions> = {
  partialSave: false,
  partialSaveTTL: 86_400_000,
  maxMilliseconds: 600_000,
  allowCancel: true,
  formId: '', // Will be replaced with UUID at runtime
};
```

### Contracts (`src/input-engine.contracts.ts`)

```typescript
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** Structural interface for storage-engine dependency (optional) */
export interface StorageEngineClient {
  upload: (
    file: Buffer,
    options: { filename: string; mimeType: string },
  ) => AsyncResult<string, AppError>;
  validate: (
    file: Buffer,
    constraints: { maxSizeKB?: number; allowedTypes?: string[] },
  ) => AsyncResult<void, AppError>;
}

/** Structural interface for ai-core extraction dependency (optional) */
export interface AIExtractionClient {
  extract: (
    input: string,
    targetFields: string[],
  ) => AsyncResult<Record<string, unknown>, AppError>;
  isAvailable: () => boolean;
}

/** Structural interface for regional-engine dependency (optional) */
export interface RegionalClient {
  getStates: () => AsyncResult<Array<{ id: string; name: string }>, AppError>;
  getCities: (stateId: string) => AsyncResult<Array<{ id: string; name: string }>, AppError>;
}

/** Structural interface for logger dependency */
export interface InputEngineLogger {
  info: (data: object) => void;
  warn: (data: object) => void;
  error: (data: object) => void;
  debug: (data: object) => void;
}

/** Structural interface for event bus dependency */
export interface InputEngineEventBus {
  publish: (eventName: string, payload: unknown) => AsyncResult<void, AppError>;
}
```

### Error Codes (`src/input-engine.errors.ts`)

```typescript
/** Hierarchical error codes for input-engine module (Rule XXII) */
export const INPUT_ENGINE_ERRORS = {
  // Package-level
  DISABLED: 'input-engine.disabled',

  // Schema errors
  SCHEMA_INVALID: 'input-engine.schema.invalid',
  SCHEMA_CIRCULAR_DEPENDENCY: 'input-engine.schema.circular_dependency',

  // Form lifecycle errors
  FORM_CANCELLED: 'input-engine.form.cancelled',
  FORM_TIMEOUT: 'input-engine.form.timeout',
  FORM_ALREADY_ACTIVE: 'input-engine.form.already_active',

  // Field errors
  FIELD_VALIDATION_FAILED: 'input-engine.field.validation_failed',
  FIELD_MAX_RETRIES: 'input-engine.field.max_retries',
  FIELD_PARSE_FAILED: 'input-engine.field.parse_failed',
  FIELD_RENDER_FAILED: 'input-engine.field.render_failed',
  FIELD_TYPE_UNKNOWN: 'input-engine.field.type_unknown',

  // Partial save errors
  PARTIAL_SAVE_FAILED: 'input-engine.partial_save.failed',
  PARTIAL_SAVE_RESTORE_FAILED: 'input-engine.partial_save.restore_failed',

  // Media errors
  MEDIA_SIZE_EXCEEDED: 'input-engine.media.size_exceeded',
  MEDIA_TYPE_NOT_ALLOWED: 'input-engine.media.type_not_allowed',
  MEDIA_UPLOAD_FAILED: 'input-engine.media.upload_failed',
  MEDIA_DURATION_EXCEEDED: 'input-engine.media.duration_exceeded',

  // AI extraction errors
  AI_EXTRACTION_FAILED: 'input-engine.ai.extraction_failed',
  AI_UNAVAILABLE: 'input-engine.ai.unavailable',

  // Geo errors
  GEO_LOAD_FAILED: 'input-engine.geo.load_failed',

  // IBAN errors
  IBAN_INVALID_CHECKSUM: 'input-engine.iban.invalid_checksum',
  IBAN_COUNTRY_NOT_ALLOWED: 'input-engine.iban.country_not_allowed',

  // QR errors
  QR_DECODE_FAILED: 'input-engine.qr.decode_failed',
  QR_FORMAT_MISMATCH: 'input-engine.qr.format_mismatch',

  // Schedule errors
  SCHEDULE_NO_SLOTS: 'input-engine.schedule.no_slots',
  SCHEDULE_SLOT_UNAVAILABLE: 'input-engine.schedule.slot_unavailable',

  // NationalID errors
  NATIONAL_ID_CHECKSUM_FAILED: 'input-engine.national_id.checksum_failed',
  NATIONAL_ID_FUTURE_DATE: 'input-engine.national_id.future_date',

  // Tags errors
  TAGS_DUPLICATE: 'input-engine.tags.duplicate',
  TAGS_MAX_LENGTH: 'input-engine.tags.max_length',

  // Contact errors
  CONTACT_NOT_SHARED: 'input-engine.contact.not_shared',

  // Event emission (warning-level, not returned to callers)
  EVENT_PUBLISH_FAILED: 'input-engine.event.publish_failed',
} as const;
```

---

## Task 2 — Toggle Guard & Config

### FR Covered: FR-040

### File: `src/input-engine.config.ts`

```typescript
import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from './input-engine.errors.js';

/** Check if input-engine is enabled */
export function isInputEngineEnabled(): boolean {
  return process.env.TEMPOT_INPUT_ENGINE !== 'false';
}

/** Guard function — wraps any operation with toggle check */
export function guardEnabled<T>(fn: () => T): Result<T, AppError> | T {
  if (!isInputEngineEnabled()) {
    return err(new AppError(INPUT_ENGINE_ERRORS.DISABLED));
  }
  return fn();
}

/** Async guard function — wraps async operations with toggle check */
export async function guardEnabledAsync<T>(fn: () => Promise<T>): AsyncResult<T, AppError> {
  if (!isInputEngineEnabled()) {
    return err(new AppError(INPUT_ENGINE_ERRORS.DISABLED));
  }
  return fn() as unknown as AsyncResult<T, AppError>;
}
```

---

## Task 3 — Conversations Storage Adapter

### FR Covered: FR-005, D4, Rule XXXII

### File: `src/storage/conversations-storage.adapter.ts`

Custom storage adapter for `@grammyjs/conversations` that persists conversation state to Redis via `@tempot/shared` CacheService. Implements the conversations storage interface.

```typescript
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { InputEngineLogger } from '../input-engine.contracts.js';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';

/** Structural interface matching CacheService from @tempot/shared */
interface CacheAdapter {
  get: <T>(key: string) => AsyncResult<T | undefined, AppError>;
  set: <T>(key: string, value: T, ttl?: number) => AsyncResult<void, AppError>;
  del: (key: string) => AsyncResult<void, AppError>;
}

/** Custom conversations storage adapter using CacheService */
export class ConversationsStorageAdapter {
  constructor(
    private readonly cache: CacheAdapter,
    private readonly logger: InputEngineLogger,
    private readonly ttlMs: number = 86_400_000, // 24 hours default
  ) {}

  /** Read conversation state from Redis */
  async read(key: string): Promise<unknown | undefined> {
    const result = await this.cache.get<unknown>(key);
    if (result.isErr()) {
      this.logger.warn({
        code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_RESTORE_FAILED,
        key,
        error: result.error.code,
      });
      return undefined; // Graceful degradation
    }
    return result.value;
  }

  /** Write conversation state to Redis */
  async write(key: string, value: unknown): Promise<void> {
    const result = await this.cache.set(key, value, this.ttlMs);
    if (result.isErr()) {
      this.logger.warn({
        code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_FAILED,
        key,
        error: result.error.code,
      });
      // Graceful degradation — don't throw
    }
  }

  /** Delete conversation state from Redis */
  async delete(key: string): Promise<void> {
    const result = await this.cache.del(key);
    if (result.isErr()) {
      this.logger.warn({
        code: INPUT_ENGINE_ERRORS.PARTIAL_SAVE_FAILED,
        key,
        error: result.error.code,
      });
    }
  }
}
```

---

## Task 4 — FieldHandler Interface & Registry

### FR Covered: FR-003, Research Decision 7

### File: `src/fields/field.handler.ts`

```typescript
import type { Result, AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { FieldType, FieldMetadata } from '../input-engine.types.js';

/** Interface that every field type handler implements */
export interface FieldHandler {
  readonly fieldType: FieldType;

  /** Render the field prompt and UI elements */
  render(
    conversation: unknown, // grammY Conversation
    ctx: unknown, // grammY Context
    metadata: FieldMetadata,
    formData: Record<string, unknown>,
  ): AsyncResult<void, AppError>;

  /** Parse the user's raw response into a typed value */
  parseResponse(
    message: unknown, // grammY Message
    metadata: FieldMetadata,
  ): Result<unknown, AppError>;

  /** Validate the parsed value against the Zod schema */
  validate(
    value: unknown,
    schema: unknown, // ZodType
    metadata: FieldMetadata,
  ): Result<unknown, AppError>;
}

/** Registry of all field handlers, keyed by FieldType */
export class FieldHandlerRegistry {
  private readonly handlers = new Map<FieldType, FieldHandler>();

  /** Register a field handler */
  register(handler: FieldHandler): void {
    this.handlers.set(handler.fieldType, handler);
  }

  /** Get handler for a field type */
  get(fieldType: FieldType): FieldHandler | undefined {
    return this.handlers.get(fieldType);
  }

  /** Check if a handler exists for a field type */
  has(fieldType: FieldType): boolean {
    return this.handlers.has(fieldType);
  }

  /** Get all registered field types */
  getRegisteredTypes(): FieldType[] {
    return Array.from(this.handlers.keys());
  }
}
```

---

## Task 5 — Schema Validator

### FR Covered: FR-039

### File: `src/runner/schema.validator.ts`

Validates form schemas at `runForm()` call time before any user interaction. Detects duplicate field names, missing i18n keys, unknown field types, and circular conditional dependencies.

---

## Task 6 — FormRunner Core

### FR Covered: FR-001, FR-004, FR-005, FR-006, FR-007, FR-038, FR-041, FR-042

### File: `src/runner/form.runner.ts`

Orchestrates the full form lifecycle:

1. Toggle guard check
2. Schema validation
3. Check for existing partial save → resume or start fresh
4. For each field: evaluate conditions → render → wait → parse → validate → save
5. Handle /cancel and timeout via `maxMilliseconds` and `otherwise` callbacks
6. Assemble result and return `ok(formData)` or `err(AppError)`
7. Clean up partial save on completion
8. Emit lifecycle events via fire-and-log

---

## Tasks 7–12 — Text Fields (6 handlers)

### FR Covered: FR-008 through FR-013

Each text field handler:

- Implements `FieldHandler` interface
- Renders i18n prompt via `conversation.form.build()` or direct message
- Parses text response from message
- Validates via Zod schema (string constraints, email regex, phone pattern, URL, custom regex)
- Returns parsed/validated value or error

Files:

- `src/fields/text/short-text.field.ts` (FR-008)
- `src/fields/text/long-text.field.ts` (FR-009)
- `src/fields/text/email.field.ts` (FR-010)
- `src/fields/text/phone.field.ts` (FR-011)
- `src/fields/text/url.field.ts` (FR-012)
- `src/fields/text/regex-validated.field.ts` (FR-013)

---

## Tasks 13–16, 41 — Number Fields (5 handlers)

### FR Covered: FR-014 through FR-017, FR-047

Each number field handler:

- Parses numeric input from text message
- Validates via Zod schema (int/float, min/max, percentage bounds)
- Handles locale-specific formatting for Currency (Arabic/English number parsing)
- CurrencyAmount: Amount + currency from config, Arabic numeral support

Files:

- `src/fields/numbers/integer.field.ts` (FR-014)
- `src/fields/numbers/float.field.ts` (FR-015)
- `src/fields/numbers/currency.field.ts` (FR-016)
- `src/fields/numbers/percentage.field.ts` (FR-017)
- `src/fields/numbers/currency-amount.field.ts` (FR-047)

---

## Tasks 17–20 — Choice Fields (4 handlers)

### FR Covered: FR-018 through FR-021

Choice field handlers use `@tempot/ux-helpers` for UI:

- `createInlineKeyboard` for small option sets
- `buildPagination` for large option sets
- `encodeCallbackData` / `decodeCallbackData` for callback routing

Files:

- `src/fields/choice/single-choice.field.ts` (FR-018)
- `src/fields/choice/multiple-choice.field.ts` (FR-019)
- `src/fields/choice/boolean-toggle.field.ts` (FR-020)
- `src/fields/choice/searchable-list.field.ts` (FR-021)

---

## Tasks 21–24, 44 — Time/Place Fields (5 handlers)

### FR Covered: FR-022 through FR-025, FR-043

Time/Place handlers:

- DatePicker: Interactive calendar with inline keyboard, month/year navigation, min/max constraints, uses `DateService` from `@tempot/regional-engine`
- TimePicker: Hour/minute buttons or text input HH:MM
- Location: GPS sharing or text address
- DateRange: Two DatePickers with start ≤ end validation
- SchedulePicker: Date+time with slot filtering, static/dynamic slot sources

Files:

- `src/fields/time-place/date-picker.field.ts` (FR-022)
- `src/fields/time-place/time-picker.field.ts` (FR-023)
- `src/fields/time-place/location.field.ts` (FR-024)
- `src/fields/time-place/date-range.field.ts` (FR-025)
- `src/fields/time-place/schedule-picker.field.ts` (FR-043)

---

## Tasks 25–29, 48 — Media Fields (6 handlers)

### FR Covered: FR-026 through FR-029, FR-044

Media handlers integrate with `@tempot/storage-engine` (optional):

- Validate file size, type, duration constraints
- Upload via StorageEngineClient if available
- Fallback to raw Telegram file metadata if storage-engine unavailable
- FileGroup: Multi-file collection with min/max constraints
- Contact: Telegram contact sharing via message.contact, ReplyKeyboardMarkup

Files:

- `src/fields/media/photo.field.ts` (FR-026)
- `src/fields/media/document.field.ts` (FR-027)
- `src/fields/media/video.field.ts` (FR-028)
- `src/fields/media/audio.field.ts` (FR-028)
- `src/fields/media/file-group.field.ts` (FR-029)
- `src/fields/media/contact.field.ts` (FR-044)

---

## Tasks 30–31 — Smart Fields (2 handlers)

### FR Covered: FR-030, FR-031

- ConditionalField: Evaluates conditions against collected form data, shows/skips wrapped field
- AIExtractorField: Uses AIExtractionClient (structural interface) for multi-value extraction, shows confirmation, falls back to manual input

Files:

- `src/fields/smart/conditional.field.ts` (FR-030)
- `src/fields/smart/ai-extractor.field.ts` (FR-031)

---

## Tasks 32–33 — Geo Fields (2 handlers)

### FR Covered: FR-032, FR-033

- GeoSelectField: Uses RegionalClient for hierarchical state → city selection
- GeoAddressField: Free-text address with optional geocoding

Files:

- `src/fields/geo/geo-select.field.ts` (FR-032)
- `src/fields/geo/geo-address.field.ts` (FR-033)

---

## Tasks 34–35, 42–43 — Identity Fields (4 handlers)

### FR Covered: FR-034, FR-035, FR-045, FR-046

- NationalID: Configurable regex, default Egyptian 14-digit
- PassportNumber: Configurable format validation
- IBAN: ISO 13616 validation, country-specific length, MOD-97 checksum
- EgyptianMobile: 01x-xxxx-xxxx format, operator detection, country code inline keyboard

Files:

- `src/fields/identity/national-id.field.ts` (FR-034)
- `src/fields/identity/passport.field.ts` (FR-035)
- `src/fields/identity/iban.field.ts` (FR-045)
- `src/fields/identity/egyptian-mobile.field.ts` (FR-046)

---

## Tasks 36–37, 45–47 — Interactive Fields (5 handlers)

### FR Covered: FR-036, FR-037, FR-048, FR-049, FR-050

- StarRating: Emoji number buttons via `EMOJI_NUMBERS` from ux-helpers
- MultiStepChoice: Hierarchical multi-level selection with breadcrumb
- QRCode: QR decode from photo, expectedFormat validation, graceful retry
- Toggle: On/off with ✓/✗ prefix, single tap, no confirm step
- Tags: Free-form tag input with add/remove/confirm flow

Files:

- `src/fields/interactive/star-rating.field.ts` (FR-036)
- `src/fields/interactive/multi-step-choice.field.ts` (FR-037)
- `src/fields/interactive/qr-code.field.ts` (FR-048)
- `src/fields/interactive/toggle.field.ts` (FR-049)
- `src/fields/interactive/tags.field.ts` (FR-050)

---

## Task 38 — Event Registration (Cross-Package)

### FR Covered: Spec § Event Payloads

### File to modify: `packages/event-bus/src/event-bus.events.ts`

Register input-engine events in `TempotEvents` interface with inline payload types (do NOT import from `@tempot/input-engine` to avoid circular dependency).

---

## Task 39 — Barrel Exports & Final Validation

### FR Covered: All

### File: `src/index.ts`

Export all public types, interfaces, constants, and the `runForm()` function. All relative imports use `.js` extensions (ESM/NodeNext). 10-point checklist passes final verification.

---

## Complexity Tracking

No constitution violations to justify. The package follows all rules directly. Phase 2 introduces Rule LXVII compliance (confirmation button expiry — confirmation step timeout is reset per EC40, not enforced as 5-minute expiry since the form has its own deadline mechanism).

---

## Phase 2 — UX & Integration Features

**Prerequisites:** Phase 1 (Tasks 0–39) complete. All 39 field handlers, FormRunner, partial save, and event emission are working.

**Dependencies within Phase 2:** Tasks build sequentially. Task 40 (action-buttons builder) provides the button-building utility used by Tasks 41–43 and 46. Task 44 (bidirectional iteration) restructures the core field loop used by Tasks 41, 43, and 46. Task 48 (confirmation) depends on the progress renderer (Task 45) for display formatting.

**Backward Compatibility:** All Phase 2 features are additive and opt-in via `FormOptions` or `FormRunnerDeps`. Existing `runForm()` calls with no new options work identically. Default values: `showProgress: true`, `showConfirmation: true`, `allowCancel: true` — these match the spec defaults but the FormRunner already handled cancel in Phase 1, so Phase 2 adds the inline button rendering.

---

### Task 40 — Action Buttons Builder

#### FR Covered: FR-052, FR-053, D7

#### Files

- Create: `src/runner/action-buttons.builder.ts`
- Test: `tests/unit/action-buttons.builder.test.ts`

Builds inline keyboard action button rows to append to field handler keyboards. Each button uses encoded callback data: `ie:{formId}:{fieldIndex}:__action__`.

```typescript
import type { FormOptions } from '../input-engine.types.js';

/** Action button identifiers in callback data */
export const ACTION_CALLBACKS = {
  SKIP: '__skip__',
  CANCEL: '__cancel__',
  BACK: '__back__',
  KEEP_CURRENT: '__keep_current__',
} as const;

/** Context for building action buttons */
interface ActionButtonContext {
  formId: string;
  fieldIndex: number;
  isOptional: boolean;
  isFirstField: boolean;
  allowCancel: boolean;
}

/** Build inline keyboard row(s) for action buttons */
export function buildActionButtons(
  ctx: ActionButtonContext,
  t: TranslateFunction,
): ActionButtonRow[] {
  // Returns array of button rows:
  // Row 1 (conditional): [Skip ⏭] — only if isOptional
  // Row 2 (conditional): [⬅ Back] [Cancel ❌] — Back if !isFirstField, Cancel if allowCancel
  // Each button: { text: t(key), callback_data: encodeCallbackData(...) }
}

/** Type alias for translation function */
type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;

/** Action button row structure */
interface ActionButtonRow {
  buttons: Array<{ text: string; callbackData: string }>;
}
```

The builder is a pure function — no side effects, no async, no external deps beyond the `t` function. Callback data format: `ie:{formId}:{fieldIndex}:{action}`.

---

### Task 41 — Optional Field Skip

#### FR Covered: FR-051, EC4, EC6

#### Files

- Modify: `src/runner/field.iterator.ts` — handle skip callback + auto-skip on max retries for optional fields
- Modify: `src/runner/event.emitter.ts` — add `emitFieldSkipped` function
- Modify: `src/input-engine.errors.ts` — add `FIELD_SKIPPED` error code (internal, not user-facing)
- Test: `tests/unit/field.iterator.test.ts` — skip via callback, auto-skip on max retries

When a field has `metadata.optional === true`:

1. The action buttons builder includes a "Skip ⏭" button
2. If the user taps "Skip", `processField` detects the `__skip__` callback and returns a sentinel value (e.g., `ok(FIELD_SKIPPED_SENTINEL)`)
3. `iterateFields` sets `formData[fieldName] = undefined`, marks the field complete, emits `input-engine.field.skipped` with reason `user_skip`
4. If `maxRetries` is exhausted AND `metadata.optional === true`, the field is auto-skipped: `formData[fieldName] = undefined`, emit `input-engine.field.skipped` with reason `max_retries_skip`, instead of returning `err(FIELD_MAX_RETRIES)`

---

### Task 42 — Cancel Button Interception

#### FR Covered: FR-052, FR-053, EC2

#### Files

- Modify: `src/runner/field.iterator.ts` — detect `__cancel__` callback and `/cancel` text
- Test: `tests/unit/field.iterator.test.ts` — cancel via button, cancel via text, cancel disabled

When `allowCancel: true` (default):

1. The action buttons builder includes a "Cancel ❌" button
2. If the user taps the cancel button (`__cancel__` callback), `processField` returns `err(FORM_CANCELLED)`
3. If the user types `/cancel`, `parseResponse` in the field handler returns the raw text. The iterator intercepts `/cancel` text BEFORE calling parseResponse — if detected, returns `err(FORM_CANCELLED)`
4. Partial save data is PRESERVED (not deleted) — the existing `handleResult` in `form.runner.ts` already handles this for `FORM_CANCELLED`

When `allowCancel: false`:

1. No cancel button is shown (action buttons builder omits it)
2. `/cancel` text is NOT intercepted — passed to field handler as normal input

---

### Task 43 — Validation Error Display

#### FR Covered: FR-054, EC4

#### Files

- Create: `src/runner/validation-error.renderer.ts`
- Modify: `src/runner/field.iterator.ts` — call error renderer on parse/validate failure
- Test: `tests/unit/validation-error.renderer.test.ts`

```typescript
import type { FieldMetadata } from '../input-engine.types.js';

/** Default error i18n keys per field type category */
const DEFAULT_ERROR_KEYS: Record<string, string> = {
  ShortText: 'input-engine.errors.text_invalid',
  LongText: 'input-engine.errors.text_invalid',
  Email: 'input-engine.errors.email_invalid',
  Phone: 'input-engine.errors.phone_invalid',
  Integer: 'input-engine.errors.number_invalid',
  Float: 'input-engine.errors.number_invalid',
  // ... one per field type
};

/** Render a validation error message via i18n */
export function renderValidationError(
  metadata: FieldMetadata,
  retryState: RetryState,
  t: TranslateFunction,
): string {
  const errorKey =
    metadata.i18nErrorKey ??
    DEFAULT_ERROR_KEYS[metadata.fieldType] ??
    'input-engine.errors.generic';
  return t(errorKey, {
    attempt: retryState.current,
    maxRetries: retryState.max,
  });
}

interface RetryState {
  current: number;
  max: number;
}

type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;
```

The error is displayed to the user BEFORE re-rendering the field. The `processField` retry loop calls this function when `parseResponse` or `validate` fails. The rendered error string is sent via `renderPrompt` or `ctx.reply`.

---

### Task 44 — Bidirectional Field Iteration

#### FR Covered: FR-056, EC36, EC37, EC38

#### Files

- Modify: `src/runner/field.iterator.ts` — restructure from `for` loop to `while` loop with mutable index
- Test: `tests/unit/field.iterator.test.ts` — back navigation, back past conditional, back on first field

The current `iterateFields` uses a `for (let i = 0; ...)` loop that only moves forward. Phase 2 restructures it to a `while (index < fieldNames.length)` loop where `index` can be decremented on back navigation:

**Back navigation logic:**

1. User taps "⬅ Back" button (`__back__` callback detected in `processField`)
2. `processField` returns a sentinel value (e.g., `err(NAVIGATE_BACK)` — internal, not user-facing)
3. `iterateFields` detects the sentinel, removes the last entry from `completedFieldNames`, removes its value from `formData`, decrements `fieldsCompleted`, and decrements `index` to re-render the previous field
4. If `index` would go below 0 (first field), the back action is ignored (EC37)
5. After going back, conditional fields between the new index and the old index are re-evaluated (EC36)
6. When re-rendering the previous field, the `RenderContext` includes the previous value so the handler can show "Current value: X" and a "Keep current ✓" button

**Constraints:**

- First field (`fieldIndex === 0`): no "⬅ Back" button (EC37)
- After partial save restore: back navigation works within restored fields (EC38)
- Conditional re-evaluation: when going back to a field that other conditional fields depend on, changing the value triggers re-evaluation. Newly-hidden conditional fields are removed from `completedFieldNames` and `formData` (EC36)

---

### Task 45 — Progress Indicator

#### FR Covered: FR-055, EC42

#### Files

- Create: `src/runner/progress.renderer.ts`
- Modify: `src/runner/field.iterator.ts` — call progress renderer before each field
- Test: `tests/unit/progress.renderer.test.ts`

```typescript
import type { FieldMetadata } from '../input-engine.types.js';

/** Compute dynamic total by evaluating which remaining fields would render */
export function computeDynamicTotal(
  allFieldNames: string[],
  allMetadata: Map<string, FieldMetadata>,
  currentFormData: Record<string, unknown>,
  shouldRenderFn: (m: FieldMetadata, d: Record<string, unknown>) => boolean,
): number {
  return allFieldNames.filter((name) => {
    const meta = allMetadata.get(name);
    return meta ? shouldRenderFn(meta, currentFormData) : true;
  }).length;
}

/** Build progress message string */
export function renderProgress(current: number, total: number, t: TranslateFunction): string {
  return t('input-engine.progress', { current, total });
}

type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;
```

When `showProgress: true` (default), before rendering each field:

1. Call `computeDynamicTotal` to get the current total (excluding conditionally hidden fields)
2. Call `renderProgress` to build the i18n string
3. Send the progress message via `renderPrompt` or `ctx.reply`
4. The total is re-computed after each field completes because conditional visibility may change (EC42)

When `showProgress: false`, skip the progress message entirely.

---

### Task 46 — Back Navigation with Keep Current

#### FR Covered: FR-056 (second part), Clarification Q4

#### Files

- Modify: `src/runner/field.iterator.ts` — pass `previousValue` in RenderContext during back navigation
- Modify: `src/fields/field.handler.ts` — add optional `previousValue` to `RenderContext`
- Modify: `src/runner/action-buttons.builder.ts` — add "Keep current ✓" button when previousValue exists
- Test: `tests/unit/field.iterator.test.ts` — keep current flow, re-enter flow

When the user navigates back to a previously completed field:

1. `RenderContext` includes `previousValue: unknown` — the value previously entered for this field
2. The field handler renders the field with context showing the previous value (e.g., "Current value: Ahmed")
3. Action buttons include "Keep current ✓" (`__keep_current__` callback) in addition to normal buttons
4. If the user taps "Keep current", `processField` returns the `previousValue` unchanged
5. If the user enters a new value, normal parse/validate flow applies

The `RenderContext.previousValue` is `undefined` for first-time field entry and populated only during back-navigation re-render.

---

### Task 47 — FormOptions & FormRunnerDeps Updates

#### FR Covered: FR-055, FR-057, FR-054

#### Files

- Modify: `src/input-engine.types.ts` — add `showProgress`, `showConfirmation` to `FormOptions` and `DEFAULT_FORM_OPTIONS`
- Modify: `src/runner/form.runner.ts` — add `t`, `storageClient`, `aiClient` to `FormRunnerDeps`
- Test: `tests/unit/input-engine.types.test.ts` — verify new defaults
- Test: `tests/unit/form.runner.test.ts` — verify new deps are optional

```typescript
// Updated FormOptions
export interface FormOptions {
  partialSave?: boolean;
  partialSaveTTL?: number;
  maxMilliseconds?: number;
  allowCancel?: boolean;
  formId?: string;
  showProgress?: boolean; // default true
  showConfirmation?: boolean; // default true
}

// Updated DEFAULT_FORM_OPTIONS
export const DEFAULT_FORM_OPTIONS: Required<FormOptions> = {
  partialSave: false,
  partialSaveTTL: 86_400_000,
  maxMilliseconds: 600_000,
  allowCancel: true,
  formId: '',
  showProgress: true,
  showConfirmation: true,
};

// Updated FormRunnerDeps — add Phase 2 optional deps
export interface FormRunnerDeps {
  // ... existing ...
  t?: (key: string, params?: Record<string, unknown>) => string;
  storageClient?: StorageEngineClient;
  aiClient?: AIExtractionClient;
}
```

These type changes are prerequisites for the other Phase 2 tasks. Existing callers are unaffected because all new fields are optional.

---

### Task 48 — Confirmation Step

#### FR Covered: FR-057, FR-058, EC39, EC40, EC41

#### Files

- Create: `src/runner/confirmation.renderer.ts`
- Modify: `src/runner/field.iterator.ts` — call confirmation after all fields complete (when `showConfirmation: true`)
- Modify: `src/runner/form.runner.ts` — reset timeout deadline when confirmation shown (EC40)
- Test: `tests/unit/confirmation.renderer.test.ts`

```typescript
import type { FieldMetadata } from '../input-engine.types.js';

/** Display format for a field value in the confirmation summary */
export function formatFieldValue(value: unknown, metadata: FieldMetadata): string {
  // Text fields: show value directly
  // Choice fields: show selected label from metadata.options
  // Media fields: "✓ File uploaded"
  // Boolean fields: ✓ or ✗
  // Skipped optional fields (undefined): "—"
}

/** Build the full confirmation summary message */
export function buildConfirmationSummary(
  formData: Record<string, unknown>,
  fieldMetadata: Map<string, FieldMetadata>,
  t: TranslateFunction,
): string {
  // For each field: t(metadata.i18nKey) + ": " + formatFieldValue(value, metadata)
  // Returns multi-line summary string
}

/** Confirmation action enum */
export const CONFIRMATION_ACTIONS = {
  CONFIRM: '__confirm__',
  EDIT: '__edit__',
  CANCEL: '__cancel__',
} as const;

type TranslateFunction = (key: string, params?: Record<string, unknown>) => string;
```

**Confirmation flow:**

1. After all fields are completed, display summary via `buildConfirmationSummary`
2. Show 3 inline buttons: "✅ Confirm", "✏️ Edit field", "❌ Cancel"
3. **Confirm**: return `ok(formData)` (form completes)
4. **Edit**: show secondary inline keyboard listing all field names. User selects a field → re-enter that field (with previous value context) → re-evaluate conditions → re-display summary
5. **Cancel**: return `err(FORM_CANCELLED)` with partial save preserved
6. **Timeout reset**: when the confirmation summary is displayed, `progress.startTime` is reset to `Date.now()`, giving the user a fresh `maxMilliseconds` window to review (EC40)
7. **Edit → conditional re-evaluation**: if editing a field changes conditional visibility, newly-visible fields are asked and newly-hidden fields are removed from formData before re-displaying the summary (EC39)

---

### Task 49 — Storage Engine Integration in Media Handlers

#### FR Covered: FR-059

#### Files

- Modify: `src/fields/media/photo.field.ts` — call `storageClient.upload()` when available
- Modify: `src/fields/media/document.field.ts` — same
- Modify: `src/fields/media/video.field.ts` — same
- Modify: `src/fields/media/audio.field.ts` — same
- Modify: `src/fields/media/file-group.field.ts` — same (per file in group)
- Test: update 5 media test files with storage integration tests

When `StorageEngineClient` is provided in `FormRunnerDeps.storageClient`:

1. After successful `parseResponse` + `validate`, the media handler calls `storageClient.upload()` via `conversation.external()`
2. On success: returns `{ telegramFileId, storageUrl, fileName, mimeType, size }`
3. On failure: logs a warning via `logger.warn()` and returns `{ telegramFileId }` only (graceful degradation)

When `StorageEngineClient` is NOT provided:

1. Returns `{ telegramFileId }` only (current Phase 1 behavior, no change)

The `storageClient` is passed through from `FormRunnerDeps` to the field handler via the `RenderContext` or a new `FieldDeps` parameter. Since each handler's `render` method receives `RenderContext` which already includes `formData`, we extend `RenderContext` to include optional `storageClient` reference, or pass it via the existing `deps` chain.

---

### Task 50 — AI Extraction Full Flow

#### FR Covered: FR-031 (enhanced), FR-059 (AI part)

#### Files

- Modify: `src/fields/smart/ai-extractor.field.ts` — implement full extraction → confirmation → accept/edit/manual flow
- Test: update `tests/unit/ai-extractor.field.test.ts` with full flow tests

The AIExtractorField handler currently has a placeholder. Phase 2 implements the full flow:

1. **Render**: send i18n prompt asking user to send free-text, photo, or document
2. **Parse**: receive the user's input (text message, photo caption, or document)
3. **Extract**: call `aiClient.extract(input, targetFields)` via `conversation.external()`
4. **Display**: show extracted values for confirmation with 3 buttons:
   - "✅ Accept all" — accept all extracted values
   - "✏️ Edit" — let user edit individual extracted values
   - "📝 Manual input" — abandon AI extraction, ask all target fields manually
5. **Partial success**: if some target fields are not extracted, accept the extracted ones and ask remaining manually
6. **AI unavailable**: if `aiClient.isAvailable()` returns false, skip extraction entirely, show i18n unavailability message, fall back to manual step-by-step input for all target fields (Rule XXXIII)
7. **Extraction failure**: if `aiClient.extract()` returns err, log warning, fall back to manual input

---

### Task 51 — Barrel Exports Update & Phase 2 Validation

#### FR Covered: All Phase 2

#### Files

- Modify: `src/index.ts` — export new Phase 2 public types and constants
- Run: full test suite + tsc + eslint
- Verify: all 8 new features work end-to-end with existing Phase 1 infrastructure

Export from `src/index.ts`:

- `ACTION_CALLBACKS` from `action-buttons.builder.ts`
- `CONFIRMATION_ACTIONS` from `confirmation.renderer.ts`
- Updated `FormOptions` (already exported, now includes `showProgress`, `showConfirmation`)
- Updated `FormRunnerDeps` (already exported, now includes `t`, `storageClient`, `aiClient`)
- `FieldSkippedPayload` event type (for external consumption)

Validation checklist:

- [ ] `tsc --noEmit` passes with zero errors
- [ ] `eslint src/ --max-warnings 0` passes
- [ ] All existing Phase 1 tests continue to pass
- [ ] All new Phase 2 tests pass
- [ ] No file exceeds 200 code lines (Rule II)
- [ ] No function exceeds 50 code lines (Rule II)
- [ ] No function exceeds 3 parameters (Rule II)
- [ ] Zero hardcoded user-facing text (Rule XXXIX)
- [ ] All new files follow `{Feature}.{type}.ts` naming (Rule III)
