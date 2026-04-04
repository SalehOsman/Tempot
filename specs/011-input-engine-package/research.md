# Research: Input Engine (Dynamic Form Engine)

## Decisions

### 1. @grammyjs/conversations v2.1.1 as Native Foundation

- **Decision:** Build directly on `@grammyjs/conversations` v2.1.1 native APIs. Use `conversation.form.build()` for field rendering, `conversation.menu()` for interactive inline keyboards, `conversation.checkpoint()` / `conversation.rewind()` for partial save resume, `maxMilliseconds` for timeout, `otherwise` callbacks for unexpected input handling, and `conversation.external()` for calling external services.
- **Rationale:** The conversations plugin already solves the hard problems: state machine management, message waiting, and serializable conversation state for persistence. Building an abstraction layer on top would add complexity without value. Native APIs are well-documented and stable at v2.1.1.
- **Alternatives rejected:** Custom conversation state machine (massive effort, reinvents the wheel). `telegraf` scenes (different framework). Wrapping conversations in an abstraction layer (adds indirection without benefit, makes debugging harder).

### 2. Zod 4 with Global Registry for Field Metadata

- **Decision:** Use Zod 4's `z.globalRegistry.register(schema, metadata)` to co-locate field validation rules with field metadata (type, i18n key, conditions, rendering options). The form schema is a standard `z.object()` combining registered field schemas.
- **Rationale:** Replaces the custom `FormSchema` configuration object from the architecture spec §7.3.9. Benefits: (1) validation and metadata are co-located — no separate config to maintain, (2) schemas are standard Zod — developers already know the API, (3) no custom DSL to learn, (4) registry metadata is type-safe. Zod 4 registry is a first-class feature, not a hack.
- **Alternatives rejected:** Custom `FormSchema` config object (architecture spec §7.3.9 — decouples validation from metadata, requires synchronization). JSON-based schema definition (loses type safety). Decorators on classes (not compatible with functional Zod API).

### 3. All 39 Field Types in One Package

- **Decision:** Ship all 39 field types in `@tempot/input-engine`. No separate field type packages. 9 categories: Text (6), Numbers (5), Choice (4), Time/Place (5), Media (6), Smart (2), Geo (2), Identity (4), Interactive (5).
- **Rationale:** Field types share common infrastructure (validation loop, i18n rendering, callback data encoding, partial save hooks). Splitting into separate packages would create excessive inter-package dependencies and deployment complexity. Tree-shaking eliminates unused code at build time. The architecture spec §7.3.4 groups all field types in one package.
- **Alternatives rejected:** Separate package per field category (9 packages — excessive). Plugin architecture for custom fields (overengineered for Phase 1 — can be added later). Fewer field types with custom field API (defers too much work to module developers).

### 4. Custom Conversations Storage Adapter Using CacheService

- **Decision:** Implement a custom storage adapter for `@grammyjs/conversations` that uses `@tempot/shared` CacheService for persistence. The adapter implements the conversations storage interface, using `CacheService.set<T>()` and `CacheService.get<T>()` with configurable TTL. Falls back gracefully when Redis is unavailable per Rule XXXII.
- **Rationale:** The conversations plugin supports custom storage adapters for persisting conversation state. Using `@tempot/shared` CacheService provides: (1) automatic Redis degradation to in-memory (Rule XXXII), (2) consistent TTL management, (3) reuse of existing infrastructure. NOT `@grammyjs/storage-redis` because that's designed for session storage (different interface). NOT session-manager metadata because conversations have their own state model that's more complex than session data.
- **Alternatives rejected:** `@grammyjs/storage-redis` (wrong interface — designed for session, not conversations state). Session-manager metadata fields (conversations state is a serialized state machine, not simple key-value pairs). Direct Redis calls (bypasses CacheService degradation logic, violates Rule XXXII).

### 5. Result Pattern via neverthrow (Correcting Architecture Spec)

