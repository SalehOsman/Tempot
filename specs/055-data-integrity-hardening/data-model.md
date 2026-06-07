# Data Model: Data Integrity Hardening

No new business entity is required. This feature formalizes commands, scopes,
query contracts, and transaction state.

## Atomic Identity Update

**Fields**:

- `userId`
- `nationalId`
- `gender`
- `birthDate`
- `governorate`
- `actorContext`
- `expectedVersion` when existing concurrency control supports it

**Rules**:

- All fields commit or roll back together.
- Audit evidence represents one logical operation.
- Invalid derived data prevents the transaction.

## Soft-Delete Scope

**Fields**:

- `model`
- `normalReadScope`: always active records
- `recoveryScope`: explicit deleted-record access
- `actorContext`

**Rules**:

- Normal filters cannot override deletion state.
- Recovery requires a separate interface and permission.
- Models without soft delete do not receive artificial deletion filtering.

## Application Read Repository

**Operations**:

- recent audit events,
- recent interaction events,
- bootstrap session lookup/upsert.

**Rules**:

- Strict typed input/output.
- Fallible operations return Result.
- No Prisma types leak into callers.
- Pagination and ordering are explicit.

## Page Query

**Fields**:

- `filter`
- `order`
- `offset`
- `limit`
- `items`
- `total`

**Rules**:

- Page and count share one canonical filter.
- Count is a database aggregate.
- Boundary-page behavior is deterministic.

## Boundary Exception

**Fields**:

- `path`
- `purpose`
- `allowedOperation`
- `rationale`

Only database client construction, connection, migration, generation, and
shutdown infrastructure qualify.
