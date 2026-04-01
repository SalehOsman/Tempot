# Feature Specification: Regional Engine (Time, Currency & Geo)

**Feature Branch**: `009-regional-engine-package`  
**Created**: 2026-03-19  
**Updated**: 2026-03-25  
**Status**: Complete  
**Input**: User description: "Establish the functional regional-engine package for managing timezones, currencies, and geographical data as per Tempot v11 Blueprint."  
**Architecture Reference**: Section 11.3 of `docs/tempot_v11_final.md`

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Localized Time & Formatting (Priority: P1)

As a user, I want dates and times to be displayed in my local timezone and language so that I can understand schedules and activity logs without mental conversion.

**Why this priority**: Fundamental UX requirement for localized bot experiences (Section 11.3).

**Independent Test**: Verified by setting a user's regional context (timezone, locale) and confirming `DateService.format()` returns the correct local string (e.g., "١٥ مارس ٢٠٢٥" for a user with `Africa/Cairo` timezone and `ar` locale).

**Acceptance Scenarios**:

1. **Given** a UTC timestamp, **When** formatted for a user whose RegionalContext has `timezone: 'Africa/Cairo'` and `locale: 'ar-EG'`, **Then** it displays in Cairo timezone with Arabic month names.
2. **Given** a financial amount, **When** formatted for a user whose RegionalContext has `locale: 'ar-EG'` and `currencyCode: 'EGP'`, **Then** it correctly displays as "١٥٠٫٧٥ ج.م" (Rule XLII).
3. **Given** a user whose RegionalContext has `timezone: 'Asia/Riyadh'` and `locale: 'ar-SA'`, **When** a UTC timestamp is formatted, **Then** it displays in Riyadh timezone (UTC+3) with Arabic formatting appropriate for Saudi locale.

---

### User Story 2 — Cascading Geo-data Selection (Priority: P2)

As a user, I want to select my Governorate (State) and then my City from a list so that I can provide my location accurately and quickly.

**Why this priority**: Essential for localized services (delivery, clinics, etc.) and required for `GeoSelectField` (ADR-024).

**Independent Test**: Requesting states for a given country code, then requesting cities for a specific state, and verifying the results match the geo-data source.

**Acceptance Scenarios**:

1. **Given** a location request for country `'EG'`, **When** the user selects "القاهرة", **Then** the system presents a secondary list of cities specifically within the Cairo Governorate.
2. **Given** a search query, **When** I use `GeoService.searchGeo()`, **Then** it returns matching states or cities with 100% accuracy against the bundled data.
3. **Given** a location request for a country other than Egypt (e.g., `'SA'`), **When** the corresponding geo-data file exists, **Then** the system returns the correct states for that country.

---

### User Story 3 — Dynamic Per-User Regional Settings (Priority: P1)

As a user who is not in Egypt, I want my bot experience to use my own timezone, locale, and currency rather than the Egyptian defaults.

**Why this priority**: Required by FR-007 dynamic mode — the system must not be Egypt-only.

**Independent Test**: Set a user's session to `timezone: 'Asia/Riyadh'`, `locale: 'ar-SA'`, `currencyCode: 'SAR'`, then verify that `RegionalService.getContext()` returns those values and all formatting uses them.

**Acceptance Scenarios**:

1. **Given** a user with no regional settings stored, **When** `RegionalService.getContext()` is called, **Then** it returns the global defaults (Egypt/Cairo/ar-EG/EGP).
2. **Given** a user with `timezone: 'Asia/Dubai'` and `locale: 'ar-AE'` stored in their session, **When** `RegionalService.getContext()` is called, **Then** it returns those user-specific values, not the defaults.
3. **Given** `REGIONAL_MODE=static`, **When** any user calls `RegionalService.getContext()`, **Then** all users receive the global default context regardless of session data.

---

## Edge Cases

