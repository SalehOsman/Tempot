# Data Model: Authorization Correction

No persistent schema change is planned. The feature formalizes runtime and
review contracts.

## Actor Context

Represents the authenticated application actor for one Telegram update.

**Fields**:

- `telegramUserId`: Telegram identity when present.
- `applicationUserId`: Persisted user identity when resolved.
- `role`: GUEST, USER, ADMIN, or SUPER_ADMIN.
- `enabledStatus`: ACTIVE, BANNED, PENDING, or UNRESOLVED.
- `ability`: Production CASL ability for the actor.
- `traceId`: Interaction trace reference.

**Rules**:

- SUPER_ADMIN is assigned only through secure bootstrap rules.
- Missing or disabled actors cannot execute protected behavior.
- Normal update decisions use the attached context.
- Deferred mutation decisions replace stale actor and ability values with a
  freshly resolved context before commit.

## Entry-Point Policy

Represents the authorization contract for an active interface entry point.

**Fields**:

- `entryPointId`: Stable command, callback, or conversation action identifier.
- `moduleName`: Owning application or module.
- `classification`: Public, bootstrap, authenticated, or protected.
- `action`: CASL action.
- `subject`: CASL subject.
- `enforcementOwner`: Middleware, handler, service, or repository.
- `allowedRoles`: Expected production roles.
- `deniedRoles`: Expected denied roles.

**Rules**:

- Protected entries require action, subject, and enforcement owner.
- Public/bootstrap entries require explicit classification.
- Every active entry in scope maps to tests.

## Authorization Decision

Represents one evaluated policy decision.

**Fields**:

- `actorId`: Resolved actor reference.
- `role`: Effective role.
- `action`: Requested action.
- `subject`: Requested subject.
- `moduleName`: Owning module.
- `outcome`: Allowed, denied, or error.
- `reasonCode`: Structured reason.
- `traceId`: Interaction reference.

**Rules**:

- Denied/error outcomes occur before protected mutation.
- Evidence excludes secrets and protected personal data.
- User-facing response is resolved from i18n.

## Authorization Coverage Matrix

Represents review and test coverage.

**Fields**:

- `entryPointId`
- `classification`
- `action`
- `subject`
- `allowedRoleCases`
- `deniedRoleCases`
- `testReferences`
- `mutationAssertion`

**Rules**:

- Every protected entry has an allowed case and a denied case where feasible.
- Every denied state-changing case asserts zero mutation.
