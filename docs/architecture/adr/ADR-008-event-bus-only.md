# ADR-008: Event Bus as the Only Inter-Module Communication Channel

**Date:** 2026-03-19
**Status:** Accepted

## Context

Modules in Tempot must remain loosely coupled. Direct imports between modules create hidden dependencies, make testing harder, and violate Clean Architecture principles.

## Decision

All inter-module communication happens **exclusively via the Event Bus** using the `{module}.{entity}.{action}` naming convention. No direct function calls or imports between modules.

## Consequences

- Modules can be enabled/disabled without breaking others (Pluggable Architecture)
- Each module is independently testable with mocked events
- Event contracts are explicit and documented
- Adding a new listener to an existing event requires no changes to the emitting module
- Three levels: Local (same module), Internal (cross-module), External (Redis Pub/Sub for scaling)

## Alternatives Rejected

**Direct imports:** Creates tight coupling. Disabling one module breaks imports in other modules. Violates the Pluggable Architecture requirement.

**Shared service registry:** Adds a central dependency point, essentially the same coupling problem as direct imports.
