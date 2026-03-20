# ADR-024: countries-states-cities-database for Geographic Data

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot's regional-engine needs geographic data (states/provinces and cities) for Egypt as default, with the ability to add other countries. Building this data manually means writing and maintaining JSON files for 27 Egyptian governorates and their cities.

## Decision

Use **countries-states-cities-database** (npm: `countries-states-cities-database`) as the geographic data source, generating per-country JSON files via `pnpm geo:generate {CC}`.

Library metrics: 7k+ GitHub stars, 153k+ cities, 19 languages including Arabic, actively maintained.

## Consequences

- `/data/geo/EG.json` is generated automatically — not hand-written
- Arabic city and governorate names are available out of the box
- Adding a new country requires one command: `pnpm geo:generate SA`
- Data updates come from the library via `pnpm update`
- Reduces maintenance burden for geographic data to zero

## Alternatives Rejected

**Hand-written JSON files (v10 approach):** 27 governorates × N cities, all written manually in Arabic and English. Maintenance burden when boundaries or names change. Error-prone.

**External geocoding API (Google Maps, etc.):** API costs, rate limits, network dependency, latency for every request, not suitable for offline-first architecture.
