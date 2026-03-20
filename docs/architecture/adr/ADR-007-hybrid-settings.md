# ADR-007: Hybrid Settings Approach

**Date:** 2026-03-19
**Status:** Accepted

## Context

Some settings (BOT_TOKEN, DATABASE_URL) must be fixed at startup and require a restart to change. Other settings (join mode, maintenance mode, default language) should be changeable at runtime from the Dashboard without a restart.

## Decision

Use a **hybrid approach**: sensitive/structural settings in `.env`, operational settings in PostgreSQL with a cache-manager cache (5-minute TTL, immediate invalidation on update).

## Consequences

- Runtime-configurable settings do not require bot restarts
- Sensitive secrets never stored in the database
- cache-manager provides < 2ms reads for settings (Constitution Rule XIX)
- SUPER_ADMIN can change operational settings from the Dashboard instantly

## Alternatives Rejected

**All settings in .env:** No runtime configurability. Every settings change requires a deployment.

**All settings in DB:** Secrets (BOT_TOKEN, API keys) would be stored in the database, increasing the attack surface.