- **Decision:** All public methods return `Result<T, AppError>` or `AsyncResult<T, AppError>` via `neverthrow 8.2.0`. The architecture spec §7.3.3 / §7.3.6 uses `{ success: true, data }` / `{ success: false, reason }` — this is corrected to the neverthrow Result pattern per Constitution Rule XXI.
- **Rationale:** Every other Tempot package uses the Result pattern. The architecture spec's `{ success, data }` pattern predates the Constitution. Rule XXI is explicit: "All public methods return Result<T, AppError>. No thrown exceptions." Consistency across the monorepo is non-negotiable.
- **Alternatives rejected:** `{ success: boolean, data }` pattern (architecture spec — violates Constitution Rule XXI). Thrown exceptions (violates Rule XXI). Mixed approach (confusing, inconsistent).

### 6. Toggle Guard Pattern

- **Decision:** `TEMPOT_INPUT_ENGINE` environment variable (`true`/`false`, default `true`) controls the package per Constitution Rule XVI. When disabled, `runForm()` immediately returns `err(AppError('input-engine.disabled'))` with zero side effects. Same pattern as `@tempot/ai-core`'s `guardEnabled()` function.
- **Rationale:** Rule XVI mandates every core package has a toggle. The guard must be the first check in `runForm()` — before schema validation, conversation creation, or storage adapter initialization. Zero side effects when disabled means no resources allocated.
- **Alternatives rejected:** Compile-time feature flag (not runtime-configurable). Environment variable checked per-field (too granular, per-form is sufficient). No toggle (violates Rule XVI).

### 7. FieldHandler Interface with Strategy Pattern

- **Decision:** Each of the 39 field types implements a common `FieldHandler` interface: `render(conversation, ctx, metadata, formData)`, `validate(input, metadata)`, `parseResponse(message, metadata)`. The `FormRunner` iterates over fields and delegates to the appropriate handler based on `fieldType` from the registry metadata.
- **Rationale:** Strategy pattern keeps field implementations isolated and testable. New field types can be added by implementing the interface and registering in the handler map. The `FormRunner` doesn't need to know field-type-specific logic — it just calls the handler. Each handler is a single file following Rule III naming: `short-text.field.ts`, `integer.field.ts`, etc.
- **Alternatives rejected:** Switch statement in FormRunner (monolithic, hard to test). Class hierarchy with inheritance (deep inheritance is fragile). Decorator pattern (overengineered for strategy selection).

### 8. Structural Interfaces for Optional Dependencies

- **Decision:** Define minimal structural interfaces for optional dependencies (`StorageEngineClient`, `AIExtractionClient`, `RegionalEngineClient`) in `input-engine.contracts.ts`. At runtime, the actual implementations are injected via `FormOptions`.
- **Rationale:** Same pattern proven in `@tempot/ai-core` (Research Decision 12). Prevents hard dependencies on optional packages. `@tempot/storage-engine`, `@tempot/ai-core`, and `@tempot/regional-engine` are optional integrations. Without structural interfaces, input-engine would have phantom dependencies (violates Rule LXXVII). Unit testing is trivial with mock implementations.
- **Alternatives rejected:** Direct imports (creates hard dependency, fails when optional package not installed). `require()` with try/catch (not compatible with ESM). Peer dependencies (still need interface types for compilation).

### 9. File Naming Convention

