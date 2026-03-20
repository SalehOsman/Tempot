# ADR-013: CASL over Custom RBAC

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot requires a 4-tier role system (GUEST, USER, ADMIN, SUPER_ADMIN) with support for Scoped Authorization (restricting module access to specific named users). v10 built a custom RBAC system from scratch.

## Decision

Use **CASL v6.x** (`@casl/ability` + `@casl/prisma`) instead of a custom RBAC implementation.

## Consequences

- 27k+ GitHub stars — battle-tested in production systems
- `@casl/prisma` adapter enables `accessibleBy(ability)` to filter Prisma queries automatically
- Supports both RBAC (role-based) and ABAC (attribute-based) — required for Scoped Authorization
- `can('manage', 'all')` provides clean SUPER_ADMIN God Mode implementation
- Each module defines its own `abilities.ts` file — permissions are co-located with the module
- Authorization enforced at BaseRepository level — impossible to bypass

## Alternatives Rejected

**Custom RBAC (v10 approach):** 500+ lines of custom code to maintain. No community testing. ABAC support would require significant additional work. Bugs affect authorization security directly.

**casbin:** More complex configuration format (policy files), less TypeScript-native than CASL.
