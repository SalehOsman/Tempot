# Design: Regional Engine — Stateless Facade

**Package**: `@tempot/regional-engine`
**Feature Branch**: `009-regional-engine-package`
**Created**: 2026-03-25
**Status**: Approved Design
**Architecture Reference**: Section 11.3 of `docs/tempot_v11_final.md`
**Spec Artifacts**: `specs/009-regional-engine-package/{spec,plan,tasks}.md`

---

## 1. Overview

The regional-engine package is a stateless facade that centralizes timezone conversion, currency/number formatting, and geographic data retrieval. It resolves a `RegionalContext` per request — either from environment defaults (static mode) or from the user's session (dynamic mode) — then delegates to three sub-services: `DateService`, `FormatService`, and `GeoService`.

Egypt/Cairo/ar-EG/EGP are **defaults only**, not hardcoded limits. The system supports any country, timezone, and locale that `dayjs` timezones and `Intl` locales support (FR-007).

## 2. Architecture: Stateless Facade with Three Sub-Services

### 2.1 Design Decision: Stateless Facade

`RegionalEngine` (aliased from `RegionalService`) is a **stateless facade**. Every public method takes its data as parameters — it holds no per-user state. Context resolution happens once per request via `getContext()`, which reads `REGIONAL_MODE` from `process.env` and optionally merges session data from `@tempot/session-manager`.

This was chosen over alternatives:

- **Singleton with cached context** — rejected because it couples lifetime to request lifecycle
- **Middleware-injected context** — rejected because it would require grammY dependency
- **Pure function module** — rejected because composing three sub-services benefits from class-based DI

### 2.2 Component Mapping (Arch Spec Section 11.3.2)

| Arch Spec Name            | Implementation                                        | File                                    |
| ------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `RegionalEngine` (facade) | `RegionalService` (exported also as `RegionalEngine`) | `regional.service.ts`                   |
| `timezone/`               | `DateService`                                         | `date.service.ts`                       |
| `formatter/`              | `FormatService`                                       | `format.service.ts`                     |
| `geo/`                    | `GeoService` + `GeoSelectField`                       | `geo.service.ts`, `geo-select.field.ts` |

The barrel export re-exports `RegionalService as RegionalEngine` for consumers expecting the arch spec name.

### 2.3 Package Structure

```
packages/regional-engine/
  package.json
  tsconfig.json
  vitest.config.ts
  .gitignore
  src/
    index.ts              # barrel exports
    types.ts              # RegionalContext, GeoState, GeoCity, GeoOption
    context.resolver.ts   # pure function: reads REGIONAL_MODE from process.env
    date.service.ts       # dayjs-based timezone conversion and formatting
    format.service.ts     # Intl-based currency, number, percent formatting
    geo.service.ts        # static GEO_REGISTRY, getStates/getCities/searchGeo
    geo-select.field.ts   # GeoOption[] builder for input-engine
    regional.service.ts   # facade composing all sub-services
  data/
    geo/
      EG.json             # generated from countries-states-cities-database
  scripts/
    generate-geo.ts       # generates data/geo/{CC}.json
  tests/
    unit/
      types.test.ts
      context-resolver.test.ts
      date-service.test.ts
      format-service.test.ts
      geo-service.test.ts
      geo-select-field.test.ts
      regional-service.test.ts
```

## 3. Context Resolution

### 3.1 `context.resolver.ts` — Pure Function

The context resolver is a **pure function** that reads `REGIONAL_MODE` from `process.env` and returns a `RegionalContext`. It does not import `sessionContext` directly — that coupling is in `RegionalService.getContext()`.

```typescript
// Pseudocode — actual implementation follows TDD
function resolveRegionalMode(): 'static' | 'dynamic' {
  return process.env.REGIONAL_MODE === 'dynamic' ? 'dynamic' : 'static';
}
```

### 3.2 Resolution Flow

```
getContext() called
  │
  ├─ mode = resolveRegionalMode()
  │
  ├─ if mode === 'static'
  │    └─ return DEFAULT_REGIONAL_CONTEXT
  │
  └─ if mode === 'dynamic'
       ├─ store = sessionContext.getStore()
       ├─ if no store → return DEFAULT_REGIONAL_CONTEXT
       └─ merge session fields over defaults
            timezone:     store.timezone     ?? DEFAULT.timezone
            locale:       store.locale       ?? DEFAULT.locale
            currencyCode: store.currencyCode ?? DEFAULT.currencyCode
            countryCode:  store.countryCode  ?? DEFAULT.countryCode
```

### 3.3 ContextSession Integration

The current `ContextSession` interface in `@tempot/session-manager` has an open index signature (`[key: string]: unknown`), so regional fields can be read via that escape hatch today. However, the spec calls for 4 optional fields to be added:

