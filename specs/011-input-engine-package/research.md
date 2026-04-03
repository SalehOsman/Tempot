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