- **Missing Timezone**: If the user's timezone is unknown or not set, fall back to the `DEFAULT_COUNTRY` timezone (`Africa/Cairo`). This is governed by Rule XLII.
- **Daylight Saving Time (DST)**: `dayjs` with the timezone plugin handles DST transitions automatically. No manual DST logic is needed.
- **Currency Fluctuations**: This engine handles formatting only (e.g., "١٥٠٫٧٥ ج.م"). Exchange rates, conversion, and real-time pricing are outside scope — they belong to a separate module if ever needed.
- **Unsupported Country Code**: If `GeoService.getStates()` is called with a country code for which no geo-data file exists, it returns `Result.ok([])` (empty array), not an error. The caller decides how to handle missing data.
- **Invalid Locale String**: If an invalid locale is passed to `Intl.NumberFormat` or `dayjs.locale()`, the service catches the error and returns `Result.err(AppError)` with code `'regional.invalid_locale'`.
- **Empty Geo-data File**: If a geo-data JSON file exists but is empty or malformed, `GeoService` returns `Result.err(AppError)` with code `'regional.geo_data_corrupt'`.
- **Static Mode Override**: When `REGIONAL_MODE=static`, `RegionalService.getContext()` ignores all session-level overrides and returns the global default for every user. This is a deployment-level decision, not a per-user setting.
- **GeoSelectField with No Data**: If `GeoSelectField.buildStateMenu()` is called for a country with no geo-data, it returns `Result.ok([])` — an empty options array. The consuming input-engine decides whether to show an empty state or an error message.

## Design Decisions & Clarifications

### D1. Defaults vs Hardcoding (Rule XLII)

Egypt (`EG`), Cairo (`Africa/Cairo`), and Arabic-Egypt (`ar-EG`) are **DEFAULT values only** — used as fallback when a user has no regional settings. They are NOT hardcoded limits.

- **Static mode** (`REGIONAL_MODE=static`): All users share the global default context. The global default is configured via environment variables (`DEFAULT_COUNTRY`, etc.) and defaults to Egypt.
- **Dynamic mode** (`REGIONAL_MODE=dynamic`): Each user has their own `RegionalContext` resolved from their session. If the session has no regional data, the global default is used as fallback.

The system is designed to support **any country, timezone, and locale** that the underlying libraries support (`dayjs` timezones, `Intl` locales, bundled geo-data). Egypt is the primary market and default — not a constraint.

### D2. GeoSelectField Boundary

`regional-engine` does **NOT** import grammY or any Telegram-specific library. The dependency direction is:

```
input-engine → regional-engine (input-engine depends on regional-engine)
```

`GeoSelectField` returns a plain data structure:

```typescript
interface GeoOption {
  label: string; // Display text (e.g., Arabic name of governorate)
  value: string; // Unique identifier (e.g., state code)
  i18nKey?: string; // Translation key (e.g., 'geo.EG.states.CAI') — optional for backward compat
}
```

The `buildStateMenu()` and `buildCityMenu()` methods return `Result<GeoOption[], AppError>`. The consuming `input-engine` is responsible for rendering these options as Telegram inline keyboards or any other UI format.

### D3. Result Pattern (Rule XXI)

All public service methods that can fail MUST return `Result<T, AppError>` (via `neverthrow 8.2.0`). No thrown exceptions in public APIs. `AppError` is imported from `@tempot/shared`.

Methods that are pure transformations and cannot fail (e.g., `DateService.format()` with known-valid inputs) still return `Result<string, AppError>` to maintain a consistent API surface. If `dayjs` or `Intl` throws internally, the error is caught and wrapped in `AppError`.

### D4. Type Safety (Rule I)

No `any` types anywhere. All geo-data structures have explicit TypeScript interfaces:

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