```typescript
export interface ContextSession {
  userId?: string;
  userRole?: string;
  timezone?: string; // e.g., 'Africa/Cairo'
  locale?: string; // e.g., 'ar-EG'
  currencyCode?: string; // e.g., 'EGP'
  countryCode?: string; // e.g., 'EG'
  [key: string]: unknown;
}
```

**Decision**: These 4 fields will be added to `ContextSession` as part of this package's implementation (Task 6). This is a non-breaking additive change — existing consumers are unaffected since all fields are optional. A blast radius assessment (Rule LIV) is trivial: no existing code reads these fields.

## 4. DateService — Timezone & Formatting

### 4.1 Public API

All methods return `Result<T, AppError>`. No thrown exceptions.

| Method        | Signature                                          | Arch Spec Equivalent       |
| ------------- | -------------------------------------------------- | -------------------------- |
| `format`      | `(date, formatStr, locale?, tz?) → Result<string>` | `formatDate`, `formatTime` |
| `toUTC`       | `(date, tz) → Result<Date>`                        | `toLocalTime` (inverse)    |
| `getNow`      | `(tz?) → Result<Date>`                             | `getNow`                   |
| `getTimezone` | `(ctx) → string`                                   | `getTimezone`              |

### 4.2 Library Setup

```
dayjs + plugins: utc, timezone, localizedFormat
dayjs locales: ar (loaded at module level)
```

Plugins are extended once at module scope (not per-call). The `dayjs/locale/ar` import is side-effect-only and must appear before any formatting call.

### 4.3 Error Handling

- Invalid timezone → `Result.err(AppError('regional.invalid_timezone', { tz }))`
- Invalid date input → `Result.err(AppError('regional.invalid_date', { date }))`
- Internal dayjs error → caught, wrapped in `AppError('regional.format_failed', error.message)`

### 4.4 DST Handling

`dayjs` with the timezone plugin handles DST transitions automatically. No manual DST logic is needed. This is explicitly documented in the spec edge cases.

## 5. FormatService — Currency & Numbers

### 5.1 Public API

| Method           | Signature                                       | Arch Spec Equivalent |
| ---------------- | ----------------------------------------------- | -------------------- |
| `formatCurrency` | `(amount, locale?, currency?) → Result<string>` | `formatCurrency`     |
| `formatNumber`   | `(value, locale?) → Result<string>`             | `formatNumber`       |
| `formatPercent`  | `(value, locale?) → Result<string>`             | `formatPercent`      |

### 5.2 Implementation

Uses **only** the built-in `Intl.NumberFormat` API — no external formatting libraries (FR-003). This is significant because:

- `Intl` handles Arabic numeral rendering natively (`١٢٣` vs `123`)
- Currency symbol placement is locale-aware (`ج.م` suffix for EGP in `ar-EG`)
- No additional bundle size

### 5.3 Error Handling

- Invalid locale → `Result.err(AppError('regional.invalid_locale', { locale }))`
- Invalid currency code → `Result.err(AppError('regional.invalid_currency', { currency }))`
- `Intl` throws → caught, wrapped in `AppError`

### 5.4 Arch Spec Methods: getCurrencyCode / getCurrencySymbol

Section 11.3.4 lists `getCurrencyCode(ctx)` and `getCurrencySymbol(ctx)`. These are trivial derivations from `RegionalContext`:

- `getCurrencyCode` → `ctx.currencyCode` (direct read)
- `getCurrencySymbol` → format `0` with the given locale/currency and extract the symbol

These will be implemented on `RegionalService` (the facade) rather than `FormatService`, since they operate on the resolved context.

## 6. GeoService — Geographic Data

### 6.1 Static GEO_REGISTRY

Geo-data is loaded from bundled JSON files into a **static `GEO_REGISTRY`** map at module scope. No `require()`, no dynamic imports, no `eslint-disable`.

```typescript
// Pseudocode
const GEO_REGISTRY: ReadonlyMap<string, GeoDataFile> = new Map([
  ['EG', egGeoData],
  // Future: ['SA', saGeoData], etc.
]);
```

**Decision**: Using a `Record<string, GeoDataFile>` (or `Map`) with static imports. Adding a new country means: (1) run `scripts/generate-geo.ts SA`, (2) add a static import + registry entry. This is intentionally manual to keep the package deterministic and auditable.

### 6.2 Data Structure (Section 11.3.5 Alignment)

The arch spec Section 11.3.5 specifies `i18nKey` on geo entities:

```
code: 'CAI'
i18nKey: 'geo.EG.states.CAI'
cities[]: each with code and i18nKey
```

