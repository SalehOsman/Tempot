# Research: Authorization Correction

## Decision 1: Separate Authentication Context From Authorization Decisions

**Decision**: Global middleware authenticates the actor, resolves enabled
status and role, builds the production ability, and attaches the context.
Action/subject authorization occurs at the handler or use-case boundary.

**Rationale**: A global `manage all` decision cannot represent heterogeneous
module actions. This separation preserves one security chain while allowing
each business operation to enforce its actual policy.

**Alternatives considered**:

- **Retain `manage all` and grant it to more roles**: Rejected because it
  destroys role separation and over-privileges normal users.
- **Remove authorization from middleware and handlers entirely**: Rejected
  because it would create an under-protected system.
- **Create one generic `use bot` permission**: Rejected because it would still
  not protect resource-specific operations.

## Decision 2: Preserve Defense in Depth

**Decision**: Handler/use-case authorization is the primary operation decision;
repository authorization remains a second boundary for protected persistence.

**Rationale**: Handler checks provide correct user behavior and early denial.
Repository checks protect data mutations if a caller bypasses an interface.

**Alternatives considered**:

- **Repository-only checks**: Rejected because denial occurs too late and does
  not cover non-database actions.
- **Handler-only checks**: Rejected because persistence loses defense in depth.

## Decision 3: Use Production Ability Construction in Tests

**Decision**: Role-matrix tests must invoke the same ability factory used by the
runtime and may not grant synthetic `manage all` to USER or ADMIN.

**Rationale**: The existing middleware test passes because its fixture does not
represent production policy.

**Alternatives considered**:

- **Continue using isolated mock abilities**: Rejected for integration/role
  coverage; mocks remain acceptable only for guard unit mechanics.

## Decision 4: Explicitly Classify Public Entry Points

**Decision**: Commands or callbacks that can run without a persisted enabled
user require an explicit public/bootstrap classification.

**Rationale**: Removing the global administrative decision must not make
unclassified behavior public by omission.

**Alternatives considered**:

- **Assume `/start` and help paths are public**: Rejected because policy must be
  reviewable and testable.

## Decision 5: Deny on Authorization Infrastructure Failure

**Decision**: If actor or ability resolution fails, protected behavior is
denied with a typed error and structured evidence.

**Rationale**: Authorization failures must not become silent allow paths.

**Alternatives considered**:

- **Fail open for availability**: Rejected because protected business actions
  cannot trade authorization correctness for availability.