- **Decision:** All files follow Rule III: `{Feature}.{type}.ts`. Field handlers: `short-text.field.ts`, `integer.field.ts`, `date-picker.field.ts`. Services: `form.runner.ts`, `storage.adapter.ts`, `schema.validator.ts`. Types: `input-engine.types.ts`, `input-engine.contracts.ts`, `input-engine.errors.ts`.
- **Rationale:** Consistent with all other Tempot packages. Rule III is explicit about this naming convention.
- **Alternatives rejected:** Flat naming (`shortText.ts` — doesn't indicate file role). Directory-per-field (`fields/short-text/index.ts` — too deep for simple single-file handlers). Barrel re-exports per category (`fields/text/index.ts` — unnecessary indirection).

### 10. Event Emission via Fire-and-Log Pattern

- **Decision:** Form lifecycle events (`form.completed`, `form.cancelled`, `form.resumed`, `field.validated`) are emitted via `@tempot/event-bus` using the fire-and-log pattern: emit the event, log a warning if emission fails, never let event emission failure break the form flow.
- **Rationale:** Same pattern used in ai-core and other packages. Events are for analytics and observability — they must never interrupt the primary form flow. The event bus publish method returns `AsyncResult` but the result is intentionally ignored (void-ed).
- **Alternatives rejected:** Awaiting event emission (blocks form flow). No events (loses observability). Synchronous event emission (not supported by event bus).

### 11. Inline Keyboard Callback Data Encoding

- **Decision:** All inline keyboard callback data uses `encodeCallbackData` / `decodeCallbackData` from `@tempot/ux-helpers` with a form-instance-specific prefix: `ie:{formId}:{fieldName}:{value}`. This prevents callback collision between concurrent form instances.
- **Rationale:** Multiple users can be filling out forms simultaneously. Without unique prefixes, callback data from one form instance could be processed by another. The `encodeCallbackData` utility from ux-helpers already handles Telegram's 64-byte callback data limit via compression.
- **Alternatives rejected:** Random callback IDs (requires lookup table, adds complexity). Session-based routing (conversations already route by user, but callback data still needs to be unique). No prefix (collision risk with concurrent forms).

### 12. CurrencyAmount Config-Driven Currency

- **Decision:** `CurrencyAmount` field determines currency from configuration, not user selection. Priority: (1) `metadata.currency` override, (2) `DEFAULT_CURRENCY` environment variable, (3) fallback to 'EGP'. Different from the `Currency` field which is a simple number with formatting — `CurrencyAmount` includes explicit currency context and returns `CurrencyAmountResult { amount, currency }`.
- **Rationale:** In the Tempot use case, most bots operate in a single-currency context (Egyptian Pound). Asking the user to select currency adds friction when it's almost always the same. Config-driven currency keeps forms short. Multi-currency support is available via `allowedCurrencies` metadata.
- **Alternatives rejected:** User-selects-currency (extra step, usually unnecessary). Always EGP (too restrictive for non-Egyptian deployments). Separate CurrencySelector field (overengineered — currency is metadata of the amount, not a separate field).

### 13. EgyptianMobile Operator Detection

- **Decision:** Detect Egyptian mobile operator from the 3-digit prefix after "01": Vodafone (010), Etisalat (011), Orange (012), WE (015). Unknown prefixes (e.g., 016) are accepted but `operator` is set to `undefined`. Country code is selected via inline keyboard with +20 as default.
- **Rationale:** Operator detection is a common requirement in Egyptian enterprise bots (for carrier-specific services, mobile wallet identification). The prefix → operator mapping is stable and well-known. Accepting unknown prefixes ensures forward compatibility when new operators or MVNOs are allocated prefixes by NTRA.
- **Alternatives rejected:** Reject unknown prefixes (breaks when new prefixes are allocated). External API lookup (unnecessary — prefix mapping is static). No operator detection (loses valuable metadata that many Egyptian bots need).

### 14. NationalID Data Extraction

- **Decision:** When `extractData: true`, the NationalID field handler extracts embedded data from the 14-digit Egyptian national ID: century+birth date (digits 1-7), governorate code (digits 8-9 mapped to governorate name), and gender (digit 13: odd=male, even=female). Checksum validation is always performed. When `extractData: false` (default), returns plain string (backward compatible).
- **Rationale:** Egyptian national IDs encode structured data that bots frequently need (age verification, regional targeting, gender statistics). Extracting this data at the field handler level eliminates duplicate parsing logic across modules. The `extractData` flag makes this opt-in — backward compatible with the simpler string-only behavior.
- **Alternatives rejected:** Always extract (breaks backward compatibility, adds unnecessary overhead). Separate extraction utility (developers would need to know about it — better to integrate into the field). Extract but return as separate fields (adds schema complexity — a single `NationalIDResult` is cleaner).

### 15. Action Button Rendering — Single-Message Pattern (D7)

- **Decision:** Field action buttons (Skip, Cancel, Back) are appended as extra row(s) to the field handler's inline keyboard, producing a single message per field. The FormRunner composes the final keyboard: field-specific rows from the handler + action button row(s) from the builder. Action buttons are built by a pure function `buildActionButtons()` in `action-buttons.builder.ts`.
- **Rationale:** A single message per field is cleaner UX — avoids message clutter of sending separate action button messages. Telegram inline keyboards support up to 8 rows (8 buttons per row, max 100 buttons per message), which is more than sufficient for field-specific buttons + 1-2 action button rows. The builder is a pure function for easy testing and no side effects.
- **Alternatives rejected:** Separate message for action buttons (doubles message count, creates clutter). Reply keyboard for actions (conflicting with Contact field which needs ReplyKeyboardMarkup). Menu-based actions (too complex for simple skip/cancel/back).

### 16. Bidirectional Field Iteration via While Loop

- **Decision:** Restructure `iterateFields` from a forward-only `for` loop to a `while (index < fieldNames.length)` loop with a mutable index that can be decremented for back navigation. Back navigation removes the last completed field from `completedFieldNames`, deletes its value from `formData`, decrements `fieldsCompleted`, and re-renders at the new index.
- **Rationale:** A `for` loop cannot move backward. A `while` loop with an explicit index variable allows both forward iteration (index++) and backward navigation (index--). This is the minimal change to the existing loop structure. The sentinel pattern (`err(NAVIGATE_BACK)`) for detecting back navigation reuses the existing Result pattern without introducing a new communication channel.
- **Alternatives rejected:** Recursive field processing (stack depth risk with 50+ field forms, harder to reason about). Doubly-linked list of fields (overengineered for sequential iteration). State machine per field (YAGNI — simple index manipulation is sufficient).

### 17. Dynamic Progress Total via Condition Re-evaluation

- **Decision:** The progress indicator's total is re-computed after each field by calling `shouldRenderField()` on all remaining fields against the current `formData`. This means the total may change as conditional fields become visible or hidden during form progression. The progress message uses `t('input-engine.progress', { current, total })`.
- **Rationale:** A static total would be inaccurate when conditional fields exist — showing "Field 5 of 10" when only 7 fields will actually be rendered is misleading. Dynamic re-evaluation gives the most accurate count. The cost is O(N) per field (evaluating all field conditions), which is negligible for forms with <100 fields.
- **Alternatives rejected:** Static total from schema field count (inaccurate with conditional fields). "Field 5 of ~10" approximation (imprecise, confusing). No total — only "Field 5" (loses valuable UX signal about form length).

### 18. Translation Function as Structural Interface

- **Decision:** The translation function `t` is provided via `FormRunnerDeps` as a structural interface: `(key: string, params?: Record<string, unknown>) => string`. The caller provides a pre-bound translation function — no import from `@tempot/i18n-core`. When `t` is not provided, Phase 2 features that need it (progress, error display, confirmation) are skipped or fall back to raw key strings.
- **Rationale:** Follows the existing minimal-interface dependency pattern established for `StorageEngineClient` and `AIExtractionClient`. Avoids hard dependency on `@tempot/i18n-core` (which would violate the structural interface pattern). The caller (usually a module handler) has i18n context and can provide `t` pre-bound to the user's locale.
- **Alternatives rejected:** Import `@tempot/i18n-core` directly (creates hard dependency, violates structural interface pattern). Pass locale string and let FormRunner resolve translations (FormRunner shouldn't know about i18n internals). No i18n for errors/progress (violates Rule XXXIX).

### 19. Confirmation Step with Timeout Reset

- **Decision:** When `showConfirmation: true` (default), after all fields are completed, a summary is displayed with Confirm/Edit/Cancel buttons. The confirmation step resets `progress.startTime` to `Date.now()`, giving the user a fresh `maxMilliseconds` window to review. This means the confirmation step does NOT count toward the form's original deadline.
- **Rationale:** Users filling out long forms (10+ fields) may reach the confirmation with very little time remaining on the original `maxMilliseconds` clock. Timing out during review — when all data is already collected — would be a terrible UX. Resetting the deadline for the confirmation step is the most user-friendly approach. The confirmation summary is displayed as a single message with inline buttons, following the single-message pattern from D7.
- **Alternatives rejected:** No timeout reset (risks timing out during review after long forms). Separate timeout for confirmation only (adds configuration complexity). Infinite timeout for confirmation (no protection against abandoned sessions).

### 20. Confirmation Edit — Conditional Re-evaluation

- **Decision:** When the user edits a field from the confirmation summary, conditional fields are re-evaluated against the updated `formData`. If editing changes conditional visibility: newly-visible fields are asked (the user must fill them), and newly-hidden fields are removed from `formData` and `completedFieldNames`. The updated summary is then re-displayed.
- **Rationale:** Conditional field visibility depends on the values of other fields. If the user changes a value that a condition depends on, the downstream conditional fields may no longer be valid. Re-evaluating ensures data consistency. Asking newly-visible fields ensures completeness. Removing newly-hidden fields prevents stale data in the result.
- **Alternatives rejected:** No re-evaluation (stale conditional data in result). Re-run the entire form (wastes user's time). Only re-evaluate the edited field (misses cascading conditional changes).

### 21. Storage Integration via RenderContext Extension

- **Decision:** Media field handlers receive `storageClient` (when available) via the existing dependency chain — either through `FormRunnerDeps` passed to the handler, or by extending `RenderContext` to include an optional `storageClient` reference. The upload call uses `conversation.external()` to ensure proper serialization in the conversations plugin. On upload failure, the handler logs a warning and degrades gracefully to returning `{ telegramFileId }` only.
- **Rationale:** Extends the existing `FormRunnerDeps` → handler dependency pattern. Using `conversation.external()` is mandatory because storage upload is an external async operation — the conversations plugin requires all external calls to be wrapped in `conversation.external()` for proper state serialization. Graceful degradation on upload failure follows Rule XXXII (Redis degradation) by analogy — external service failures should not break the primary flow.
- **Alternatives rejected:** Direct import of storage-engine (violates structural interface pattern, Rule LXXVII). Upload after form completion (loses per-file validation/upload feedback). Make upload mandatory (breaks when storage-engine is not available).

### 22. Input-Engine Downloads Files Before Storage Upload

- **Decision:** Input-engine downloads the file from Telegram via `conversation.external()` + grammY `getFile()` and passes the raw `Buffer` to `storageClient.upload(buffer, { filename, mimeType })`. Storage-engine never interacts with Telegram APIs.
- **Rationale:** Keeps `@tempot/storage-engine` Telegram-agnostic — it receives a Buffer and metadata, which is a universal interface. Input-engine already has the grammY conversation context and knows how to use `conversation.external()` for proper state serialization. The alternative (passing fileId to storage-engine) would couple storage-engine to Telegram's API.
- **Alternatives rejected:** Storage-engine accepts fileId and downloads itself (couples storage-engine to Telegram). Post-form batch upload (loses per-file feedback, delays validation).

### 23. Input-Engine Extracts Text Before AI Extraction

- **Decision:** For AI extraction fields, input-engine extracts text content from media inputs before calling `aiClient.extract(input, targetFields)`. For both photos and documents, the Telegram message **caption** is used as the text input. No OCR or PDF text extraction is performed in Phase 2 — the user is expected to describe the data in the message caption or send a free-text message. The `AIExtractionClient.extract()` contract stays string-only.
- **Rationale:** Keeps the AI client contract simple and focused — it receives text and returns structured data. The primary use case for AI extraction is the user describing multiple field values in natural language (e.g., "اسمي أحمد وعمري 30"), not sending a scanned document for OCR. Using the message caption for media inputs is a natural extension — users can attach a photo of a document and describe its contents in the caption. Full OCR/document content extraction (PDF parsing, image-to-text) is deferred to a future phase as it would require new dependencies and a more complex extraction pipeline.
- **Alternatives rejected:** Expand AI client contract to accept file references (couples AI client to file handling). Add OCR/PDF parsing in Phase 2 (YAGNI — caption-based extraction covers the primary use case). Defer media extraction entirely (limits FR-031 scope unnecessarily when caption extraction is trivial).

### 24. Single-Message Composition for Progress and Errors

- **Decision:** Progress indicator text and validation error messages are embedded/prepended into the field prompt message rather than sent as separate Telegram messages. Progress text appears at the top of the message, error text appears before the re-rendered prompt. This produces exactly one message per field interaction.
- **Rationale:** Aligns with the D7 single-message pattern. Separate messages would create 2-3 messages per field interaction (progress + error + prompt), cluttering the chat history. Embedding keeps the UX clean and focused. The field prompt message already has inline keyboard buttons — adding text context to it is natural.
- **Alternatives rejected:** Separate messages for progress/error (creates clutter, breaks D7 pattern). Notification-style messages that auto-delete (adds complexity, Telegram doesn't support auto-delete timing reliably).

### 25. Back Navigation Skips Condition-False Fields

- **Decision:** When navigating backward, the iterator decrements the index and walks backward past any fields where `shouldRenderField()` returns false (condition-skipped fields). It lands on the last user-answered field. This prevents the user from seeing fields they never interacted with.
- **Rationale:** If a field was condition-skipped during forward iteration, it should also be skipped during backward iteration. Stopping at a condition-skipped field would confuse the user (they never answered it) and require an extra Back press to reach the intended field. The O(N) backward scan is negligible.
- **Alternatives rejected:** Simple decrement without skipping (user sees condition-skipped fields, must press Back again). Jump to last completed field by name lookup (overengineered — simple backward scan is sufficient).

### 26. Confirmation Summary Overflow Handling

- **Decision:** Each field value in the confirmation summary is truncated to a maximum of 100 characters with '...' for overflow. If the total summary still exceeds Telegram's 4096-character limit, it is split across multiple messages with proper pagination.
- **Rationale:** Arabic text with 20+ fields can exceed 4096 chars. Truncating individual values keeps the summary readable without losing essential information. Message splitting is the standard Telegram pattern for long content. The 100-char limit is generous for most field values while preventing extreme cases (e.g., long text fields) from dominating the summary.
- **Alternatives rejected:** No limit (risks Telegram API error). Paginated summary with "next page" buttons (overengineered for edge case). Show field count summary without values (loses review purpose).

### 27. Confirmation Edit — Newly-Visible Fields Asked After Edited Field

- **Decision:** When a user edits a field from the confirmation summary and conditions change, newly-visible fields are asked in schema order starting after the edited field. This means the user only re-answers fields that come after the edited field in the form sequence.
- **Rationale:** Asking newly-visible fields in schema order preserves the natural form flow. Inserting them "after the edited field" means the user doesn't re-answer fields before the edit point (which haven't changed). Appending at the end would break the logical field ordering. Fields before the edited field are not re-evaluated since their dependencies haven't changed.
- **Alternatives rejected:** Append at end (breaks schema ordering). Ask all newly-visible fields regardless of position (user re-answers fields whose dependencies didn't change). No re-evaluation (stale data in result).

## Deferred Features

| Feature                         | Status         | Notes                                                                              |
| ------------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| Custom field type plugin API    | Not in Phase 1 | Allow modules to register custom field types. Deferred until field library matures |
| Form builder UI                 | Not in Phase 1 | Visual form designer for non-developers. Requires web frontend                     |
| Form analytics dashboard        | Not in Phase 1 | Completion rates, drop-off analysis. Events are emitted for future consumption     |
| Voice input for all text fields | Not in Phase 1 | Uses ai-core for speech-to-text. Only AIExtractorField supports voice in Phase 1   |
| Form templates/presets          | Not in Phase 1 | Pre-built form schemas for common patterns (registration, feedback, order)         |
| Multi-language form switching   | Not in Phase 1 | Switch form language mid-flow. i18n handles static text, not dynamic switching     |
| Conditional field groups        | Not in Phase 1 | Show/hide entire groups of fields based on conditions. Only single field supported |
| Form versioning                 | Not in Phase 1 | Track schema changes over time. Not needed until forms are persisted as config     |
