# @tempot/regional-engine

> Timezone, currency, number formatting, and geographic data. Egypt (EG) is the default country.

## Purpose

Three components:

- **`timezone/`** — `dayjs` + timezone plugin, all date/time conversions for display
- **`formatter/`** — `Intl` API for currencies, numbers, percentages (Arabic-Indic numerals)
- **`geo/`** — provinces/states and cities from `countries-states-cities-database`

All dates stored as UTC in the database. `RegionalEngine` handles display-only conversion.

## Phase

Phase 3 — Presentation Layer

## Dependencies

| Package | Purpose |
|---------|---------|
| `dayjs` 1.x | Date/time manipulation — ADR-010 |
| `dayjs/plugin/timezone` | Timezone conversion |
| `dayjs/plugin/utc` | UTC handling |
| `countries-states-cities-database` | Geographic data — ADR-024 |

## Default Configuration

| Setting | Value |
|---------|-------|
| `DEFAULT_COUNTRY` | `EG` (Egypt) |
| Default locale | `ar-EG` |
| Default timezone | `Africa/Cairo` (UTC+2) |
| Default currency | `EGP` (ج.م) |

## API

```typescript
import { RegionalEngine } from '@tempot/regional-engine';

// Time
const now = RegionalEngine.getNow(ctx);           // Cairo time
const local = RegionalEngine.toLocalTime(utc, ctx); // UTC → local display
const formatted = RegionalEngine.formatDate(date, ctx); // "15 مارس 2026"
const time = RegionalEngine.formatTime(date, ctx);     // "2:30 م"

// Currency & numbers
const amount = RegionalEngine.formatCurrency(1500, ctx); // "١٬٥٠٠٫٠٠ ج.م"
const num = RegionalEngine.formatNumber(150000, ctx);    // "١٥٠٬٠٠٠"

// Geography (for Input Engine GeoSelectField)
const states = RegionalEngine.getStates(ctx);                  // 27 Egyptian governorates
const cities = RegionalEngine.getCities('CAI', ctx);           // Cairo's cities
const cairo = RegionalEngine.getStateByCode('CAI', ctx);       // { name: 'القاهرة', ... }
```

## Supported Countries

`EG` (default) · `SA` · `AE` · `KW` · `JO`

Add a new country: `pnpm geo:generate {ISO2_CODE}`

## ADRs

- ADR-010 — dayjs over Luxon/Moment
- ADR-024 — countries-states-cities-database

## Status

⏳ **Not yet implemented** — Phase 3
