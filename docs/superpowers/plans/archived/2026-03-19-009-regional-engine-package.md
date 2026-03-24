# Regional Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational regional-engine package for managing localized timezones, currencies, and geographical data (Arabic/Egypt primary) as per Tempot v11 Blueprint.

**Architecture:** A unified `RegionalService` that provides utilities for date/time manipulation (via `dayjs`), currency/number formatting (via `Intl` API), and geographical data retrieval (from bundled JSON or Redis). It integrates with `session-manager` to automatically determine user-specific regional settings, and provides a UI helper for geo-selection in the Input Engine.

**Tech Stack:** TypeScript, dayjs (utc, timezone, localizedFormat plugins), Intl API, countries-states-cities-database (JSON subset), @tempot/session-manager.

---

### Task 1: Date and Time Formatting (FR-001, FR-004)

**Files:**
- Create: `packages/regional-engine/src/date.service.ts`
- Test: `packages/regional-engine/tests/unit/date-formatting.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { DateService } from '../src/date.service';

describe('DateService', () => {
  it('should format UTC date to Cairo local time in Arabic', () => {
    const service = new DateService();
    const date = new Date('2025-03-15T12:00:00Z');
    const formatted = service.format(date, 'LL', 'ar-EG', 'Africa/Cairo');
    expect(formatted).toContain('١٥ مارس ٢٠٢٥');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/regional-engine/tests/unit/date-formatting.test.ts`
Expected: FAIL (DateService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ar';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

export class DateService {
  format(date: Date | string | number, formatStr: string, locale: string = 'ar', tz: string = 'Africa/Cairo'): string {
    return dayjs(date).tz(tz).locale(locale).format(formatStr);
  }

  toUTC(date: Date | string | number, tz: string): Date {
    return dayjs.tz(date, tz).utc().toDate();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/regional-engine/tests/unit/date-formatting.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/date.service.ts
git commit -m "feat(regional): implement localized date formatting with dayjs (FR-001)"
```

---

### Task 2: Currency and Number Formatting (FR-003, Rule XLII)

**Files:**
- Create: `packages/regional-engine/src/format.service.ts`
- Test: `packages/regional-engine/tests/unit/currency-formatting.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { FormatService } from '../src/format.service';

describe('FormatService', () => {
  it('should format currency correctly for Egypt (EGP)', () => {
    const service = new FormatService();
    const formatted = service.formatCurrency(150.75, 'ar-EG', 'EGP');
    expect(formatted).toContain('١٥٠٫٧٥');
    expect(formatted).toContain('ج.م');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/regional-engine/tests/unit/currency-formatting.test.ts`
Expected: FAIL (FormatService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export class FormatService {
  formatCurrency(amount: number, locale: string = 'ar-EG', currency: string = 'EGP'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }).format(amount);
  }

  formatNumber(value: number, locale: string = 'ar-EG'): string {
    return new Intl.NumberFormat(locale).format(value);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/regional-engine/tests/unit/currency-formatting.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/format.service.ts
git commit -m "feat(regional): implement currency and number formatting via Intl API (FR-003)"
```

---

### Task 3: Geo-data Retrieval (Egypt Focus) (FR-005)

**Files:**
- Create: `packages/regional-engine/src/geo.service.ts`
- Create: `packages/regional-engine/data/egypt-geo.json`
- Test: `packages/regional-engine/tests/unit/geo-retrieval.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { GeoService } from '../src/geo.service';

describe('GeoService', () => {
  it('should return 27 governorates for Egypt', async () => {
    const service = new GeoService();
    const states = await service.getStates('EG');
    expect(states.length).toBe(27);
    expect(states[0]).toHaveProperty('name_ar');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/regional-engine/tests/unit/geo-retrieval.test.ts`
Expected: FAIL (GeoService or data missing)

- [ ] **Step 3: Write minimal implementation**

```typescript
import egyptGeo from '../data/egypt-geo.json';

export class GeoService {
  async getStates(countryCode: string = 'EG'): Promise<any[]> {
    if (countryCode !== 'EG') return [];
    return egyptGeo.states;
  }

  async getCities(stateId: string): Promise<any[]> {
    return egyptGeo.cities.filter(c => c.state_id === stateId);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/regional-engine/tests/unit/geo-retrieval.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/geo.service.ts packages/regional-engine/data/egypt-geo.json
git commit -m "feat(regional): implement geo-data retrieval for Egypt (FR-005)"
```

---

### Task 4: Unified Regional Context (FR-007)

**Files:**
- Create: `packages/regional-engine/src/regional.service.ts`
- Test: `packages/regional-engine/tests/unit/regional-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { RegionalService } from '../src/regional.service';

describe('RegionalService', () => {
  it('should use context from session-manager if available', async () => {
    // Mock session context
    const service = new RegionalService();
    const context = service.getContext();
    expect(context.timezone).toBe('Africa/Cairo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/regional-engine/tests/unit/regional-service.test.ts`
Expected: FAIL (RegionalService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { sessionContext } from '@tempot/session-manager';
import { DateService } from './date.service';
import { FormatService } from './format.service';

export class RegionalService {
  constructor(
    public date: DateService,
    public format: FormatService
  ) {}

  getContext() {
    const session = sessionContext.getStore();
    return {
      timezone: session?.timezone || 'Africa/Cairo',
      locale: session?.lang === 'ar' ? 'ar-EG' : 'en-US',
      currency: session?.currency || 'EGP',
      country: session?.country || 'EG'
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/regional-engine/tests/unit/regional-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/regional-engine/src/regional.service.ts
git commit -m "feat(regional): implement unified RegionalService with session context (FR-007)"
```

---

### Task 5: GeoSelectField UI Component (FR-006)

**Files:**
- Create: `packages/regional-engine/src/ui/geo-select.field.ts`
- Test: `packages/regional-engine/tests/unit/geo-select.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { GeoSelectField } from '../src/ui/geo-select.field';

describe('GeoSelectField', () => {
  it('should generate a menu for selecting governorates', async () => {
    // Test logic expecting an inline keyboard menu
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { InlineKeyboard } from 'grammy';
import { GeoService } from '../geo.service';

export class GeoSelectField {
  constructor(private geoService: GeoService) {}

  async buildStateMenu(countryCode: string = 'EG'): Promise<InlineKeyboard> {
    const states = await this.geoService.getStates(countryCode);
    const keyboard = new InlineKeyboard();
    // Build pagination or list...
    states.forEach(state => {
      keyboard.text(state.name_ar, `geo_state_${state.id}`).row();
    });
    return keyboard;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/regional-engine/src/ui/geo-select.field.ts
git commit -m "feat(regional): implement GeoSelectField for Input Engine integration (FR-006)"
```
