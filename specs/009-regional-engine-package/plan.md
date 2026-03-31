# Regional Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational regional-engine package for managing localized timezones, currencies, and geographical data as per Tempot v11 Blueprint Section 11.3.

**Architecture:** A unified `RegionalService` (exported also as `RegionalEngine` per Section 11.3) that provides utilities for date/time manipulation (via `dayjs`), currency/number formatting (via `Intl` API), and geographical data retrieval (from bundled JSON). It integrates with `session-manager` to resolve per-user regional settings in dynamic mode, and provides a `GeoSelectField` that returns plain `GeoOption[]` data for the Input Engine.

**Tech Stack:** TypeScript Strict Mode 5.9.3, dayjs (utc, timezone, localizedFormat plugins), Intl API, countries-states-cities-database (JSON subset), neverthrow 8.2.0, @tempot/shared, @tempot/session-manager.

**Design Constraints:**

- Egypt/Cairo/ar-EG are DEFAULT values only — fallback when user has no regional settings, not hardcoded limits
- The system supports any country/timezone/locale; Egypt is the primary market, not a constraint
- All public service methods return `Result<T, AppError>` via neverthrow 8.2.0 (Rule XXI)
- No `any` types anywhere (Rule I)
- No grammY imports — `GeoSelectField` returns plain `GeoOption[]` data structures

---

### Shared Type Definitions

These interfaces are used across all tasks and must be defined in `src/types.ts`:

```typescript
/** Per-user or global regional settings */
export interface RegionalContext {
  timezone: string; // e.g., 'Africa/Cairo'
  locale: string; // e.g., 'ar-EG'
  currencyCode: string; // e.g., 'EGP'
  countryCode: string; // e.g., 'EG'
}

/** A geographic state/governorate */
export interface GeoState {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  i18nKey: string; // e.g., 'geo.EG.states.CAI'
  countryCode: string;
}

/** A city within a state */
export interface GeoCity {
  id: string;
  stateId: string;
  name: string;
  name_ar: string;
  i18nKey: string; // e.g., 'geo.EG.cities.CAI.heliopolis'
}

/** Plain data structure for UI rendering — consumed by input-engine */
export interface GeoOption {
  label: string; // Display text (e.g., Arabic name)
  value: string; // Unique identifier (e.g., state code)
  i18nKey?: string; // Translation key (e.g., 'geo.EG.states.CAI') — optional for backward compat
}

/** Default regional context — Egypt as primary market (Rule XLII) */
export const DEFAULT_REGIONAL_CONTEXT: RegionalContext = {
  timezone: 'Africa/Cairo',
  locale: 'ar-EG',
  currencyCode: 'EGP',
  countryCode: 'EG',
};
```

---

### Task 0: Package Scaffolding (10-Point Checklist)

**Goal:** Create the `packages/regional-engine/` directory with all required infrastructure files, passing all 10 points of the package-creation-checklist before any feature code is written.

**Files:**

- Create: `packages/regional-engine/.gitignore`
- Create: `packages/regional-engine/tsconfig.json`
- Create: `packages/regional-engine/package.json`
- Create: `packages/regional-engine/vitest.config.ts`
- Create: `packages/regional-engine/src/index.ts` (empty barrel)
- Create: `packages/regional-engine/tests/unit/` (empty directory)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p packages/regional-engine/src packages/regional-engine/tests/unit
```

- [ ] **Step 2: Create `.gitignore`**

```
# Compiled output
dist/
src/**/*.js
src/**/*.d.ts
src/**/*.js.map
src/**/*.d.ts.map

# Dependencies
node_modules/

# Generated
*.tsbuildinfo

# Test artifacts
tests/**/*.js
tests/**/*.d.ts
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create `package.json`**

```json
{
  "name": "@tempot/regional-engine",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "dayjs": "1.11.13",
    "neverthrow": "8.2.0",
    "@tempot/shared": "workspace:*",
    "@tempot/session-manager": "workspace:*"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0",
    "countries-states-cities-database": "latest"
  }
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      }),
    ],
  },
});
```

- [ ] **Step 6: Create `src/index.ts`** (empty barrel)

```typescript
// Barrel exports — populated as services are implemented
```

- [ ] **Step 7: Run 10-point package-creation-checklist**