The spec's `GeoState` and `GeoCity` interfaces include `name` and `name_ar` but **not** `i18nKey`. This is a gap:

**Resolution**: Add `i18nKey` to both `GeoState` and `GeoCity` per the arch spec:

```typescript
interface GeoState {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  i18nKey: string; // e.g., 'geo.EG.states.CAI'
  countryCode: string;
}

interface GeoCity {
  id: string;
  stateId: string;
  name: string;
  name_ar: string;
  i18nKey: string; // e.g., 'geo.EG.cities.CAI.heliopolis'
}
```

This aligns with the arch spec and enables the i18n system to provide localized geo names. The `name_ar` field serves as the immediate display fallback when i18n is not yet resolving geo keys.

### 6.3 Public API

| Method           | Signature                                                | Notes                                |
| ---------------- | -------------------------------------------------------- | ------------------------------------ |
| `getStates`      | `(countryCode) → Result<GeoState[]>`                     | Returns `ok([])` for unknown country |
| `getCities`      | `(stateId) → Result<GeoCity[]>`                          | Returns `ok([])` for unknown state   |
| `getStateByCode` | `(code, countryCode) → Result<GeoState \| undefined>`    | Arch spec 11.3.5                     |
| `searchGeo`      | `(query, countryCode) → Result<(GeoState \| GeoCity)[]>` | Arabic + English search              |

### 6.4 Unsupported Country Code

Returns `Result.ok([])` — empty array, **not** an error. The caller decides how to handle missing data. This is explicitly documented in spec edge cases.

### 6.5 Corrupt/Empty Geo-data

Returns `Result.err(AppError('regional.geo_data_corrupt'))`. This can only happen if a JSON file is manually corrupted after generation — the generate script validates output.

## 7. GeoSelectField — Plain Data for Input Engine

### 7.1 Boundary

`GeoSelectField` returns `Result<GeoOption[], AppError>`. It has **zero grammY imports** (SC-007, FR-006). The dependency direction is:

```
input-engine → regional-engine (input-engine depends on regional-engine)
```

### 7.2 Public API

| Method           | Signature                             |
| ---------------- | ------------------------------------- |
| `buildStateMenu` | `(countryCode) → Result<GeoOption[]>` |
| `buildCityMenu`  | `(stateId) → Result<GeoOption[]>`     |

### 7.3 Label Strategy

Labels use `name_ar` from `GeoState`/`GeoCity`. In the future, when the i18n system resolves geo keys, labels could switch to `t(state.i18nKey)`. For now, `name_ar` is the direct fallback — no i18n dependency in this package.

## 8. Geo-data Generation Script

### 8.1 `scripts/generate-geo.ts`

Generates `data/geo/{CC}.json` from the `countries-states-cities-database` npm package. The script:

1. Reads the source database (CSV/JSON from the npm package)
2. Filters by the given country code
3. Maps to the `GeoState`/`GeoCity` interfaces (including `i18nKey` generation)
4. Validates the output structure
5. Writes to `data/geo/{CC}.json`

**Usage**: `npx tsx scripts/generate-geo.ts EG`

This script is a dev-time tool, not a runtime dependency. It is NOT exported from the package.

## 9. Dependencies

### 9.1 Runtime Dependencies

| Package                   | Version         | Purpose                                          |
| ------------------------- | --------------- | ------------------------------------------------ |
| `dayjs`                   | `1.11.13`       | Date/time manipulation with timezone support     |
| `neverthrow`              | `8.2.0` (exact) | Result pattern                                   |
| `@tempot/shared`          | `workspace:*`   | `AppError`, `Result`, `AsyncResult` types        |
| `@tempot/session-manager` | `workspace:*`   | `sessionContext` for per-user context resolution |

### 9.2 Dev Dependencies

| Package                            | Version         | Purpose                                         |
| ---------------------------------- | --------------- | ----------------------------------------------- |
| `typescript`                       | `5.9.3` (exact) | TypeScript compiler                             |
| `vitest`                           | `4.1.0` (exact) | Test runner                                     |
| `countries-states-cities-database` | latest          | Geo-data source (dev-only, for generate script) |

### 9.3 Explicit Non-Dependencies

| Package                     | Reason                                                     |
| --------------------------- | ---------------------------------------------------------- |
| `grammy`                    | GeoSelectField returns plain data; input-engine renders it |
| `@tempot/database`          | Geo-data is bundled JSON, not DB queries                   |
| `ioredis` / `cache-manager` | Caching is a future concern, not in scope                  |

## 10. Error Codes

All error codes follow the hierarchical pattern (Rule XXII):

