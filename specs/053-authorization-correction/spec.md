# Feature Specification: Authorization Correction

**Feature Branch**: `codex/053-authorization-correction`  
**Created**: 2026-06-07  
**Status**: Implemented - Merge Blocked by Spec 056 Baseline
**Input**: Project audit finding that global bot middleware requires `manage all` for every update, preventing legitimate non-super-admin roles from reaching module authorization.

## Clarifications

### Session 2026-06-07

- Q: Should the correction preserve CASL and module-owned ability declarations? -> A: Yes; correct enforcement placement without replacing the approved authorization stack.
- Q: Where should authentication and authorization responsibilities live? -> A: Global middleware establishes actor context; handlers and use cases enforce action and subject permissions.
- Q: Is a temporary broad allow rule acceptable? -> A: No; every protected action must remain explicitly authorized.

## User Scenarios & Testing

### User Story 1 - Legitimate Users Reach Authorized Features (Priority: P1)

A valid enabled user can send a command or callback and reach a module feature
when the user's production ability permits the requested action.

**Why this priority**: The current global `manage all` requirement blocks the
primary product journey for all normal roles.

**Independent Test**: Build abilities with the production ability factory for
GUEST, USER, ADMIN, and SUPER_ADMIN, send representative updates, and confirm
each role reaches only the actions it is permitted to use.

**Acceptance Scenarios**:

1. **Given** an enabled USER with permission to read a profile, **When** the user invokes the profile flow, **Then** global middleware establishes the actor context and the profile handler permits the action.
2. **Given** an ADMIN with a module-management permission, **When** the admin invokes the corresponding action, **Then** the module authorizes it without requiring `manage all`.
3. **Given** a GUEST without permission for a protected action, **When** the guest invokes it, **Then** the action is denied with the standard localized response and audit evidence.

---

### User Story 2 - Protected Actions Remain Denied (Priority: P1)

An unauthorized, disabled, or unidentified actor cannot reach protected
business behavior even after the incorrect global administrative check is
removed.

**Why this priority**: Correcting over-restriction must not create an
under-restriction vulnerability.

**Independent Test**: Attempt protected commands and callbacks with missing,
disabled, stale, and insufficient actor contexts and confirm denial occurs
before state mutation.

**Acceptance Scenarios**:

1. **Given** an update without a usable actor identity, **When** it reaches the security chain, **Then** protected handlers do not execute.
2. **Given** a disabled USER, **When** the user invokes an otherwise allowed action, **Then** the request is denied and no repository mutation occurs.
3. **Given** a USER attempting an ADMIN-only action, **When** the handler evaluates the action and subject, **Then** authorization fails and the denial is auditable.

---

### User Story 3 - Authorization Policy Is Reviewable and Regression-Safe (Priority: P2)

A maintainer can inspect a role/action/subject matrix and automated tests that
prove every active Telegram entry point has an explicit authorization owner.

**Why this priority**: A corrected middleware can regress unless policy
ownership and coverage become executable project rules.

**Independent Test**: Compare active command/callback registrations with the
authorization matrix and confirm every protected entry point has an
authentication requirement, an authorization owner, and role tests.

**Acceptance Scenarios**:

1. **Given** an active command or callback, **When** authorization coverage is reviewed, **Then** its action, subject, owning boundary, and allowed roles are documented.
2. **Given** a new protected entry point without an authorization decision, **When** CI runs, **Then** the required authorization coverage check fails.
3. **Given** a denied action, **When** logs and audit records are inspected, **Then** they identify the actor, action, subject, module, and denial reason without sensitive payload leakage.

### Edge Cases

- Telegram updates that do not contain a user identity.
- Callback queries from messages created before a role or module change.
- A super-admin ID whose database user has not completed bootstrap.
- A user whose role changes while an update is in flight.
- Public or bootstrap commands that intentionally permit a guest.
- A disabled module whose callbacks remain in old Telegram messages.
- A handler that performs multiple operations requiring different permissions.
- Repository authorization and handler authorization disagree.
- Authorization infrastructure is temporarily unavailable.

