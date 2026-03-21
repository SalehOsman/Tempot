# Feature Specification: Auth Core (CASL RBAC & Scoping)

**Feature Branch**: `003-auth-core-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the foundational auth-core package using CASL for RBAC and Scoped Authorization as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-role Access Control (Priority: P1)

As a user, I want to access only the features allowed for my role so that the system remains secure and data is protected.

**Why this priority**: Core security requirement (Rule XXVI) for almost every other feature in the framework.

**Independent Test**: Verified by checking that a `USER` cannot access an `ADMIN` command or entity via the CASL `Ability` check.

**Acceptance Scenarios**:

1. **Given** a user with the `USER` role, **When** they attempt to execute an `ADMIN`-only command, **Then** the system denies access with a standardized `Result.err()`.
2. **Given** a user with the `SUPER_ADMIN` role, **When** they attempt any action, **Then** the system allows it by default (God Mode).

---

### User Story 2 - Scoped Authorization (Priority: P2)

As a super admin, I want to assign specific admins to specific modules so that I can delegate management tasks without granting full system access.

**Why this priority**: Essential for enterprise-grade management where multiple administrators handle different parts of the system (ADR-013).

**Independent Test**: Assigning an admin to a specific module and verifying they can only manage entities within that module's scope.

**Acceptance Scenarios**:

1. **Given** an admin scoped to the "Invoices" module, **When** they attempt to update an invoice, **Then** the action is permitted.
2. **Given** an admin scoped to "Invoices", **When** they attempt to access "User Management" settings, **Then** the system denies access.

---

## Edge Cases

- **Role Change Mid-Session**: What happens if a user's role is changed while they are in an active session? (Answer: Session must be invalidated or re-synced).
- **Multiple Scopes**: Can an admin have scopes for multiple modules? (Answer: Yes, scopes should be additive).
- **Default Permissions**: What are the permissions for an unauthenticated `GUEST`? (Answer: Minimal access as defined in the global `abilities.ts`).

## Clarifications

- **Technical Constraints**: Uses `@casl/ability` and `@casl/prisma` for authorization.
- **Constitution Rules**: Rule XXVI (CASL-Based RBAC) with 4 levels: GUEST, USER, ADMIN, SUPER_ADMIN. Rule XXVIII (Secure Bootstrap) for `SUPER_ADMIN_IDS`.
- **Integration Points**: Used by `bot-server`, `dashboard`, and `mini-app` to enforce permissions. Integrates with `database-package` via `@casl/prisma` for row-level security.
- **Edge Cases**: Role changes mid-session must invalidate or re-sync the session. Scopes are additive for admins managing multiple modules. Unauthenticated `GUEST` has minimal access defined in the global `abilities.ts`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use CASL (`@casl/ability` and `@casl/prisma`) for all authorization logic.
- **FR-002**: System MUST support exactly four roles: `GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN`.
- **FR-003**: System MUST provide a `defineAbility` function per module in `abilities.ts` for decentralized permission management.
- **FR-004**: System MUST implement `SUPER_ADMIN` God Mode via `can('manage', 'all')`.
- **FR-005**: System MUST support Scoped Authorization via CASL conditions (e.g., `createdBy: userId`).
- **FR-006**: System MUST automatically capture and log all denied access attempts in the Audit Log.
- **FR-007**: System MUST provide a `canAccessModule(ctx, moduleName)` helper for bot handlers.

### Key Entities

- **Ability**: The CASL object representing a user's permissions for the current context.
- **SessionUser**: The user data injected from the session manager.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authorization check overhead must be < 5ms per request.
- **SC-002**: 100% of modules must define their own permissions in `abilities.ts`.
- **SC-003**: Access denied events must be correctly logged in the Audit Log with 100% reliability.
- **SC-004**: System successfully denies unauthorized access attempts with a clear user-facing message via `i18n`.
