# Data Model: Input Engine (Dynamic Form Engine)

## Entities

### `FieldHandler` (Runtime Interface — not persisted)

Contract that every field type implements. The FormRunner delegates to the appropriate handler based on the `fieldType` from registry metadata.

| Property        | Type                                                                                                                | Description                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `fieldType`     | `FieldType`                                                                                                         | The field type identifier (e.g., `'ShortText'`, `'Integer'`) |
| `render`        | `(conversation, ctx, metadata: FieldMetadata, formData: Record<string, unknown>) => AsyncResult<unknown, AppError>` | Render the field prompt and UI (buttons, calendar, etc.)     |
| `parseResponse` | `(message: Message, metadata: FieldMetadata) => Result<unknown, AppError>`                                          | Parse the user's response into a typed value                 |
| `validate`      | `(value: unknown, schema: ZodType, metadata: FieldMetadata) => Result<unknown, AppError>`                           | Validate the parsed value against the Zod schema             |

---

### `FieldMetadata` (Runtime — from Zod 4 Registry)

Metadata attached to each Zod field schema via `z.globalRegistry.register()`. Not persisted to database.

| Property             | Type                                                     | Description                                                   |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `fieldType`          | `FieldType`                                              | One of 39 built-in field types                                |
| `i18nKey`            | `string`                                                 | i18n key for the field prompt text                            |
| `i18nErrorKey`       | `string?`                                                | i18n key for validation error message (optional, has default) |
| `order`              | `number?`                                                | Display order (optional, defaults to schema key order)        |
| `optional`           | `boolean?`                                               | Whether the field can be skipped                              |
| `conditions`         | `FieldCondition[]?`                                      | Conditional display rules                                     |
| `maxRetries`         | `number?`                                                | Max invalid input retries (default 3)                         |
| `options`            | `ChoiceOption[]?`                                        | For SingleChoice, MultipleChoice                              |
| `min`                | `number?`                                                | For Integer, Float, Currency, StarRating                      |
| `max`                | `number?`                                                | For Integer, Float, Currency, StarRating, Percentage          |
| `minLength`          | `number?`                                                | For ShortText, LongText                                       |
| `maxLength`          | `number?`                                                | For ShortText, LongText                                       |
| `maxSizeKB`          | `number?`                                                | For Photo, Document, Video, Audio                             |
| `allowedExtensions`  | `string[]?`                                              | For Document                                                  |
| `allowedTypes`       | `string[]?`                                              | For Photo (MIME types)                                        |
| `maxDurationSeconds` | `number?`                                                | For Video, Audio                                              |
| `minFiles`           | `number?`                                                | For FileGroup                                                 |
| `maxFiles`           | `number?`                                                | For FileGroup                                                 |
| `minSelections`      | `number?`                                                | For MultipleChoice                                            |
| `maxSelections`      | `number?`                                                | For MultipleChoice                                            |
| `pattern`            | `RegExp?`                                                | For RegexValidated, NationalID, PassportNumber                |
| `targetFields`       | `string[]?`                                              | For AIExtractorField — names of fields to extract             |
| `levels`             | `MultiStepLevel[]?`                                      | For MultiStepChoice — hierarchical level definitions          |
| `preserveQuality`    | `boolean?`                                               | For Photo — request uncompressed image                        |
| `use12Hour`          | `boolean?`                                               | For TimePicker — 12-hour vs 24-hour mode                      |
| `dataSource`         | `() => AsyncResult<ChoiceOption[], AppError>?`           | For SearchableList — lazy data loading function               |
| `availableSlots`     | `TimeSlot[]?`                                            | For SchedulePicker — static available slots                   |
| `slotDataSource`     | `((date: string) => AsyncResult<TimeSlot[], AppError>)?` | For SchedulePicker — dynamic slot loader                      |
| `slotDuration`       | `number?`                                                | For SchedulePicker — slot duration in minutes                 |
| `countryCodes`       | `CountryCode[]?`                                         | For EgyptianMobile — selectable country codes                 |
| `defaultCountryCode` | `string?`                                                | For EgyptianMobile — default country code (e.g., '+20')       |
| `defaultCountry`     | `string?`                                                | For IBAN — default country (e.g., 'EG')                       |
| `allowedCountries`   | `string[]?`                                              | For IBAN — allowed countries                                  |
| `currency`           | `string?`                                                | For CurrencyAmount — currency override (e.g., 'EGP')          |
| `allowedCurrencies`  | `string[]?`                                              | For CurrencyAmount — allowed currencies                       |
| `decimalPlaces`      | `number?`                                                | For CurrencyAmount — decimal precision                        |
| `expectedFormat`     | `('url' \| 'text' \| 'json' \| 'any')?`                  | For QRCode — expected QR data format                          |
| `onLabel`            | `string?`                                                | For Toggle — i18n key for "on" button                         |
| `offLabel`           | `string?`                                                | For Toggle — i18n key for "off" button                        |
| `defaultValue`       | `boolean?`                                               | For Toggle — default toggle state                             |
| `minTags`            | `number?`                                                | For Tags — minimum tags required                              |
| `maxTags`            | `number?`                                                | For Tags — maximum tags allowed                               |
| `allowCustom`        | `boolean?`                                               | For Tags — allow typing custom tags                           |
| `predefinedTags`     | `ChoiceOption[]?`                                        | For Tags — selectable predefined tags                         |
| `maxTagLength`       | `number?`                                                | For Tags — max length per tag                                 |
| `extractData`        | `boolean?`                                               | For NationalID — extract birth date, governorate, gender      |

