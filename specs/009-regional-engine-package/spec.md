# Feature Specification: Regional Engine (Time, Currency & Geo)

**Feature Branch**: `009-regional-engine-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional regional-engine package for managing timezones, currencies, and geographical data as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Localized Time & Formatting (Priority: P1)

As a user, I want dates and times to be displayed in my local timezone and language so that I can understand schedules and activity logs without mental conversion.

**Why this priority**: Fundamental UX requirement for localized bot experiences (Section 11.3).

**Independent Test**: Verified by setting a user's location/timezone and confirming `RegionalEngine.formatDate()` returns the correct local string (e.g., "15 مارس 2025" for Cairo).

**Acceptance Scenarios**:

1. **Given** a UTC timestamp, **When** formatted for an Egyptian user, **Then** it displays in "Africa/Cairo" timezone with Arabic month names.
2. **Given** a financial amount, **When** formatted for an Egyptian user, **Then** it correctly displays as "١٥٠.٠٠ ج.م" (Rule XLII).

---

### User Story 2 - Cascading Geo-data Selection (Priority: P2)

As a user, I want to select my Governorate (State) and then my City from a list so that I can provide my location accurately and quickly.

**Why this priority**: Essential for localized services (delivery, clinics, etc.) and required for `GeoSelectField` (ADR-024).

**Independent Test**: Requesting states, then requesting cities for a specific state, and verifying the results match the Egyptian geo-data JSON.

**Acceptance Scenarios**:

1. **Given** a location request, **When** the user selects "القاهرة", **Then** the system presents a secondary list of cities specifically within the Cairo Governorate.
2. **Given** a search query, **When** I use `searchGeo`, **Then** it returns matching governorates or cities with 100% accuracy.

---

## Edge Cases

- **Missing Timezone**: What if the user's timezone is unknown? (Answer: Fall back to `DEFAULT_COUNTRY` timezone as per Rule XLII).
- **Daylight Saving Time (DST)**: Handling automatic transitions for different countries (Answer: `dayjs` with timezone plugin handles this automatically).
- **Currency Fluctuations**: Does the engine handle real-time exchange rates? (Answer: No, it handles formatting only. Exchange rates are a separate module if needed).

## Clarifications

- **Technical Constraints**: `dayjs` with `utc` and `timezone` plugins. `Intl` API for formatting.
- **Constitution Rules**: Rule XLII (Regional Defaults: `ar-EG`, `EG`). Default timezone is `Africa/Cairo`. All dates stored as UTC.
- **Integration Points**: Used by all packages displaying dates or currency. `GeoSelectField` used by `input-engine`.
- **Edge Cases**: Missing user timezone falls back to `DEFAULT_COUNTRY`. `countries-states-cities-database` is the source of truth for geo-data. DST transitions handled by `dayjs`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `dayjs` with `utc` and `timezone` plugins for all date/time logic.
- **FR-002**: System MUST store all dates in PostgreSQL as UTC.
- **FR-003**: System MUST use the built-in `Intl` API for currency and number formatting (no extra libraries).
- **FR-004**: System MUST default to Egypt (EG) as the primary country and Cairo as the primary timezone.
- **FR-005**: System MUST use the `countries-states-cities-database` for pre-populated geo-data (ADR-024).
- **FR-006**: System MUST provide a `GeoSelectField` for the Dynamic Input Engine.
- **FR-007**: System MUST support `static` (global) and `dynamic` (per-user) regional modes.

### Key Entities

- **RegionalContext**: timezone, currencyCode, locale, countryCode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Timezone conversion and formatting must take < 5ms.
- **SC-002**: Geo-data retrieval for states/cities must be < 50ms from local JSON/Redis.
- **SC-003**: 100% of user-facing dates must be localized via `RegionalEngine` (Rule XLII).
- **SC-004**: System successfully handles cascading selection for all 27 Egyptian Governorates.
