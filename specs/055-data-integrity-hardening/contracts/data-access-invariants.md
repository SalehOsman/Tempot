# Contract: Data Access Invariants

## Atomic Update Contract

- Related identity fields are persisted in one repository transaction.
- Any failure rolls back all fields and audit state.
- Services call one domain repository operation.

## Normal Read Contract

- Deleted rows are excluded after caller filters are applied.
- Normal filter types do not expose `isDeleted`, `deletedAt`, or `deletedBy` as
  scope controls.
- Recovery behavior is not reachable through normal methods.

## Recovery Contract

- Uses a separately named repository/interface.
- Requires explicit authorization.
- Emits an audit event.
- Never becomes a generic flag on normal reads.

## Application Repository Contract

- Apps, services, and handlers consume repository interfaces.
- Prisma clients/types remain inside database infrastructure and repository
  implementations.
- Public fallible operations return `Result<T, AppError>`.

## Pagination Contract

- Page retrieval and count use equivalent filters.
- Count uses a database aggregate.
- No all-row entity query is permitted solely to compute totals.