---

### `FormOptions` (Runtime Configuration — not persisted)

Options passed to `runForm()` that control form behavior.

| Property           | Type      | Description                        | Default             |
| ------------------ | --------- | ---------------------------------- | ------------------- |
| `partialSave`      | `boolean` | Enable partial save to Redis       | `false`             |
| `partialSaveTTL`   | `number`  | TTL in ms for partial save data    | `86400000` (24h)    |
| `maxMilliseconds`  | `number`  | Form timeout in ms                 | `600000` (10 min)   |
| `allowCancel`      | `boolean` | Allow `/cancel` command and button | `true`              |
| `formId`           | `string`  | Unique form instance ID            | Auto-generated UUID |
| `showProgress`     | `boolean` | Show "Field X of Y" progress       | `true`              |
| `showConfirmation` | `boolean` | Show summary before submission     | `true`              |

---

### `FormState` (Redis — via CacheService through conversations storage adapter)

Serialized conversation state persisted to Redis for partial save. Managed by the custom conversations storage adapter. Not a database table.

| Property            | Type                      | Description                                                   |
| ------------------- | ------------------------- | ------------------------------------------------------------- |
| `formId`            | `string`                  | Unique form instance identifier                               |
| `userId`            | `string`                  | User who started the form                                     |
| `chatId`            | `number`                  | Telegram chat ID where form is running                        |
| `conversationData`  | `unknown`                 | Serialized grammY conversation state (opaque to input-engine) |
| `collectedFields`   | `Record<string, unknown>` | Field values collected so far                                 |
| `currentFieldIndex` | `number`                  | Index of the current/next field to ask                        |
| `startedAt`         | `string` (ISO 8601)       | Form start timestamp                                          |
| `lastUpdatedAt`     | `string` (ISO 8601)       | Last field completion timestamp                               |

**Storage:** Redis via `@tempot/shared` CacheService.
**Key format:** `ie:form:{formId}:{userId}`
**TTL:** Configurable via `FormOptions.partialSaveTTL` (default 24 hours).

---

### `ChoiceOption` (Runtime — not persisted)

Represents a selectable option for SingleChoice, MultipleChoice, and SearchableList fields.

| Property   | Type       | Description                      |
| ---------- | ---------- | -------------------------------- |
| `value`    | `string`   | Machine-readable value           |
| `label`    | `string`   | i18n key for display text        |
| `emoji`    | `string?`  | Optional emoji prefix            |
| `disabled` | `boolean?` | Whether the option is selectable |

---

### `FieldCondition` (Runtime — not persisted)

Defines a condition for ConditionalField display logic.

| Property    | Type                                                          | Description                                          |
| ----------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `dependsOn` | `string`                                                      | Field name this condition depends on                 |
| `operator`  | `'equals' \| 'notEquals' \| 'in' \| 'gt' \| 'lt' \| 'custom'` | Comparison operator                                  |
| `value`     | `unknown`                                                     | Value to compare against                             |
| `fn`        | `((formData: Record<string, unknown>) => boolean)?`           | Custom condition function (for `operator: 'custom'`) |

---

### `MultiStepLevel` (Runtime — not persisted)

Defines a level in a MultiStepChoice hierarchy.

