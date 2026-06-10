# Research: Data Integrity Hardening

## Decision 1: One Domain Transaction for Derived Identity Fields

**Decision**: Add one user-repository operation that updates all
national-ID-derived fields and associated audit metadata in one Prisma
transaction.

**Rationale**: Service-level `Promise.all` coordinates independent transactions
and cannot roll back successful siblings.

**Alternatives considered**:

- **Sequential repository calls**: Rejected because partial completion remains
  possible.
- **Compensating writes**: Rejected because they add failure modes and mask the
  missing transaction.

## Decision 2: Remove Soft-Delete Control From Normal Filters

**Decision**: Normal repository types exclude deletion-state control, and the
authoritative query policy writes the enforced scope after caller filters.

**Rationale**: Type exclusion prevents accidental use; final policy application
prevents runtime object-spread override.

**Alternatives considered**:

- **Change merge order only**: Useful quick fix but insufficient as a public
  contract.
- **Permit `isDeleted` with documentation**: Rejected because normal callers do
  not own the invariant.

## Decision 3: Explicit Recovery Repository

**Decision**: Privileged deleted-record reads use a separately named interface
with authorization and audit requirements.

**Rationale**: Recovery is legitimate but must not weaken normal repository
semantics.

## Decision 4: Purpose-Specific Application Repositories

**Decision**: Add explicit query repositories for audit history, interaction
events, and bootstrap sessions instead of adapting all tables to one generic
soft-delete base.

**Rationale**: These models have different lifecycle and deletion semantics.
Forcing them into an incompatible base creates casts and policy confusion.

## Decision 5: Database Count Aggregates

**Decision**: Page repositories execute a page query and a filtered count
aggregate using one shared filter builder.

**Rationale**: This preserves filter parity and avoids loading complete entity
sets.

**Alternatives considered**:

- **Use page length as total**: Rejected because it is wrong beyond one page.
- **Cache totals immediately**: Rejected as premature; correct aggregate queries
  come first.

## Decision 6: Extend the Boundary Audit

**Decision**: Add governed-layer Prisma restrictions to the existing boundary
audit, with narrow documented exceptions for low-level database boot and
migrations.

**Rationale**: Manual review did not prevent current composition-layer bypasses.
