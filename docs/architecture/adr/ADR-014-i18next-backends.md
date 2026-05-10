# ADR-014: i18next Backends for CMS Engine

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot's CMS Engine needs to serve translations from two sources: static JSON files (development-time) and a PostgreSQL database (runtime overrides editable from the Dashboard). v10 built a custom resolver that duplicated i18next's backend plugin system.

## Decision

Use **i18next backend plugins** to implement a custom backend that reads from cache-manager (Redis) first, then PostgreSQL, then falls back to static JSON files.

## Consequences

- Leverages i18next's existing backend interface — no new API to learn
- The `t()` function works identically whether CMS is enabled or disabled
- Resolution chain: cache-manager → PostgreSQL → Static JSON (Constitution-defined fallback order)
- `pnpm cms:check` validates translation completeness in CI/CD
- `TEMPOT_DYNAMIC_CMS=false` disables the DB/cache layers — static JSON only

## Alternatives Rejected

**Custom resolver (v10 approach):** Reimplemented i18next's backend system from scratch. Duplicated cache logic. Two code paths for `t()` depending on CMS state.

**Contentful / Sanity (headless CMS):** External services, additional cost, not suitable for self-hosted deployments, overkill for translation overrides.
