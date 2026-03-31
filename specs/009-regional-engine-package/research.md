# Research: Regional Engine

## Decisions

### 1. Date/Time Library

- **Decision:** Use `dayjs 1.11.13` with plugins: `utc`, `timezone`, `localizedFormat`. Arabic locale loaded via `dayjs/locale/ar.js`.
- **Rationale:** Smallest bundle size among date libraries, plugin architecture avoids loading unused features, same API as Moment.js (familiar). Selected per ADR-010.
- **Alternatives considered:** Luxon (rejected — larger bundle, different API surface). Moment.js (rejected — deprecated, large bundle). Native `Intl.DateTimeFormat` only (rejected — insufficient for timezone conversion and custom formatting).

### 2. Timezone/Locale Validation

- **Decision:** Use `Intl.DateTimeFormat` as a validation oracle before passing to dayjs.
- **Rationale:** dayjs silently degrades — it falls back to UTC for invalid timezones and to English for invalid locales instead of throwing errors. `Intl.DateTimeFormat` throws a `RangeError` for invalid values, making it a reliable validation gate. The service validates first, then calls dayjs only with known-good inputs.
- **Alternatives considered:** dayjs native validation (rejected — dayjs does not validate, it silently falls back). Regex-based IANA database check (rejected — fragile and incomplete).

### 3. Currency/Number Formatting

- **Decision:** Use the native `Intl.NumberFormat` API with `style: 'currency'`, `style: 'percent'`, and default decimal formatting. Zero additional dependencies.
- **Rationale:** `Intl.NumberFormat` handles Arabic-Eastern numerals (e.g., `١٥٠`), locale-specific grouping, and currency symbols (e.g., `ج.م.` for EGP) natively. No library provides better Arabic number formatting than the platform built-in.
- **Alternatives considered:** Dinero.js (rejected — overkill for formatting-only use case, designed for monetary arithmetic). Numeral.js (rejected — poor Arabic locale support).

### 4. Geographic Data Source

- **Decision:** Use `country-state-city 3.2.1` (dev dependency only) to generate bundled JSON data at build time via `scripts/generate-geo-data.ts`.
- **Rationale:** Provides structured State/City class API with ISO codes. Used only at build time — the runtime reads pre-generated JSON files, keeping the package free of large data dependencies at runtime.
- **Alternatives considered:** `countries-states-cities-database` (referenced in spec/plan but replaced during implementation — `country-state-city` has a cleaner API with typed class accessors). Direct API calls (rejected — requires network, adds latency, violates offline-first principle).

### 5. Geo Data Storage Strategy

- **Decision:** Bundled static JSON files in `data/geo/{CC}.json`, loaded lazily via `readFileSync` and cached in a module-level `GEO_REGISTRY` map.
- **Rationale:** Eliminates database dependency — geo data is static reference data that changes infrequently. Lazy loading avoids startup cost when geo features are unused. The `CORRUPT_SENTINEL` pattern distinguishes between "file not found" (`ok([])`) and "file exists but malformed" (`err(AppError)`).
- **Alternatives considered:** Static `import` of JSON (referenced in plan — rejected because it loads data at module import time even if unused, and prevents dynamic country support). Database table (rejected — adds migration/seeding complexity for static data, violates package autonomy per ADR-024). In-memory hardcoded map (rejected — unmaintainable for 1000+ cities).

### 6. Arabic Translation Gap

- **Decision:** Arabic state names are maintained as a static `STATE_NAMES_AR` map (27 entries) in the generator script. City names fall back to English with `i18nKey` provided for future `i18n-core` translation.
- **Rationale:** The upstream `country-state-city` package lacks Arabic translations entirely. States are a manageable set (27 for Egypt) for manual curation. Cities (140+) are too numerous for manual translation — the `i18nKey` field enables deferred translation via the CMS system.
- **Alternatives considered:** External Arabic geo-data API (rejected — no reliable free API exists). Manual translation of all cities (rejected — not scalable, deferred to i18n-core CMS).

### 7. Session Context Integration

- **Decision:** Use Node.js `AsyncLocalStorage` from `@tempot/session-manager` to resolve per-user regional settings without explicit context passing.
- **Rationale:** `AsyncLocalStorage` propagates context through the async call chain automatically. `RegionalService` supports two modes: `static` (always returns `DEFAULT_REGIONAL_CONTEXT`) and `dynamic` (reads from session with field-by-field fallback to defaults).
- **Alternatives considered:** Explicit context parameter on every method (rejected — ergonomic burden, every caller must pass context). Global singleton config (rejected — cannot support per-user settings).

### 8. Result Pattern

- **Decision:** All 13 public methods across 5 classes return `Result<T, AppError>` via `neverthrow 8.2.0`. Zero thrown exceptions in public APIs.
- **Rationale:** Strict adherence to Rule XXI. Error codes are hierarchical strings: `regional.invalid_timezone`, `regional.invalid_locale`, `regional.format_failed`, `regional.utc_conversion_failed`, `regional.geo_data_corrupt`.
- **Alternatives considered:** None — Rule XXI is non-negotiable.

## Implementation Divergences from Plan

| Aspect                | Plan                               | Actual Code                         | Rationale                          |
| --------------------- | ---------------------------------- | ----------------------------------- | ---------------------------------- |
| Geo data library      | `countries-states-cities-database` | `country-state-city 3.2.1`          | Cleaner typed API                  |
| Geo data loading      | Static `import` from JSON          | Dynamic `readFileSync` + lazy cache | Avoids eager loading               |
| Corrupt data handling | Not specified                      | `CORRUPT_SENTINEL` pattern          | Distinguishes missing vs malformed |
| Locale resolution     | `store.lang` with locale map       | Direct `store.locale` field         | Session already stores full locale |
| `GeoOption.value`     | `state.state_code`                 | `state.id`                          | See Note below                     |

**Note on GeoOption.value:** The spec defines `value` as "state code" and the plan was updated to use `state.state_code`. However, the implementation uses `state.id`. This divergence exists because `getCities(stateId)` expects a `stateId` parameter — using `state.code` as the value would break the state→city drill-down flow since cities are keyed by `stateId`, not by state code. This is an intentional implementation choice for functional correctness.
