# Research: Bot Access Mode and Membership Gate

## Decision 1: Put the Access Gate in `apps/bot-server`

**Decision**: Implement the central access gate as bot-server runtime middleware before command and callback dispatch.

**Rationale**: Access control must protect all Telegram interaction surfaces, including direct commands and stale callback payloads. Module-level handlers alone cannot guarantee that every path is protected.

**Alternatives considered**:

- **Only hide buttons in menus**: Rejected. Hidden buttons do not protect direct commands, forged callbacks, or stale Telegram messages.
- **Implement gate inside `user-management`**: Rejected. User management owns profiles and roles, but the routing layer owns interaction dispatch.
- **Implement separate gate in every module**: Rejected. This duplicates policy and creates inconsistent behavior.

## Decision 2: Create a Dedicated `membership-management` Module

**Decision**: Membership requests, review menus, request persistence, and administrator membership actions belong in `modules/membership-management`.

**Rationale**: Membership workflow is a domain capability with its own commands, callbacks, menus, repository, locale files, and audit trail. It should follow the same module conventions as existing business modules.

**Alternatives considered**:

- **Add membership request screens to `user-management`**: Rejected. User management should remain focused on existing profiles, roles, and account data.
- **Keep membership logic only in bot-server**: Rejected. Bot-server should host cross-cutting runtime orchestration, not a full domain workflow.

## Decision 3: Keep Profile Creation Owned by `user-management`

**Decision**: Membership approval requests profile creation or activation through event-bus or an approved boundary contract. The membership module must not directly import repositories or services from user-management.

**Rationale**: The constitution requires module communication through the event bus. User profile invariants, protected fields, role assignment, and bootstrap behavior belong to user-management.

**Alternatives considered**:

- **Directly call `UserRepository` from membership-management**: Rejected. This violates module boundaries and makes profile invariants easier to bypass.
- **Duplicate profile storage in membership-management**: Rejected. This creates conflicting identity sources.

## Decision 4: Default to Private and Fail Closed

**Decision**: Missing access-mode configuration defaults to `private`. Invalid access-mode configuration must not result in public exposure.

**Rationale**: The project owner explicitly selected private as the default. From a security perspective, accidental public exposure is worse than temporarily denying access.

**Alternatives considered**:

- **Default to public**: Rejected by product decision and security posture.
- **Ignore invalid mode and continue as public**: Rejected. This is an unsafe failure mode.
- **Ignore invalid mode and continue silently as private**: Rejected unless accompanied by explicit startup error evidence, because silent misconfiguration is operationally unclear.

## Decision 5: Public Mode Requires Explicit Public Classification

**Decision**: Unknown visitors in public mode see only capabilities explicitly classified as public. Unclassified capabilities remain protected.

**Rationale**: Public mode is a deliberate exposure model, not a general bypass. It must be impossible for newly added module commands to become public by omission.

**Alternatives considered**:

- **Expose all non-admin commands in public mode**: Rejected. Some member features may contain personal or operational data.
- **Let every module decide independently without a shared contract**: Rejected. Behavior would drift across modules.

## Decision 6: Menus Must Use the Same Authorization Contract as Execution

**Decision**: Menu rendering and command/callback execution must both use the same access-decision contract.

**Rationale**: A menu item being visible is an authorization claim. A callback being executable must be verified independently because Telegram callbacks can outlive menu state.

**Alternatives considered**:

- **Role-only menu filtering**: Rejected. The project already uses abilities and responsibility boundaries; static roles are not enough.
- **Execution-only authorization**: Rejected. The UX would still show unavailable or sensitive options.

## Decision 7: Membership Request Idempotency by Telegram Identity

**Decision**: A Telegram identity may have at most one active pending membership request.

**Rationale**: Repeated `/start` or repeated button presses must not spam administrators or create conflicting review records.

**Alternatives considered**:

- **Allow unlimited pending requests**: Rejected. It creates review noise and makes audit history ambiguous.
- **Block all future requests after rejection**: Deferred to policy. The feature supports rejection state and optional resubmission rules.

## Open Technical Checks for Implementation

- Confirm the exact middleware order around `auth.middleware.ts`, `scoped-users.middleware.ts`, and callback fallback behavior.
- Confirm whether access mode is best stored in `packages/settings`, `settings-management`, or bot-management settings profiles.
- Confirm current audit repository conventions for module domain events.
- Confirm whether the event bus currently supports synchronous success feedback or whether approval should be implemented as a transactional boundary exposed by user-management through a registered port.
