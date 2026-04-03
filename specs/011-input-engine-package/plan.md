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
│  External Dependencies (structural interfaces — injected at runtime)  │
│  ──────────────────────────────────────────────────────────────────   │
│  StorageEngineClient?  │  AIExtractionClient?  │  RegionalClient?    │
│  (@tempot/storage)     │  (@tempot/ai-core)    │  (@tempot/regional) │
└────────────────────────┴───────────────────────┴─────────────────────┘
```

**Four Phases:**

- **Phase 1A — Foundation**: Package scaffolding, types/contracts/errors, toggle guard, conversations storage adapter, FieldHandler interface, FormRunner core
- **Phase 1B — Text & Number Fields**: All 6 text fields + all 5 number fields (11 handlers)
- **Phase 1C — Choice & Time/Place Fields**: All 4 choice fields + all 5 time/place fields (9 handlers)
- **Phase 1D — Advanced Fields + Polish**: Media (6), Smart (2), Geo (2), Identity (4), Interactive (5), barrel exports, event registration (19 handlers + infrastructure)

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

| Rule   | Requirement                           | Status                                         |
| ------ | ------------------------------------- | ---------------------------------------------- |
| III    | File naming: `{Feature}.{type}.ts`    | Pass — all files follow pattern                |
| XVI    | Toggle guard: `TEMPOT_INPUT_ENGINE`   | Pass — D6                                      |
| XXI    | Result pattern: `Result<T, AppError>` | Pass — D5, correcting architecture spec        |
| XXXII  | Redis degradation                     | Pass — CacheService handles fallback           |
| XXXIII | AI degradation                        | Pass — AIExtractorField falls back to manual   |
| XXXIX  | i18n-Only                             | Pass — FR-004                                  |
| XLIII  | No zombie code                        | Will verify                                    |
| LXVII  | Confirmation expiry (N/A for forms)   | N/A — no confirmations in input-engine         |
| LXXVII | No phantom dependencies               | Pass — structural interfaces for optional deps |

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
│   │   └── schema.validator.ts            # Schema validation at call time
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
│       └── callback-data.utils.ts         # Form-specific callback data helpers
└── tests/
    └── unit/
        ├── input-engine.types.test.ts
        ├── input-engine.config.test.ts
        ├── schema.validator.test.ts
        ├── form.runner.test.ts
        ├── conversations-storage.adapter.test.ts
        ├── field.handler.test.ts
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

No constitution violations to justify. The package follows all rules directly.