| Property     | Type                                                             | Description                   |
| ------------ | ---------------------------------------------------------------- | ----------------------------- |
| `label`      | `string`                                                         | i18n key for level label      |
| `options`    | `ChoiceOption[]`                                                 | Static options for this level |
| `dataSource` | `(parentValue: string) => AsyncResult<ChoiceOption[], AppError>` | Dynamic options loader        |

---

### `TimeSlot` (Runtime — not persisted)

Available time slot for SchedulePicker fields.

| Property    | Type      | Description                  |
| ----------- | --------- | ---------------------------- |
| `startTime` | `string`  | Start time in HH:MM format   |
| `endTime`   | `string`  | End time in HH:MM format     |
| `slotId`    | `string?` | Optional slot identifier     |
| `available` | `boolean` | Whether the slot is bookable |
| `label`     | `string?` | i18n key for display label   |

---

### `CountryCode` (Runtime — not persisted)

Country code option for EgyptianMobile field.

| Property   | Type      | Description                     |
| ---------- | --------- | ------------------------------- |
| `code`     | `string`  | ISO 3166-1 alpha-2 (e.g., 'EG') |
| `dialCode` | `string`  | Dial prefix (e.g., '+20')       |
| `name`     | `string`  | i18n key for country name       |
| `flag`     | `string?` | Flag emoji (e.g., '🇪🇬')         |

---

### `NationalIDResult` (Runtime — not persisted)

Result returned by NationalID field when `extractData: true`.

| Property      | Type                    | Description                             |
| ------------- | ----------------------- | --------------------------------------- |
| `id`          | `string`                | The 14-digit national ID                |
| `birthDate`   | `string?`               | Extracted birth date (ISO 8601)         |
| `governorate` | `string?`               | Governorate name from code (digits 8-9) |
| `gender`      | `('male' \| 'female')?` | Digit 13: odd=male, even=female         |

---

### `ContactResult` (Runtime — not persisted)

Result returned by Contact field (Telegram contact sharing).

| Property      | Type      | Description                   |
| ------------- | --------- | ----------------------------- |
| `phoneNumber` | `string`  | Contact's phone number        |
| `firstName`   | `string`  | Contact's first name          |
| `lastName`    | `string?` | Contact's last name           |
| `userId`      | `number?` | Telegram user ID if available |

---

### `SchedulePickerResult` (Runtime — not persisted)

Result returned by SchedulePicker field.

| Property | Type      | Description                 |
| -------- | --------- | --------------------------- |
| `date`   | `string`  | Selected date (ISO 8601)    |
| `time`   | `string`  | Selected time (HH:MM)       |
| `slotId` | `string?` | Slot identifier if provided |

---

### `EgyptianMobileResult` (Runtime — not persisted)

Result returned by EgyptianMobile field.

| Property      | Type      | Description                     |
| ------------- | --------- | ------------------------------- |
| `number`      | `string`  | Number in 01x-xxxx-xxxx format  |
| `countryCode` | `string`  | Country dial code (e.g., '+20') |
| `operator`    | `string?` | Detected operator name          |

---

### `CurrencyAmountResult` (Runtime — not persisted)

Result returned by CurrencyAmount field.

| Property   | Type     | Description                          |
| ---------- | -------- | ------------------------------------ |
| `amount`   | `number` | Numeric amount                       |
| `currency` | `string` | ISO 4217 currency code (e.g., 'EGP') |

---

### Configuration Types (Runtime — from environment)

| Config Type         | Fields                                 | Used By      |
| ------------------- | -------------------------------------- | ------------ |
| `InputEngineConfig` | `enabled` (from `TEMPOT_INPUT_ENGINE`) | Toggle guard |

---

### Event Payloads (not persisted)

| Payload                 | Fields                                                                                                      | Event Name                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `FormCompletedPayload`  | `formId`, `userId`, `fieldCount`, `durationMs`, `hadPartialSave`                                            | `input-engine.form.completed`  |
| `FormCancelledPayload`  | `formId`, `userId`, `fieldsCompleted`, `totalFields`, `reason: 'user_cancel' \| 'timeout' \| 'max_retries'` | `input-engine.form.cancelled`  |
| `FormResumedPayload`    | `formId`, `userId`, `resumedFromField`, `totalFields`                                                       | `input-engine.form.resumed`    |
| `FieldValidatedPayload` | `formId`, `userId`, `fieldType`, `fieldName`, `valid`, `retryCount`                                         | `input-engine.field.validated` |

---