## Requirements

### Functional Requirements

- **FR-001**: Global bot middleware MUST authenticate the actor and attach the production authorization context without requiring an administrative action for every update.
- **FR-002**: `manage all` MUST remain exclusive to SUPER_ADMIN unless a separately approved specification changes the role model.
- **FR-003**: Every protected command, callback, conversation action, and state-changing use case MUST declare an action and subject authorization decision.
- **FR-004**: Authorization MUST be enforced before protected business logic or repository mutation begins.
- **FR-005**: Disabled and unidentified actors MUST be denied protected behavior.
- **FR-006**: Public and bootstrap entry points MUST be explicitly classified; they MUST NOT become public by omission.
- **FR-007**: Authorization denials MUST use localized user-facing content and structured developer-facing evidence.
- **FR-008**: Authorization denial evidence MUST identify actor, role, action, subject, module, and outcome without recording secrets or protected personal data.
- **FR-009**: Production ability construction MUST be used by role-matrix tests; synthetic `manage all` abilities for non-super-admin roles MUST NOT be accepted as representative coverage.
- **FR-010**: Tests MUST cover GUEST, USER, ADMIN, and SUPER_ADMIN across allowed and denied command and callback paths.
- **FR-011**: Tests MUST prove that denied actions perform zero state mutation.
- **FR-012**: This correction MUST NOT weaken existing repository boundaries,
  introduce direct persistence access, or bypass repository checks. The broader
  repository-authorization conformance work identified by the audit remains
  owned by Spec 055.
- **FR-013**: Existing module ability declarations MUST remain the policy source unless an explicit policy defect is documented in this feature.
- **FR-014**: The correction MUST preserve the established security-chain order for sanitization, rate limiting, authentication, validation, business logic, and audit logging.
- **FR-015**: Authorization infrastructure failures MUST return a controlled denial or typed error; they MUST NOT silently permit protected behavior.
- **FR-016**: A reviewable authorization coverage matrix MUST map active entry points to actors, action, subject, enforcement owner, and expected outcome.

### Key Entities

- **Actor Context**: Authenticated Telegram identity, application user, role, enabled status, and authorization ability attached to one update.
- **Authorization Decision**: Action, subject, actor, outcome, denial reason, and enforcement boundary for one protected operation.
- **Entry-Point Policy**: Classification of a command, callback, conversation action, or public bootstrap path.
- **Authorization Coverage Matrix**: Review artifact mapping active entry points and role expectations to tests.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of representative USER and ADMIN flows permitted by production abilities pass without requiring `manage all`.
- **SC-002**: 100% of tested unauthorized role/action pairs are denied before state mutation.
- **SC-003**: GUEST, USER, ADMIN, and SUPER_ADMIN each have at least one allowed and one denied scenario where the role supports both outcomes.
- **SC-004**: 100% of active protected commands and callbacks included in the implementation scope are mapped in the authorization coverage matrix.
- **SC-005**: No test assigns `manage all` to a non-super-admin actor to represent production behavior.
- **SC-006**: All authorization-specific tests, affected module tests, lint,
  build, authorization coverage, and reconciliation gates pass. The full
  bot-server suite MUST introduce no failures beyond the recorded three-test
  baseline owned by Spec 056, and production remains blocked until that
  baseline is repaired.
- **SC-007**: Zero Critical or High authorization findings remain in the post-implementation review.

## Assumptions

- CASL and `@tempot/auth-core` remain the approved authorization stack.
- The four-role hierarchy remains unchanged.
- This feature corrects authorization placement and coverage; it does not add new roles.
- Telegram remains the primary interface in scope.
- Module-specific ability declarations are retained unless a test proves a separate policy defect.

## Out of Scope

- New authentication providers.
- Dashboard or Mini App authorization.
- Multi-tenant role design.
- Role-management product features.
- Changes to the constitutional role hierarchy.
