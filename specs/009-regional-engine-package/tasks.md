# Regional Engine — Task Breakdown

**Feature:** 009-regional-engine-package  
**Source:** spec.md (Clarified) + plan.md (Corrected)  
**Generated:** 2026-03-25

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)  
**Estimated time:** 5 min  
**FR:** None (infrastructure)

**Files to create:**

- `packages/regional-engine/.gitignore`
- `packages/regional-engine/tsconfig.json`
- `packages/regional-engine/package.json`
- `packages/regional-engine/vitest.config.ts`
- `packages/regional-engine/src/index.ts` (empty barrel)
- `packages/regional-engine/tests/unit/` (directory)

**Test file:** N/A (infrastructure only — validated by 10-point checklist)

**Acceptance criteria:**

- [ ] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [ ] `.gitignore` includes: `dist/`, `node_modules/`, `*.tsbuildinfo`, `src/**/*.js`, `src/**/*.js.map`, `src/**/*.d.ts`, `src/**/*.d.ts.map`, `tests/**/*.js`, `tests/**/*.d.ts`
- [ ] `tsconfig.json` extends `../../tsconfig.json`, has `"outDir": "dist"`, `"rootDir": "src"`
- [ ] `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"exports": { ".": "./dist/index.js" }`
- [ ] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [ ] `vitest.config.ts` matches `packages/shared/vitest.config.ts` pattern
- [ ] `src/index.ts` exists as empty barrel file
- [ ] No compiled artifacts in `src/`

---

## Task 1: Type Definitions

**Priority:** P0 (dependency for all service tasks)  
**Estimated time:** 5 min  
**FR:** FR-008 (type safety), FR-009 (no `any`)

**Files to create:**

- `packages/regional-engine/src/types.ts`

**Test file:** `packages/regional-engine/tests/unit/types.test.ts`

**Acceptance criteria:**

- [ ] `RegionalContext` interface exported: `{ timezone: string; locale: string; currencyCode: string; countryCode: string }`
- [ ] `GeoState` interface exported: `{ id: string; code: string; name: string; name_ar: string; countryCode: string }`
- [ ] `GeoCity` interface exported: `{ id: string; stateId: string; name: string; name_ar: string }`
- [ ] `GeoOption` interface exported: `{ label: string; value: string }`
- [ ] `DEFAULT_REGIONAL_CONTEXT` constant exported with Egypt defaults (Rule XLII)
- [ ] No `any` types
- [ ] All tests pass

---

## Task 2: DateService — Date and Time Formatting

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-001, FR-004  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/regional-engine/src/date.service.ts`

**Test file:** `packages/regional-engine/tests/unit/date-service.test.ts`

**Acceptance criteria:**

- [ ] `format()` method converts UTC dates to localized strings using `dayjs` with timezone plugin
- [ ] `toUTC()` method converts local time to UTC `Date` objects
- [ ] Default timezone is `'Africa/Cairo'`, default locale is `'ar'` (FR-004)
- [ ] Works with non-Egypt timezones (e.g., `'Asia/Riyadh'`)
- [ ] All methods return `Result<T, AppError>` — no thrown exceptions
- [ ] Returns `Result.err` with code `'regional.invalid_timezone'` for invalid timezone input
- [ ] No `any` types
- [ ] All tests pass

---

## Task 3: FormatService — Currency and Number Formatting

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-003  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/regional-engine/src/format.service.ts`

**Test file:** `packages/regional-engine/tests/unit/format-service.test.ts`

**Acceptance criteria:**

- [ ] `formatCurrency()` formats amounts using `Intl.NumberFormat` with currency style
- [ ] `formatNumber()` formats numbers with locale-specific grouping
- [ ] `formatPercent()` formats percentages with locale-specific formatting
- [ ] Default locale is `'ar-EG'`, default currency is `'EGP'` (Rule XLII)
- [ ] Works with non-Egypt locales and currencies (e.g., `'ar-SA'` / `'SAR'`)
- [ ] Egyptian output matches Rule XLII format: "١٥٠٫٧٥ ج.م"
- [ ] All methods return `Result<T, AppError>` — no thrown exceptions
- [ ] Returns `Result.err` with code `'regional.invalid_locale'` for invalid locale input
- [ ] Uses only built-in `Intl` API — no extra formatting libraries
- [ ] No `any` types
- [ ] All tests pass

---

## Task 4: GeoService — Geographic Data Retrieval

