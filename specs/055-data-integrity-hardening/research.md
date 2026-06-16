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

## Reconciliation Baseline - 2026-06-15

### Shared Database Blast Radius

`BaseRepository` is consumed directly or through module base repositories by:

- `modules/user-management`
- `modules/template-management`
- `modules/bot-management`
- `packages/session-manager`
- `packages/storage-engine`
- `packages/database` audit repositories and transaction tests

The global Prisma soft-delete query extension affects every soft-deletable
model reached through the shared client. Changes therefore require focused
database integration tests plus user, template, bot, session, and storage
regression coverage.

### Reconciled Defect Status

- **Resolved in the foundation:** `UserService.updateNationalId()` and
  `UserService.extractFromExistingNationalId()` coordinate independent
  repository updates through `Promise.all`, permitting mixed identity state.
- **Resolved in the foundation:** Both the global Prisma extension and
  `BaseRepository.findMany()` apply
  `isDeleted: false` before caller criteria, so caller input can overwrite the
  protected scope.
- **Resolved in the completion continuation:** Bot startup reads audit and
  interaction records through repositories and writes sessions through
  `BootstrapSessionRepository`.
- **Resolved in the completion continuation:** User, template, and bot
  pagination use filtered aggregate counts for `totalCount`.

### Foundation Boundary

The pre-Spec-054 foundation implements:

- one repository call for national-ID-derived identity state;
- non-overridable normal-read soft-delete enforcement;
- adversarial regression tests and shared-consumer blast-radius checks.

Spec 054 supplied the protected audit persistence dependency. The Spec 055
completion continuation then added privileged deleted-record recovery,
repository-only startup access, governed direct-Prisma boundary checks, typed
startup adapters, and aggregate pagination.
