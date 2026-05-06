# Contract: Search Engine Package

## Public Capability

The package exposes typed functions or services that:

- validate search requests,
- build relational search plans,
- build semantic search plans through injected adapters,
- save and restore search state snapshots,
- return typed result metadata.

## Boundary Rules

- The package does not own Prisma client execution.
- The package does not call AI providers directly.
- The package does not render hardcoded user-facing text.
- Callers provide repository, cache, and semantic adapters.

## Error Contract

Fallible APIs return Result values with `AppError` for:

- invalid field,
- invalid operator,
- invalid filter value,
- missing semantic query,
- missing or expired state.