**Priority:** P2  
**Estimated time:** 15 min  
**FR:** FR-005, ADR-024  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/regional-engine/src/geo.service.ts`
- `packages/regional-engine/data/geo/EG.json`

**Test file:** `packages/regional-engine/tests/unit/geo-service.test.ts`

**Acceptance criteria:**

- [ ] `getStates()` returns all 27 Egyptian governorates for country code `'EG'`
- [ ] `getCities()` returns cities for a given state ID
- [ ] `getStateByCode(code: string, countryCode: string)` returns `Result<GeoState | undefined, AppError>`
- [ ] `getStateByCode()` returns `Result.ok(undefined)` when state code not found (not an error)
- [ ] `searchGeo()` searches states and cities by name (Arabic and English)
- [ ] Returns `Result.ok([])` for unsupported country codes (not an error)
- [ ] Geo-data sourced from `countries-states-cities-database` (ADR-024)
- [ ] `GeoState` and `GeoCity` interfaces used (with `i18nKey`) — no `any` types
- [ ] All methods return `Result<T, AppError>` — no thrown exceptions
- [ ] Data retrieval completes in < 50ms from bundled JSON (SC-002)
- [ ] All tests pass

---

## Task 5: GeoSelectField — Plain Data for Input Engine

**Priority:** P2  
**Estimated time:** 10 min  
**FR:** FR-006  
**Dependencies:** Task 4

**Files to create:**

- `packages/regional-engine/src/geo-select.field.ts`

**Test file:** `packages/regional-engine/tests/unit/geo-select-field.test.ts`

**Acceptance criteria:**

- [ ] `buildStateMenu()` returns `Result<GeoOption[], AppError>` — array of `{ label, value }` pairs
- [ ] `buildCityMenu()` returns `Result<GeoOption[], AppError>` for cities within a state
- [ ] Returns 27 options for Egypt's governorates (SC-004)
- [ ] Returns `Result.ok([])` for unsupported country codes
- [ ] **Zero imports from `grammy`** — no Telegram-specific dependencies (SC-007)
- [ ] Labels use Arabic names (`name_ar`) for display
- [ ] Consumes `GeoService` via constructor injection
- [ ] No `any` types
- [ ] All tests pass with real assertions (minimum: check length, check properties, check types)

---

## Task 6: RegionalService — Unified Context Resolution

**Priority:** P1  
**Estimated time:** 15 min  
**FR:** FR-007  
**Dependencies:** Task 2, Task 3

**Files to create:**

- `packages/regional-engine/src/regional.service.ts`

**Test file:** `packages/regional-engine/tests/unit/regional-service.test.ts`

**Acceptance criteria:**

- [ ] `getContext()` returns `Result<RegionalContext, AppError>`
- [ ] **Static mode**: returns global defaults for all users regardless of session data
- [ ] **Dynamic mode**: resolves per-user context from `@tempot/session-manager`'s `sessionContext.getStore()`
- [ ] **Dynamic mode fallback**: returns global defaults when session has no regional data
- [ ] Defaults are Egypt/Cairo/ar-EG/EGP — NOT hardcoded as the only option (FR-004, Design Decision D1)
- [ ] Composes `DateService` and `FormatService` as public readonly properties
- [ ] No `any` types
- [ ] All tests pass (minimum 4 tests: static default, static with session, dynamic with session, dynamic fallback)

---

## Task 7: Barrel Exports (`src/index.ts`)

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** All (final integration)  
**Dependencies:** Task 1, 2, 3, 4, 5, 6

**Files to update:**

- `packages/regional-engine/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [ ] Exports all types: `RegionalContext`, `GeoState`, `GeoCity`, `GeoOption`
- [ ] Exports `DEFAULT_REGIONAL_CONTEXT` constant
- [ ] Exports all services: `DateService`, `FormatService`, `GeoService`, `GeoSelectField`, `RegionalService`
- [ ] Exports `RegionalService` aliased as `RegionalEngine` (Section 11.3 compatibility)
- [ ] All existing tests still pass after barrel update
- [ ] 10-point package-creation-checklist passes final verification
- [ ] No `any` types in any file across the package
- [ ] No `grammy` imports in any file across the package

---

## Task Dependency Graph

```
Task 0 (scaffolding)
  └─→ Task 1 (types)
        ├─→ Task 2 (DateService)    ─┐
        ├─→ Task 3 (FormatService)  ─┤─→ Task 6 (RegionalService)  ─┐
        └─→ Task 4 (GeoService)     ─┤                               ├─→ Task 7 (barrel exports)
                                      └─→ Task 5 (GeoSelectField)   ─┘
```

## Summary

| Task      | Name                | Priority | Est. Time  | FR Coverage     |
| --------- | ------------------- | -------- | ---------- | --------------- |
| 0         | Package Scaffolding | P0       | 5 min      | Infrastructure  |
| 1         | Type Definitions    | P0       | 5 min      | FR-008, FR-009  |
| 2         | DateService         | P1       | 10 min     | FR-001, FR-004  |
| 3         | FormatService       | P1       | 10 min     | FR-003          |
| 4         | GeoService          | P2       | 15 min     | FR-005, ADR-024 |
| 5         | GeoSelectField      | P2       | 10 min     | FR-006          |
| 6         | RegionalService     | P1       | 15 min     | FR-007          |
| 7         | Barrel Exports      | P1       | 5 min      | All             |
| **Total** |                     |          | **75 min** |                 |