interface RegionalContext {
  timezone: string;
  locale: string;
  currencyCode: string;
  countryCode: string;
}
```

### D5. Package Boundary and Dependencies

`@tempot/regional-engine` depends on:

- `dayjs` (with `utc`, `timezone`, `localizedFormat` plugins) — date/time
- `neverthrow` 8.2.0 — Result pattern
- `@tempot/shared` — `AppError`, `AsyncResult` types
- `@tempot/session-manager` — `sessionContext` for per-user context resolution

`@tempot/regional-engine` does **NOT** depend on:

- `grammy` or any Telegram library
- `@tempot/database` (geo-data is bundled JSON, not DB queries)
- `ioredis` or `cache-manager` (caching is a future concern, not in scope for this package)

### D6. Architecture Alignment (Section 11.3)

The architecture spec (Section 11.3) names the facade `RegionalEngine` with three sub-components: `timezone/`, `formatter/`, `geo/`. This implementation maps as follows:

| Arch Spec Component       | Implementation                                                  |
| ------------------------- | --------------------------------------------------------------- |
| `RegionalEngine` (facade) | `RegionalService` — resolves context, delegates to sub-services |
| `timezone/`               | `DateService` — date/time formatting and conversion             |
| `formatter/`              | `FormatService` — currency, number, and percent formatting      |
| `geo/`                    | `GeoService` — geographic data retrieval and search             |
| `GeoSelectField`          | `GeoSelectField` — returns `GeoOption[]` for input-engine       |

The barrel export (`src/index.ts`) re-exports the `RegionalService` as `RegionalEngine` for consumers who expect the arch spec name.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use `dayjs` with `utc` and `timezone` plugins for all date/time logic.
- **FR-002**: System MUST store all dates in PostgreSQL as UTC. This package handles display conversion only — local dates are never stored.
- **FR-003**: System MUST use the built-in `Intl` API for currency and number formatting (no extra libraries).
- **FR-004**: System MUST default to Egypt (`EG`) as the default country, `Africa/Cairo` as the default timezone, `ar-EG` as the default locale, and `EGP` as the default currency. These are fallback values, not hardcoded limits.
- **FR-005**: System MUST use the `countries-states-cities-database` for pre-populated geo-data (ADR-024). Data is bundled as JSON files per country code (e.g., `data/geo/EG.json`).
- **FR-006**: System MUST provide a `GeoSelectField` that returns `Result<GeoOption[], AppError>` for the Dynamic Input Engine. `GeoSelectField` does NOT import grammY.
- **FR-007**: System MUST support two regional modes:
  - **Static** (`REGIONAL_MODE=static`): All users share the global default context. Session-level overrides are ignored.
  - **Dynamic** (`REGIONAL_MODE=dynamic`): Each user's `RegionalContext` is resolved from their session via `@tempot/session-manager`. If the session has no regional data, the global default is used as fallback.
- **FR-008**: All public service methods MUST return `Result<T, AppError>` via neverthrow 8.2.0 (Rule XXI). No thrown exceptions.
- **FR-009**: No `any` types anywhere in the package (Rule I). All data structures have explicit TypeScript interfaces.
- **FR-010**: System MUST support a `TEMPOT_REGIONAL_ENGINE` environment variable (`true`/`false`, default `true`) to enable/disable the regional-engine package per Constitution Rule XVI (Pluggable Architecture). When disabled, `RegionalService` returns `DEFAULT_REGIONAL_CONTEXT` values for all queries, and geo-data loading is skipped.

### Non-Functional Requirements

- **NFR-001**: Timezone conversion and formatting must complete in < 5ms per call.
- **NFR-002**: Geo-data retrieval for states/cities must complete in < 50ms from bundled JSON.
- **NFR-003**: The package must have zero runtime dependencies on grammY, `@tempot/database`, or any Telegram-specific library.
- **NFR-004**: Rule XVII (Graceful Shutdown) exemption: regional-engine holds no connections, timers, or open handles. Geo-data is read synchronously from bundled JSON at startup. No shutdown hook is required.

### Key Entities

- **RegionalContext**: `{ timezone: string; locale: string; currencyCode: string; countryCode: string }` — resolved per-user in dynamic mode, global in static mode.
- **GeoState**: `{ id: string; code: string; name: string; name_ar: string; i18nKey: string; countryCode: string }`
- **GeoCity**: `{ id: string; stateId: string; name: string; name_ar: string; i18nKey: string }`
- **GeoOption**: `{ label: string; value: string; i18nKey?: string }` — plain data structure for UI rendering, with optional i18n translation key.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Timezone conversion and formatting takes < 5ms (NFR-001).
- **SC-002**: Geo-data retrieval for states/cities takes < 50ms from bundled JSON (NFR-002).
- **SC-003**: 100% of user-facing dates are localized via `RegionalEngine` / `RegionalService` (Rule XLII).
- **SC-004**: System successfully handles cascading selection for all 27 Egyptian Governorates and their cities.
- **SC-005**: All public methods return `Result<T, AppError>` — zero thrown exceptions in public APIs.
- **SC-006**: Zero `any` types in the entire package.
- **SC-007**: Package has zero imports from `grammy` or any Telegram-specific library.
- **SC-008**: Dynamic mode correctly resolves per-user context from session; static mode returns global defaults for all users.