### `RenderContext` (Runtime — passed to field handler render)

Context object passed to field handlers during rendering, providing form-level positioning information.

| Property        | Type                      | Description                                                      |
| --------------- | ------------------------- | ---------------------------------------------------------------- |
| `formId`        | `string`                  | Unique form instance identifier                                  |
| `fieldIndex`    | `number`                  | Zero-based index of the current field in the form                |
| `previousValue` | `unknown?`                | Previous value for this field (populated during back navigation) |
| `conversation`  | `unknown`                 | grammY Conversation object                                       |
| `ctx`           | `unknown`                 | grammY Context object                                            |
| `formData`      | `Record<string, unknown>` | Form data collected so far                                       |

---

### `FormRunnerDeps` (Runtime — injected dependencies)

Optional dependencies injected into the FormRunner to support partial save, custom rendering, and Phase 2 features.

| Property          | Type                                                        | Description                                                  |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `storageAdapter?` | `ConversationsStorageAdapter`                               | Storage adapter for partial save (F2 — wires partial save)   |
| `renderPrompt?`   | `(ctx: unknown, text: string) => Promise<unknown>`          | Custom render function for field prompts (F4 — render layer) |
| `t?`              | `(key: string, params?: Record<string, unknown>) => string` | i18n translation function (Phase 2 — structural interface)   |
| `storageClient?`  | `StorageEngineClient`                                       | For media upload integration (FR-059, Phase 2)               |
| `aiClient?`       | `AIExtractionClient`                                        | For AI extraction integration (FR-031, Phase 2)              |

---

### `FormProgress` (Runtime — internal tracking)

Internal state tracked by the FormRunner during form execution.

| Property              | Type       | Description                                           |
| --------------------- | ---------- | ----------------------------------------------------- |
| `completedFieldNames` | `string[]` | Names of fields that have been completed              |
| `partialSaveEnabled`  | `boolean`  | Whether partial save is active for this form instance |
| `storageKey`          | `string`   | Redis key used for partial save storage               |
| `startTime`           | `number`   | Timestamp (ms) when the form started                  |
| `maxMilliseconds`     | `number`   | Maximum allowed form duration in milliseconds         |

---

### `PartialSaveData` (Runtime — serialized to Redis)

Data structure serialized to Redis when partial save is enabled.

| Property              | Type                      | Description                              |
| --------------------- | ------------------------- | ---------------------------------------- |
| `formData`            | `Record<string, unknown>` | Collected field values so far            |
| `fieldsCompleted`     | `number`                  | Number of fields completed               |
| `completedFieldNames` | `string[]`                | Names of fields that have been completed |

---

### `ActionButtonContext` (Runtime — Phase 2)

Context for building inline keyboard action button rows.

| Property       | Type      | Description                                |
| -------------- | --------- | ------------------------------------------ |
| `formId`       | `string`  | Form instance identifier for callback data |
| `fieldIndex`   | `number`  | Current field index for callback data      |
| `isOptional`   | `boolean` | Whether to show "Skip ⏭" button           |
| `isFirstField` | `boolean` | Whether to suppress "⬅ Back" button        |
| `allowCancel`  | `boolean` | Whether to show "Cancel ❌" button         |

---

### `ActionButtonRow` (Runtime — Phase 2)

A row of inline keyboard buttons for form actions.

| Property  | Type                                            | Description         |
| --------- | ----------------------------------------------- | ------------------- |
| `buttons` | `Array<{ text: string; callbackData: string }>` | Buttons in this row |

---

### `FieldSkippedPayload` (Event — Phase 2)

Emitted when a field is skipped (user skip, auto-skip, or condition skip).

| Property    | Type                                               | Description                     |
| ----------- | -------------------------------------------------- | ------------------------------- |
| `formId`    | `string`                                           | Form instance identifier        |
| `userId`    | `string`                                           | User who skipped                |
| `fieldName` | `string`                                           | Name of the skipped field       |
| `fieldType` | `string`                                           | Field type of the skipped field |
| `reason`    | `'user_skip' \| 'max_retries_skip' \| 'condition'` | Why the field was skipped       |

---

## Relationships