| Code                        | When                                    | Severity     |
| --------------------------- | --------------------------------------- | ------------ |
| `regional.invalid_timezone` | Invalid tz string passed to DateService | User error   |
| `regional.invalid_date`     | Unparseable date input                  | User error   |
| `regional.format_failed`    | dayjs internal error during formatting  | System error |
| `regional.invalid_locale`   | Invalid locale string for Intl API      | User error   |
| `regional.invalid_currency` | Unknown currency code for Intl API      | User error   |
| `regional.geo_data_corrupt` | Bundled JSON is malformed               | System error |

## 11. Testing Strategy

### 11.1 Test Distribution (Rule XXXV)

All tests are unit tests (Vitest). No integration tests needed — this package has no DB, no Redis, no external I/O. Geo-data is bundled JSON read synchronously.

### 11.2 Test Files

| File                       | Coverage Target                                         |
| -------------------------- | ------------------------------------------------------- |
| `types.test.ts`            | Default constant values, type instantiation             |
| `context-resolver.test.ts` | Static/dynamic mode from env var                        |
| `date-service.test.ts`     | Format with multiple timezones, toUTC, DST, error cases |
| `format-service.test.ts`   | Currency (EGP, SAR), number, percent, invalid locale    |
| `geo-service.test.ts`      | 27 governorates, cities, search, unsupported country    |
| `geo-select-field.test.ts` | buildStateMenu, buildCityMenu, empty country            |
| `regional-service.test.ts` | Static mode, dynamic mode, fallback, session merge      |

### 11.3 Performance Assertions

- `DateService.format()` < 5ms per call (NFR-001, SC-001)
- `GeoService.getStates()` < 50ms from bundled JSON (NFR-002, SC-002)

## 12. Open Questions and Risks

### 12.1 Open Questions (For PM Decision)

1. **`getStateByCode` in spec**: The arch spec (11.3.5) lists `getStateByCode(code, ctx)` but the SpecKit spec and plan do not mention it. **Recommendation**: Add it to `GeoService` — it's a simple lookup and tests are trivial. Addressed in Section 6.3 above.

2. **`countries-states-cities-database` as devDependency**: The plan lists it in `dependencies` but it should be `devDependencies` since only the generate script uses it at dev time, not the runtime code. The generated JSON is the runtime artifact. **Recommendation**: Move to `devDependencies`.

3. **Locale mapping in RegionalService**: The plan's `resolveLocale` method maps `'ar'` → `'ar-EG'` via a hardcoded map. With ContextSession gaining an explicit `locale` field, this mapping may be unnecessary — the session can store the full locale string directly. **Recommendation**: Keep the mapping as a fallback for backwards compatibility with sessions that only store a language code, but prefer the full locale when available.

### 12.2 Identified Risks

1. **`i18nKey` gap**: The SpecKit spec/plan omit `i18nKey` from `GeoState`/`GeoCity`, but the arch spec requires it. This design adds it. If the PM prefers to defer `i18nKey`, it can be added later as a non-breaking additive change — but adding it now avoids a second pass over the geo-data schema.

2. **dayjs locale loading**: `dayjs/locale/ar` is a side-effect import. If the import is tree-shaken or reordered, Arabic formatting silently falls back to English. **Mitigation**: The test suite explicitly asserts Arabic output (e.g., `expect(result.value).toContain('مارس')`), catching this at build time.

3. **`Intl.NumberFormat` locale validation**: Node.js does NOT throw for all invalid locales — some are silently normalized. The `'regional.invalid_locale'` error path may not trigger for all malformed locales. **Mitigation**: Document that truly invalid locales (e.g., `'zzz-ZZZ'`) do throw, but near-valid ones may silently normalize. This is acceptable — Intl's behavior is the standard.

4. **Blast radius of ContextSession change**: Adding 4 optional fields to `ContextSession` is additive and non-breaking. Verified: no existing code reads `timezone`, `locale`, `currencyCode`, or `countryCode` from the session store. Risk is minimal.

---

## 13. Summary of Decisions Confirmed (Not Re-Opened)

These were established before brainstorming and are locked:

1. RegionalEngine is a stateless facade — every public method takes `(data, session?)`
2. `context.resolver.ts` is a pure function reading `REGIONAL_MODE` from `process.env`
3. ContextSession needs 4 optional fields: `timezone?`, `locale?`, `currencyCode?`, `countryCode?`
4. GeoService uses static `GEO_REGISTRY` — no `require()`, no `eslint-disable`
5. `GeoState`/`GeoCity` include `i18nKey` per arch spec Section 11.3.5
6. `scripts/generate-geo.ts` generates `data/geo/EG.json` from `countries-states-cities-database`
7. `GeoSelectField` returns `Result<GeoOption[], AppError>` — zero grammY imports
8. Egypt/Cairo/ar-EG/EGP are DEFAULTS only, not hardcoded limits (FR-007)