Verify all 10 checks from `docs/developer/package-creation-checklist.md`:

1. `.gitignore` exists with required patterns ✓
2. `tsconfig.json` has `"outDir": "dist"` ✓
3. `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"` ✓
4. `package.json` has `"exports": { ".": "./dist/index.js" }` ✓
5. `package.json` has `"build": "tsc"` ✓
6. `vitest.config.ts` exists ✓
7. `vitest` version is exact `"4.1.0"` (no caret) ✓
8. No `console.*` in `src/` ✓ (empty barrel only)
9. No phantom dependencies ✓ (no imports yet)
10. No compiled artifacts in `src/` ✓ (clean workspace)

**DO NOT proceed to Task 1 until all 10 checks pass.**

- [ ] **Step 8: Commit**

```bash
git add packages/regional-engine/
git commit -m "chore(regional): scaffold package — 10-point checklist passed"
```

---

### Task 1: Type Definitions (shared interfaces)

**Files:**

- Create: `packages/regional-engine/src/types.ts`
- Test: `packages/regional-engine/tests/unit/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_REGIONAL_CONTEXT,
  type RegionalContext,
  type GeoState,
  type GeoCity,
  type GeoOption,
} from '../../src/types';

describe('Type Definitions', () => {
  it('should export DEFAULT_REGIONAL_CONTEXT with Egypt defaults', () => {
    expect(DEFAULT_REGIONAL_CONTEXT).toEqual({
      timezone: 'Africa/Cairo',
      locale: 'ar-EG',
      currencyCode: 'EGP',
      countryCode: 'EG',
    });
  });

  it('should allow creating a non-Egypt RegionalContext', () => {
    const ctx: RegionalContext = {
      timezone: 'Asia/Riyadh',
      locale: 'ar-SA',
      currencyCode: 'SAR',
      countryCode: 'SA',
    };
    expect(ctx.timezone).toBe('Asia/Riyadh');
    expect(ctx.countryCode).toBe('SA');
  });

  it('should type GeoOption as plain label/value pair', () => {
    const option: GeoOption = { label: 'القاهرة', value: 'CAI' };
    expect(option.label).toBe('القاهرة');
    expect(option.value).toBe('CAI');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --reporter=verbose`
Expected: FAIL (types.ts not found)

- [ ] **Step 3: Write minimal implementation**

Create `src/types.ts` with the interfaces from the Shared Type Definitions section above.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/types.ts packages/regional-engine/tests/unit/types.test.ts
git commit -m "feat(regional): define shared type interfaces — RegionalContext, GeoState, GeoCity, GeoOption"
```

---

### Task 2: Date and Time Formatting (FR-001, FR-004)

**Files:**

- Create: `packages/regional-engine/src/date.service.ts`
- Test: `packages/regional-engine/tests/unit/date-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { DateService } from '../../src/date.service';

