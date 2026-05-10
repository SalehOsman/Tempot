# ADR-010: dayjs over Luxon and Moment

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot's regional-engine requires date/time manipulation with timezone support. Multiple libraries exist: Moment.js, Luxon, dayjs, and the native Temporal API.

## Decision

Use **dayjs v1.x** with `timezone` and `utc` plugins.

## Consequences

- Minimal bundle size (~2KB core vs Moment's 67KB)
- Chainable API similar to Moment, reducing learning curve
- Plugin system keeps the core small — only load what's needed
- `dayjs.tz()` handles all timezone conversions for RegionalEngine
- All dates stored as UTC in DB; dayjs used for display conversion only (Constitution Rule XLII)

## Alternatives Rejected

**Moment.js:** Officially deprecated. Large bundle size. Mutable objects cause subtle bugs.

**Luxon:** Larger than dayjs, different API style, less community adoption.

**Native Temporal API:** Still not a portability-safe baseline for the supported Node.js 22.12+ runtime.

**date-fns:** Function-based (not chainable), larger when using timezone support.
