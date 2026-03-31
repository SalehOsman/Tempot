# Data Model: Regional Engine

## Entities

### `RegionalContext`

Per-user or global regional settings resolved at request time. This is the core runtime entity — all services consume it.

**Storage:** In-memory only (resolved from session or defaults). No database persistence.

| Field          | Type     | Description                     | Constraints / Validation                                               |
| -------------- | -------- | ------------------------------- | ---------------------------------------------------------------------- |
| `timezone`     | `string` | IANA timezone identifier        | Required, Default: `Africa/Cairo`, validated via `Intl.DateTimeFormat` |
| `locale`       | `string` | BCP 47 locale tag               | Required, Default: `ar-EG`, validated via `Intl.DateTimeFormat`        |
| `currencyCode` | `string` | ISO 4217 currency code          | Required, Default: `EGP`                                               |
| `countryCode`  | `string` | ISO 3166-1 alpha-2 country code | Required, Default: `EG`                                                |

**Default Constant:** `DEFAULT_REGIONAL_CONTEXT = { timezone: 'Africa/Cairo', locale: 'ar-EG', currencyCode: 'EGP', countryCode: 'EG' }` (Rule XLII — Egypt defaults).

---

### `GeoState`

Represents a geographic state or governorate within a country. Loaded from bundled JSON data files.

**Storage:** Static JSON in `data/geo/{CC}.json`. Lazy-loaded via `readFileSync` and cached in module-level `GEO_REGISTRY`.

| Field         | Type     | Description                                   | Constraints / Validation        |
| ------------- | -------- | --------------------------------------------- | ------------------------------- |
| `id`          | `string` | Sequential identifier (e.g., `'1'` to `'27'`) | Required, Unique within country |
| `code`        | `string` | ISO 3166-2 sub-code (e.g., `'C'` for Cairo)   | Required                        |
| `name`        | `string` | English name                                  | Required                        |
| `name_ar`     | `string` | Arabic name (curated in generator script)     | Required                        |
| `i18nKey`     | `string` | Translation key: `geo.{CC}.states.{code}`     | Required                        |
| `countryCode` | `string` | ISO 3166-1 alpha-2 parent country             | Required                        |

---

### `GeoCity`

Represents a city within a state. Linked to `GeoState` via `stateId`.

**Storage:** Same JSON file as `GeoState`, under the `cities` array.

| Field     | Type     | Description                                                 | Constraints / Validation |
| --------- | -------- | ----------------------------------------------------------- | ------------------------ |
| `id`      | `string` | Sequential identifier across all cities                     | Required                 |
| `stateId` | `string` | Foreign key → `GeoState.id`                                 | Required                 |
| `name`    | `string` | English name                                                | Required                 |
| `name_ar` | `string` | Arabic name (falls back to English — upstream lacks Arabic) | Required                 |
| `i18nKey` | `string` | Translation key: `geo.{CC}.cities.{stateCode}.{slug}`       | Required                 |

---

### `GeoOption`

Derived UI structure consumed by `input-engine` for menus. Ephemeral — not persisted.

| Field     | Type      | Description                          | Constraints / Validation |
| --------- | --------- | ------------------------------------ | ------------------------ |
| `label`   | `string`  | Display text (from `name_ar`)        | Required                 |
| `value`   | `string`  | Identifier (from entity `id`)        | Required                 |
| `i18nKey` | `string?` | Translation key (from source entity) | Optional                 |

## Relationships

```
Country (EG)
  └── 1:N → GeoState (27 states)
                └── 1:N → GeoCity (140 cities for EG)
```

- `GeoCity.stateId` references `GeoState.id` (logical FK within JSON data).
- `GeoState.countryCode` references the country data file (`data/geo/{CC}.json`).

## Storage Mechanisms

- **No database tables.** This package has zero Prisma schema or database models.
- **Bundled JSON:** Static data files generated at build time by `scripts/generate-geo-data.ts` from the `country-state-city` npm package (dev dependency only).
- **In-memory cache:** `GEO_REGISTRY: Record<string, GeoDataFile | typeof CORRUPT_SENTINEL>` — loaded once per country code via `ensureLoaded()`, never evicted.
- **Session context:** `RegionalContext` resolved from `@tempot/session-manager`'s `AsyncLocalStorage` in dynamic mode, or from `DEFAULT_REGIONAL_CONTEXT` in static mode.

## Data File Schema

Each `data/geo/{CC}.json` file conforms to the `GeoDataFile` internal type:

```typescript
interface GeoDataFile {
  countryCode: string;
  states: GeoState[];
  cities: GeoCity[];
}
```

Currently bundled: **Egypt only** — 27 states, 140 cities, 1203 lines.

## Data Flow

```
Session Middleware (upstream)
  └─ writes to sessionContext (AsyncLocalStorage)
       └─ RegionalService.getContext() reads from it
            └─ Returns RegionalContext
                 ├─ DateService.format(date, format, { locale, tz })
                 └─ FormatService.formatCurrency(amount, locale, currency)

Bundled JSON (data/geo/EG.json)
  └─ GeoService.ensureLoaded('EG') reads via readFileSync
       └─ Cached in GEO_REGISTRY
            ├─ GeoService.getStates('EG')     → GeoState[]
            ├─ GeoService.getCities(stateId)  → GeoCity[]
            └─ GeoSelectField.buildStateMenu() → GeoOption[]
```