- `FieldHandler` is an **in-memory runtime interface** with no database backing. Handlers are registered in a `Map<FieldType, FieldHandler>` at package initialization.
- `FieldMetadata` is **attached to Zod schemas** via `z.globalRegistry`. Not stored separately — metadata is accessed via `z.globalRegistry.get(schema)` at runtime.
- `FormState` is stored in **Redis via CacheService** through the custom conversations storage adapter. Not a database table. Automatically expired via TTL.
- `FormOptions` is a **runtime configuration object** passed to `runForm()`. Not persisted. Phase 2 adds `showProgress` and `showConfirmation`.
- `ChoiceOption`, `FieldCondition`, and `MultiStepLevel` are **nested types** within `FieldMetadata`. Not stored independently.
- `TimeSlot`, `CountryCode`, `NationalIDResult`, `ContactResult`, `SchedulePickerResult`, `EgyptianMobileResult`, and `CurrencyAmountResult` are **runtime result types** — returned from field handlers, not persisted.
- Event payloads are defined **inline** in `event-bus.events.ts` (structurally matching the types above) to avoid circular dependencies. Phase 2 adds `FieldSkippedPayload`.
- `ActionButtonContext` and `ActionButtonRow` are **Phase 2 runtime types** used by `buildActionButtons()` to compose inline keyboard rows. Not persisted.
- `FormRunnerDeps` Phase 2 additions (`t`, `storageClient`, `aiClient`) are **optional structural interfaces** — callers that don't use Phase 2 features can omit them.

---

## Storage Mechanisms

### Partial Save Storage (Redis via CacheService)

Partial save uses the `@tempot/shared` CacheService through a custom conversations storage adapter:

1. **Save**: After each valid field entry, the conversation state is serialized and stored via `CacheService.set<FormState>(key, state, ttl)`.
2. **Resume**: On form re-entry, the adapter checks `CacheService.get<FormState>(key)`. If found, conversations uses `checkpoint()` / `rewind()` to restore state.
3. **Expiry**: `partialSaveTTL` (default 24 hours) controls automatic cleanup.
4. **Degradation**: When Redis is unavailable, CacheService falls back to in-memory storage (Rule XXXII). Partial save works within the process but not across restarts.

### Key Format

```
ie:form:{formId}:{userId}
```

Example: `ie:form:abc123:user456`

### Lifecycle

```
runForm() called
  ├── Check toggle guard (TEMPOT_INPUT_ENGINE)
  ├── Validate schema (detect errors before any user interaction)
  ├── Check for existing partial save
  │   ├── Found → Resume from checkpoint
  │   └── Not found → Start fresh
  ├── For each field (bidirectional iteration — Phase 2):
  │   ├── Compute dynamic progress total (Phase 2, if showProgress)
  │   ├── Display progress indicator (Phase 2, if showProgress)
  │   ├── Evaluate conditions (skip if condition not met, emit field.skipped)
  │   ├── Build action buttons: Skip (if optional), Back (if not first), Cancel (if allowed)
  │   ├── Render field prompt + action buttons (single message, D7)
  │   ├── Wait for user response OR action button tap
  │   ├── Handle action buttons:
  │   │   ├── __skip__ → set undefined, emit field.skipped(user_skip), next
  │   │   ├── __cancel__ → return err(FORM_CANCELLED), preserve partial save
  │   │   ├── __back__ → decrement index, re-evaluate conditionals, re-render
  │   │   └── __keep_current__ → keep previous value, next
  │   ├── Parse and validate response
  │   │   ├── Valid → Save to partial state, checkpoint, next field
  │   │   └── Invalid → Show i18n error (Phase 2), retry (up to maxRetries)
  │   │       └── If optional + max retries → auto-skip (Phase 2)
  │   └── Handle /cancel text (when allowCancel, Phase 2)
  ├── All fields complete
  │   ├── If showConfirmation (Phase 2):
  │   │   ├── Reset timeout deadline
  │   │   ├── Display confirmation summary
  │   │   ├── Wait for Confirm / Edit / Cancel
  │   │   │   ├── ✅ Confirm → proceed to result
  │   │   │   ├── ✏️ Edit → re-enter field, re-evaluate conditions, re-display
  │   │   │   └── ❌ Cancel → return err(FORM_CANCELLED)
  │   │   └── Loop until Confirm or Cancel
  │   └── If !showConfirmation → proceed directly
  ├── Delete partial save from Redis
  ├── Emit form.completed event
  └── Return ok(formData)
```

### Session Integration

- `activeConversation` in `@tempot/session-manager` tracks which form (if any) is active for the user in the current chat.
- Set when form starts, cleared when form completes or is cancelled.
- Used by other modules to check if the user is currently in a form interaction.