describe('DateService', () => {
  const service = new DateService();

  it('should format UTC date to Cairo local time in Arabic', () => {
    const date = new Date('2025-03-15T12:00:00Z');
    const result = service.format(date, 'LL', { locale: 'ar', tz: 'Africa/Cairo' });
    expect(result.isOk()).toBe(true);
    expect(result.value).toContain('مارس');
    expect(result.value).toContain('٢٠٢٥');
  });

  it('should format date for Riyadh timezone', () => {
    const date = new Date('2025-03-15T12:00:00Z');
    const result = service.format(date, 'LL', { locale: 'ar', tz: 'Asia/Riyadh' });
    expect(result.isOk()).toBe(true);
    expect(result.value).toContain('٢٠٢٥');
  });

  it('should convert local time to UTC', () => {
    const result = service.toUTC('2025-03-15 14:30', 'Africa/Cairo');
    expect(result.isOk()).toBe(true);
    expect(result.value).toBeInstanceOf(Date);
  });

  it('should return err for invalid timezone', () => {
    const date = new Date('2025-03-15T12:00:00Z');
    const result = service.format(date, 'LL', { locale: 'ar', tz: 'Invalid/Timezone' });
    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe('regional.invalid_timezone');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --reporter=verbose`
Expected: FAIL (DateService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ar';
import { ok, err, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

export interface DateFormatOptions {
  locale?: string;
  tz?: string;
}

export class DateService {
  format(
    date: Date | string | number,
    formatStr: string,
    options: DateFormatOptions = {},
  ): Result<string, AppError> {
    const { locale = 'ar', tz = 'Africa/Cairo' } = options;

    try {
      const result = dayjs(date).tz(tz).locale(locale).format(formatStr);
      if (!result || result === 'Invalid Date') {
        return err(new AppError('regional.invalid_timezone', `Invalid timezone: ${tz}`));
      }
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.format_failed', message));
    }
  }

  toUTC(date: Date | string | number, tz: string): Result<Date, AppError> {
    try {
      const result = dayjs.tz(date, tz).utc().toDate();
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.utc_conversion_failed', message));
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/date.service.ts packages/regional-engine/tests/unit/date-service.test.ts
git commit -m "feat(regional): implement localized date formatting with dayjs — Result pattern (FR-001)"
```

---

### Task 3: Currency and Number Formatting (FR-003, Rule XLII)

**Files:**

- Create: `packages/regional-engine/src/format.service.ts`
- Test: `packages/regional-engine/tests/unit/format-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { FormatService } from '../../src/format.service';

describe('FormatService', () => {
  const service = new FormatService();

  it('should format currency correctly for Egypt (EGP)', () => {
    const result = service.formatCurrency(150.75, 'ar-EG', 'EGP');
    expect(result.isOk()).toBe(true);
    expect(result.value).toContain('١٥٠');
    expect(result.value).toContain('ج.م');
  });

  it('should format currency for Saudi Arabia (SAR)', () => {
    const result = service.formatCurrency(150.75, 'ar-SA', 'SAR');
    expect(result.isOk()).toBe(true);
    expect(result.value).toContain('١٥٠');
    expect(result.value).toContain('ر.س');
  });

  it('should format number with locale-specific grouping', () => {
    const result = service.formatNumber(150000, 'ar-EG');
    expect(result.isOk()).toBe(true);
    expect(result.value).toContain('١٥٠');
  });

  it('should format percentage', () => {
    const result = service.formatPercent(0.75, 'ar-EG');
    expect(result.isOk()).toBe(true);
    expect(result.value).toContain('٧٥');
  });

  it('should return err for invalid locale', () => {
    const result = service.formatCurrency(100, 'invalid-locale-xyz', 'EGP');
    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe('regional.invalid_locale');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --reporter=verbose`
Expected: FAIL (FormatService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { ok, err, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export class FormatService {
  formatCurrency(
    amount: number,
    locale: string = 'ar-EG',
    currency: string = 'EGP',
  ): Result<string, AppError> {
    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
      }).format(amount);
      return ok(formatted);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }

  formatNumber(value: number, locale: string = 'ar-EG'): Result<string, AppError> {
    try {
      return ok(new Intl.NumberFormat(locale).format(value));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }

  formatPercent(value: number, locale: string = 'ar-EG'): Result<string, AppError> {
    try {
      return ok(new Intl.NumberFormat(locale, { style: 'percent' }).format(value));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/format.service.ts packages/regional-engine/tests/unit/format-service.test.ts
git commit -m "feat(regional): implement currency and number formatting via Intl API — Result pattern (FR-003)"
```

---

### Task 4: Geo-data Retrieval (FR-005, ADR-024)

**Files:**

- Create: `packages/regional-engine/src/geo.service.ts`
- Create: `packages/regional-engine/data/geo/EG.json` (subset from countries-states-cities-database)
- Test: `packages/regional-engine/tests/unit/geo-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { GeoService } from '../../src/geo.service';

describe('GeoService', () => {
  const service = new GeoService();

  it('should return 27 governorates for Egypt', () => {
    const result = service.getStates('EG');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(27);
      expect(result.value[0]).toHaveProperty('id');
      expect(result.value[0]).toHaveProperty('code');
      expect(result.value[0]).toHaveProperty('name');
      expect(result.value[0]).toHaveProperty('name_ar');
      expect(result.value[0]).toHaveProperty('countryCode');
    }
  });

  it('should return cities for a given state', () => {
    const statesResult = service.getStates('EG');
    expect(statesResult.isOk()).toBe(true);
    if (statesResult.isOk()) {
      const firstState = statesResult.value[0];
      const citiesResult = service.getCities(firstState.id);
      expect(citiesResult.isOk()).toBe(true);
      if (citiesResult.isOk()) {
        expect(citiesResult.value.length).toBeGreaterThan(0);
        expect(citiesResult.value[0]).toHaveProperty('id');
        expect(citiesResult.value[0]).toHaveProperty('stateId');
        expect(citiesResult.value[0]).toHaveProperty('name');
        expect(citiesResult.value[0]).toHaveProperty('name_ar');
      }
    }
  });

  it('should return ok with empty array for unsupported country', () => {
    const result = service.getStates('XX');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it('should search geo-data and return matching results', () => {
    const result = service.searchGeo('القاهرة', 'EG');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  it('should find a state by code', () => {
    const result = service.getStateByCode('CAI', 'EG');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
      expect(result.value?.code).toBe('CAI');
    }
  });

  it('should return ok(undefined) for unknown state code', () => {
    const result = service.getStateByCode('ZZZ', 'EG');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --reporter=verbose`
Expected: FAIL (GeoService or data missing)

- [ ] **Step 3: Prepare geo-data JSON**

Generate `data/geo/EG.json` from the `countries-states-cities-database` with the `GeoState` and `GeoCity` structure. The JSON schema:

```json
{
  "countryCode": "EG",
  "states": [
    {
      "id": "1",
      "code": "CAI",
      "name": "Cairo",
      "name_ar": "القاهرة",
      "i18nKey": "geo.EG.states.CAI",
      "countryCode": "EG"
    }
  ],
  "cities": [
    {
      "id": "100",
      "stateId": "1",
      "name": "Cairo",
      "name_ar": "القاهرة",
      "i18nKey": "geo.EG.cities.CAI.cairo"
    }
  ]
}
```

- [ ] **Step 4: Write minimal implementation**

```typescript
import { ok, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { GeoState, GeoCity } from './types';
import egGeoData from '../data/geo/EG.json';

interface GeoDataFile {
  countryCode: string;
  states: GeoState[];
  cities: GeoCity[];
}

// Static registry — add new countries here as data files are added
const GEO_REGISTRY: Record<string, GeoDataFile> = {
  EG: egGeoData as GeoDataFile,
};

export class GeoService {
  getStates(countryCode: string): Result<GeoState[], AppError> {
    const data = GEO_REGISTRY[countryCode];
    if (!data) {
      return ok([]);
    }
    return ok(data.states);
  }

  getCities(stateId: string): Result<GeoCity[], AppError> {
    for (const data of Object.values(GEO_REGISTRY)) {
      const cities = data.cities.filter((c) => c.stateId === stateId);
      if (cities.length > 0) {
        return ok(cities);
      }
    }
    return ok([]);
  }

  searchGeo(query: string, countryCode: string): Result<Array<GeoState | GeoCity>, AppError> {
    const data = GEO_REGISTRY[countryCode];
    if (!data) {
      return ok([]);
    }
    const lowerQuery = query.toLowerCase();
    const matchingStates = data.states.filter(
      (s) => s.name.toLowerCase().includes(lowerQuery) || s.name_ar.includes(query),
    );
    const matchingCities = data.cities.filter(
      (c) => c.name.toLowerCase().includes(lowerQuery) || c.name_ar.includes(query),
    );
    return ok([...matchingStates, ...matchingCities]);
  }

  getStateByCode(code: string, countryCode: string): Result<GeoState | undefined, AppError> {
    const data = GEO_REGISTRY[countryCode];
    if (!data) {
      return ok(undefined);
    }
    const state = data.states.find((s) => s.code === code);
    return ok(state);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/regional-engine/src/geo.service.ts packages/regional-engine/data/geo/EG.json packages/regional-engine/tests/unit/geo-service.test.ts
git commit -m "feat(regional): implement geo-data retrieval for Egypt — Result pattern (FR-005, ADR-024)"
```

---

### Task 5: GeoSelectField (FR-006) — Plain Data, No grammY

**Files:**

- Create: `packages/regional-engine/src/geo-select.field.ts`
- Test: `packages/regional-engine/tests/unit/geo-select-field.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { GeoSelectField } from '../../src/geo-select.field';
import { GeoService } from '../../src/geo.service';

describe('GeoSelectField', () => {
  const geoService = new GeoService();
  const field = new GeoSelectField(geoService);

  it('should build a state menu with GeoOption[] for Egypt', () => {
    const result = field.buildStateMenu('EG');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const options = result.value;
      expect(options.length).toBe(27);
      expect(options[0]).toHaveProperty('label');
      expect(options[0]).toHaveProperty('value');
      // Labels should be Arabic names
      expect(typeof options[0].label).toBe('string');
      expect(options[0].label.length).toBeGreaterThan(0);
    }
  });

  it('should build a city menu for a given state', () => {
    const statesResult = field.buildStateMenu('EG');
    expect(statesResult.isOk()).toBe(true);
    if (statesResult.isOk()) {
      const firstStateValue = statesResult.value[0].value;
      const citiesResult = field.buildCityMenu(firstStateValue);
      expect(citiesResult.isOk()).toBe(true);
      if (citiesResult.isOk()) {
        expect(citiesResult.value.length).toBeGreaterThan(0);
        expect(citiesResult.value[0]).toHaveProperty('label');
        expect(citiesResult.value[0]).toHaveProperty('value');
      }
    }
  });

  it('should return ok with empty array for unsupported country', () => {
    const result = field.buildStateMenu('XX');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --reporter=verbose`
Expected: FAIL (GeoSelectField not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { GeoOption } from './types';
import { GeoService } from './geo.service';

/**
 * Produces plain GeoOption[] data for the Input Engine.
 * Does NOT import grammY — input-engine renders these as inline keyboards.
 */
export class GeoSelectField {
  constructor(private readonly geoService: GeoService) {}

  buildStateMenu(countryCode: string): Result<GeoOption[], AppError> {
    const statesResult = this.geoService.getStates(countryCode);
    if (statesResult.isErr()) {
      return statesResult;
    }
    const options: GeoOption[] = statesResult.value.map((state) => ({
      label: state.name_ar,
      value: state.id,
    }));
    return statesResult.map(() => options);
  }

  buildCityMenu(stateId: string): Result<GeoOption[], AppError> {
    const citiesResult = this.geoService.getCities(stateId);
    if (citiesResult.isErr()) {
      return citiesResult;
    }
    const options: GeoOption[] = citiesResult.value.map((city) => ({
      label: city.name_ar,
      value: city.id,
    }));
    return citiesResult.map(() => options);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/geo-select.field.ts packages/regional-engine/tests/unit/geo-select-field.test.ts
git commit -m "feat(regional): implement GeoSelectField — plain GeoOption[] data, no grammY (FR-006)"
```

---

### Task 6: Unified Regional Service (FR-007)

**Session Field Mappings:** In dynamic mode, `RegionalService.getContext()` resolves `RegionalContext` from session-manager fields as follows:

| Session Field     | RegionalContext Field | Fallback                              |
| ----------------- | --------------------- | ------------------------------------- |
| `store.timezone`  | `timezone`            | `DEFAULT_REGIONAL_CONTEXT.timezone`   |
| `store.lang`      | `locale` (via map)    | `DEFAULT_REGIONAL_CONTEXT.locale`     |
| `store.currency`  | `currencyCode`        | `DEFAULT_REGIONAL_CONTEXT.currencyCode` |
| `store.country`   | `countryCode`         | `DEFAULT_REGIONAL_CONTEXT.countryCode`  |

The `lang` → `locale` mapping converts short language codes (e.g., `'ar'` → `'ar-EG'`, `'en'` → `'en-US'`). Unknown codes pass through unchanged.

**Files:**

- Create: `packages/regional-engine/src/regional.service.ts`
- Test: `packages/regional-engine/tests/unit/regional-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { RegionalService } from '../../src/regional.service';
import { DateService } from '../../src/date.service';
import { FormatService } from '../../src/format.service';
import { DEFAULT_REGIONAL_CONTEXT } from '../../src/types';

// Mock session-manager
vi.mock('@tempot/session-manager', () => ({
  sessionContext: {
    getStore: vi.fn(),
  },
}));

import { sessionContext } from '@tempot/session-manager';

describe('RegionalService', () => {
  const dateService = new DateService();
  const formatService = new FormatService();

  it('should return default context when no session is available (static mode)', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);
    const service = new RegionalService(dateService, formatService, 'static');
    const result = service.getContext();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(DEFAULT_REGIONAL_CONTEXT);
    }
  });

  it('should return default context in static mode even when session has data', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue({
      timezone: 'Asia/Riyadh',
      lang: 'ar',
      currency: 'SAR',
      country: 'SA',
    });
    const service = new RegionalService(dateService, formatService, 'static');
    const result = service.getContext();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(DEFAULT_REGIONAL_CONTEXT);
    }
  });

  it('should merge session data in dynamic mode', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue({
      timezone: 'Asia/Riyadh',
      lang: 'ar',
      currency: 'SAR',
      country: 'SA',
    });
    const service = new RegionalService(dateService, formatService, 'dynamic');
    const result = service.getContext();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.timezone).toBe('Asia/Riyadh');
      expect(result.value.countryCode).toBe('SA');
      expect(result.value.currencyCode).toBe('SAR');
    }
  });

  it('should fall back to defaults in dynamic mode when session has no regional data', () => {
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);
    const service = new RegionalService(dateService, formatService, 'dynamic');
    const result = service.getContext();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(DEFAULT_REGIONAL_CONTEXT);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --reporter=verbose`
Expected: FAIL (RegionalService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { ok, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { sessionContext } from '@tempot/session-manager';
import { DateService } from './date.service';
import { FormatService } from './format.service';
import type { RegionalContext } from './types';
import { DEFAULT_REGIONAL_CONTEXT } from './types';

type RegionalMode = 'static' | 'dynamic';

export class RegionalService {
  constructor(
    public readonly date: DateService,
    public readonly format: FormatService,
    private readonly mode: RegionalMode = 'static',
  ) {}

  getContext(): Result<RegionalContext, AppError> {
    if (this.mode === 'static') {
      return ok({ ...DEFAULT_REGIONAL_CONTEXT });
    }

    // Dynamic mode: resolve from session, fall back to defaults
    const store = sessionContext.getStore();
    if (!store) {
      return ok({ ...DEFAULT_REGIONAL_CONTEXT });
    }

    const context: RegionalContext = {
      timezone: (store.timezone as string | undefined) ?? DEFAULT_REGIONAL_CONTEXT.timezone,
      locale: this.resolveLocale(store.lang as string | undefined),
      currencyCode: (store.currency as string | undefined) ?? DEFAULT_REGIONAL_CONTEXT.currencyCode,
      countryCode: (store.country as string | undefined) ?? DEFAULT_REGIONAL_CONTEXT.countryCode,
    };

    return ok(context);
  }

  private resolveLocale(lang: string | undefined): string {
    if (!lang) return DEFAULT_REGIONAL_CONTEXT.locale;
    // Map language code to full locale based on common patterns
    const localeMap: Record<string, string> = {
      ar: 'ar-EG',
      en: 'en-US',
    };
    return localeMap[lang] ?? `${lang}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/regional.service.ts packages/regional-engine/tests/unit/regional-service.test.ts
git commit -m "feat(regional): implement RegionalService — static/dynamic modes with session context (FR-007)"
```

---

### Task 7: Barrel Exports (`src/index.ts`)

**Files:**

- Update: `packages/regional-engine/src/index.ts`
- Test: Existing tests continue to pass

- [ ] **Step 1: Write barrel exports**

```typescript
// Types
export type { RegionalContext, GeoState, GeoCity, GeoOption } from './types';
export { DEFAULT_REGIONAL_CONTEXT } from './types';

// Services
export { DateService } from './date.service';
export { FormatService } from './format.service';
export { GeoService } from './geo.service';
export { GeoSelectField } from './geo-select.field';
export { RegionalService } from './regional.service';

// Arch spec compatibility: Section 11.3 uses "RegionalEngine" as the facade name
export { RegionalService as RegionalEngine } from './regional.service';
```

- [ ] **Step 2: Run all tests to verify nothing breaks**

Run: `npx vitest run --reporter=verbose`
Expected: ALL PASS

- [ ] **Step 3: Run 10-point checklist one final time**

Verify all 10 checks still pass with the complete package.

- [ ] **Step 4: Commit**

```bash
git add packages/regional-engine/src/index.ts
git commit -m "feat(regional): complete barrel exports — RegionalEngine alias for arch spec compatibility"
```
