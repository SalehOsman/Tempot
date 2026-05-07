# ADR-005: Feature-Based Module Structure

**Date:** 2026-03-19
**Status:** Accepted

## Context

Modules in Tempot can grow large. A flat file structure becomes unmanageable. Two common patterns are layer-based (all handlers together, all services together) and feature-based (each feature owns its handler, service, and tests).

## Decision

Use **Feature-Based Structure** within each module.

Each feature lives in its own directory: `features/{name}/` containing `{name}.handler.ts`, `{name}.service.ts`, `{name}.conversation.ts`, and `{name}.test.ts`.

## Consequences

- Adding a feature does not require touching files in unrelated directories
- Each feature is independently testable and deployable
- Co-location: handler, service, and tests for a feature are always adjacent
- Easier to identify blast radius of a change (Constitution Rule LIV)
- CLI Generator (`pnpm generate:feature`) creates the correct structure automatically

## Alternatives Rejected

**Layer-based structure:** `handlers/`, `services/`, `repositories/` directories. Forces developers to jump between directories for every feature change. Large projects become unwieldy.
