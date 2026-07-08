# Feature Specification: Bot Access Mode and Membership Gate

**Feature Branch**: `codex/058-bot-access-mode-membership-gate`
**Created**: 2026-06-21
**Status**: Draft
**Input**: Product decision from project owner: the bot must default to private mode; unknown visitors must not see internal capabilities; they may only request membership. The bot must also support an explicit public mode where only public capabilities are exposed to visitors. Membership administration belongs in the administrator experience, while role-based member menus must remain filtered by permissions.

## Execution Context

This specification defines the implementation scope for a new access-control layer and membership workflow. It is intentionally not a production rollout approval. Production readiness remains governed by the existing delivery-hardening evidence gates.

The project currently has user management, role-aware menus, authorization middleware, module navigation, settings management, and event-bus infrastructure. This feature must integrate with those existing boundaries instead of bypassing them.

## Clarifications

### Session 2026-06-21

- Q: What is the default access mode? A: `private`.
- Q: What may an unknown visitor see in private mode? A: only the membership request entry point and minimal status/help needed to complete that request.
- Q: Should membership management be part of the Super Admin menu? A: yes, as an administration capability visible only to roles with membership-management permission.
- Q: Should ordinary members see the same administration menu? A: no. A `USER` sees only the member menu items allowed by role and responsibility.
- Q: Is membership management a module? A: yes. The access gate is a `bot-server` cross-cutting layer; membership workflow is a dedicated `membership-management` module.

## User States

- **Unknown Visitor**: Telegram identity is present, but no matching active `UserProfile` or active membership request is known.
- **Pending Visitor**: A membership request exists and is waiting for review.
- **Rejected Visitor**: The latest membership request was rejected and the current policy determines whether a new request is allowed.
- **Member**: An active `UserProfile` exists with role `USER` or another non-admin role.
- **Administrator**: An active `UserProfile` exists with role `ADMIN` or an equivalent permission set.
- **Super Administrator**: An active `UserProfile` exists with role `SUPER_ADMIN` or equivalent highest-privilege permission set.

## Bot Access Modes

- **Private mode**: default mode. Unknown, pending, and rejected visitors must not see protected, member, admin, or module capabilities. They may only access bootstrap actions such as `/start`, membership request submission, membership request status, and explicitly allowed help text.
- **Public mode**: optional mode. Unknown visitors may see only capabilities explicitly classified as public. Protected, member, admin, and sensitive module capabilities remain blocked.
- **Invalid mode**: invalid configured access mode must not silently become public. The application must either fail startup with a configuration error or fall back to private with an explicit startup error according to the implementation plan decision.

## User Stories and Testing

### User Story 1 - Unknown Visitor in Private Mode Sees Only Join Request (Priority: P1)

As an unknown Telegram visitor, I want `/start` to show only the membership request flow when the bot is private, so that I cannot discover internal bot capabilities before approval.

**Why this priority**: This closes the current security and UX issue where internal features can appear before the bot recognizes the visitor.

**Independent Test**: Configure access mode as private, send `/start` from a Telegram identity without an active user profile, and verify that the response contains only membership request and allowed bootstrap actions.

**Acceptance Scenarios**:

1. **Given** private mode and no active profile, **When** the visitor sends `/start`, **Then** the response exposes only membership request, request status if applicable, and minimal help.
2. **Given** private mode and no active profile, **When** the visitor sends `/settings`, `/profile`, `/users`, or a module command, **Then** the command is denied before the target handler runs.
3. **Given** private mode and no active profile, **When** the visitor presses an old internal callback button, **Then** the callback is denied and no internal action is executed.

---

### User Story 2 - Pending Visitor Cannot Use Internal Features (Priority: P1)

As a visitor with a pending membership request, I want the bot to show my pending status without exposing internal features, so that access remains controlled until approval.

**Why this priority**: Pending state must not become an accidental bypass.

**Independent Test**: Submit a membership request from an unknown identity, keep it pending, and verify that protected commands and callbacks remain blocked while request status is visible.

**Acceptance Scenarios**:

1. **Given** a pending request, **When** the visitor sends `/start`, **Then** the bot shows pending status and does not show member or admin menu items.
2. **Given** a pending request, **When** the visitor repeats membership submission, **Then** the bot returns the existing request state without creating duplicates.
3. **Given** a pending request, **When** the visitor attempts a protected command, **Then** the access gate denies it before handler execution.

---

### User Story 3 - Administrator Reviews Membership Requests (Priority: P1)

As an administrator, I want to review, approve, or reject membership requests from the admin menu, so that controlled onboarding is possible from inside Telegram.

**Why this priority**: Private mode is incomplete without a practical approval workflow.

**Independent Test**: Log in as `SUPER_ADMIN`, open the administration menu, review a pending request, approve it, and verify that the visitor becomes an active member with the default member role.

**Acceptance Scenarios**:

1. **Given** an admin with membership-management permission, **When** the admin opens the admin menu, **Then** membership management is visible.
2. **Given** a pending request, **When** the admin approves it, **Then** an active user profile is created or activated through the user-management boundary and the visitor can access the member menu on the next interaction.
3. **Given** a pending request, **When** the admin rejects it with a reason, **Then** the visitor sees only the rejection state and allowed resubmission options according to policy.
4. **Given** a non-admin member, **When** they open menus, **Then** membership management is not visible.

---

### User Story 4 - Member Menu Is Role and Permission Filtered (Priority: P2)

As a member, I want to see only the capabilities allowed for my role and responsibilities, so that menus are clear and permissions are enforced consistently.

**Why this priority**: Hiding only visitor features is insufficient; all menu rendering must reflect authorization.

**Independent Test**: Render menus for `UNKNOWN`, `PENDING`, `USER`, `ADMIN`, and `SUPER_ADMIN` actors and verify that every visible item is backed by a passing authorization decision.

**Acceptance Scenarios**:

1. **Given** a `USER`, **When** the main menu is rendered, **Then** member-allowed items such as profile/help/allowed modules may appear and admin-only items do not appear.
2. **Given** an `ADMIN`, **When** the main menu is rendered, **Then** admin items appear only when the role has the corresponding ability.
3. **Given** any actor, **When** a menu item is visible, **Then** executing its command or callback passes the same central access gate.

---

### User Story 5 - Super Admin Controls Bot Public or Private Mode (Priority: P2)

As a super administrator, I want to view and change the bot access mode from bot settings, so that I can decide whether the bot is private or publicly explorable.

**Why this priority**: The owner requested an explicit setting for public/private behavior.

**Independent Test**: As `SUPER_ADMIN`, switch the mode from private to public and back, then verify unknown visitor behavior changes only for public-classified capabilities.

**Acceptance Scenarios**:

1. **Given** a super admin, **When** they open bot settings, **Then** the current access mode is visible.
2. **Given** a super admin, **When** they change access mode, **Then** the change is audited and takes effect for new interactions.
3. **Given** a regular admin without mode-management permission, **When** they open settings, **Then** access mode controls are hidden or denied.

---

### User Story 6 - Public Mode Exposes Only Public Capabilities (Priority: P3)

As a visitor, I want public mode to show only capabilities intended for public use, so that I can explore safe bot features without becoming a member.

**Why this priority**: Public mode is useful, but it must not weaken internal access control.

**Independent Test**: Configure public mode, render `/start` for an unknown visitor, and verify that only public-classified capabilities appear while member/admin commands remain denied.

**Acceptance Scenarios**:

1. **Given** public mode and an unknown visitor, **When** `/start` is sent, **Then** public capabilities and membership request actions may appear.
2. **Given** public mode and an unknown visitor, **When** a protected or admin command is attempted, **Then** the access gate denies it.
3. **Given** a capability without explicit public classification, **When** public mode is active, **Then** it remains hidden from unknown visitors.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define an explicit bot access mode with allowed values `private` and `public`.
- **FR-002**: The system MUST default to `private` when no access mode has been configured.
- **FR-003**: The system MUST NOT silently expose public behavior for invalid access-mode configuration.
- **FR-004**: The system MUST resolve the actor state for every Telegram command and callback before dispatching protected behavior.
- **FR-005**: The system MUST classify commands, callbacks, and menu actions as `bootstrap`, `public`, `member`, `protected`, or `admin`.
- **FR-006**: The system MUST allow unknown visitors in private mode to access only bootstrap membership actions.
- **FR-007**: The system MUST block unknown visitors in private mode from member, protected, and admin actions before the target handler executes.
- **FR-008**: The system MUST allow unknown visitors in public mode to access only actions explicitly classified as public or bootstrap.
- **FR-009**: The system MUST deny stale or forged callback payloads when the actor no longer has permission for the target action.
- **FR-010**: The system MUST render menus from authorization decisions, not from static role assumptions alone.
- **FR-011**: The system MUST hide membership-management menu items from actors without membership-management permission.
- **FR-012**: The system MUST show membership-management controls to `SUPER_ADMIN` and to other roles only when their abilities allow it.
- **FR-013**: The system MUST provide a membership request submission flow for unknown visitors.
- **FR-014**: The system MUST enforce at most one active pending membership request per Telegram identity.
- **FR-015**: The system MUST show pending status to pending visitors without exposing internal features.
- **FR-016**: The system MUST provide administrator flows to list, inspect, approve, and reject membership requests.
- **FR-017**: The system MUST create or activate an active user profile after approval through the user-management boundary.
- **FR-018**: The membership-management module MUST NOT directly import or mutate user-management internals.
- **FR-019**: Module-to-module state changes MUST use the event bus or an approved boundary contract consistent with the constitution.
- **FR-020**: The system MUST audit membership request submission, approval, rejection, cancellation or expiry, and access-mode changes.
- **FR-021**: The system MUST record enough audit context to identify actor, target Telegram identity, action, result, and timestamp without logging protected personal data in plaintext.
- **FR-022**: All user-facing text introduced by this feature MUST use i18n locale keys.
- **FR-023**: The system MUST provide English and Arabic locale entries for new user-facing text.
- **FR-024**: The system MUST rate-limit membership request submission and repeated denied interactions using existing rate-limiter infrastructure where possible.
- **FR-025**: The system MUST keep liveness and readiness endpoints independent from Telegram membership access decisions.
- **FR-026**: The implementation MUST include tests for unknown, pending, rejected, user, admin, and super-admin actor states.
- **FR-027**: The implementation MUST include tests proving that hidden menu items cannot be executed through direct command or callback attempts.
- **FR-028**: The implementation MUST include migration and repository tests for membership request persistence.
- **FR-029**: The implementation MUST update README, roadmap, and module documentation to reflect actual behavior after implementation.
- **FR-030**: The implementation MUST preserve existing super-admin bootstrap behavior and must not break already registered super-admin accounts.

### Non-Functional Requirements

- **NFR-001**: Access decisions MUST fail closed when actor resolution fails.
- **NFR-002**: Access-gate execution MUST add no more than 50 ms p95 overhead in local unit/integration benchmarks for command routing.
- **NFR-003**: The feature MUST preserve TypeScript strict mode without `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.
- **NFR-004**: Public APIs that can fail MUST return `Result<T, AppError>` using `neverthrow`.
- **NFR-005**: Handlers and services MUST use repositories and MUST NOT access Prisma directly.
- **NFR-006**: The implementation MUST keep developer-facing code, comments, tests, and documentation in English.
- **NFR-007**: The implementation MUST not introduce hardcoded user-facing strings in TypeScript files.

## Key Entities

- **BotAccessSettings**: Stores the effective access mode, default member role, public visitor behavior, and audit metadata.
- **MembershipRequest**: Tracks a visitor's request to become a member, including Telegram identity metadata, status, review decision, and timestamps.
- **AccessActor**: Runtime identity view derived from Telegram context, user profile, role, and membership request state.
- **AccessDecision**: Runtime decision returned by the central gate for a command, callback, or menu action.
- **MenuCapability**: Declarative navigation/action item with authorization and public/private classification metadata.

## Edge Cases

- A visitor submits a request, then changes Telegram username before review.
- A visitor presses an old internal callback after their membership is revoked.
- A rejected visitor submits another request when resubmission is disabled.
- A super admin changes access mode while visitors are interacting with existing menus.
- User profile lookup fails because protected data cannot be decrypted.
- A command is registered by a module but lacks access classification.
- Public mode is enabled while a module has no explicit public capability metadata.
- An approval event succeeds but profile creation fails.
- Two admins approve or reject the same request concurrently.
- Docker/local development database contains old user profiles and existing super-admin records.

## Success Criteria

- **SC-001**: In private mode, 100% of unknown visitor attempts to execute protected/member/admin commands are denied before target handlers run.
- **SC-002**: In private mode, `/start` for an unknown visitor shows only bootstrap membership actions and no internal module menu items.
- **SC-003**: A pending visitor cannot execute internal features and sees only request status plus allowed bootstrap actions.
- **SC-004**: Approval of a pending request creates or activates a `USER` profile and the next `/start` shows the member menu.
- **SC-005**: `USER`, `ADMIN`, and `SUPER_ADMIN` menu snapshots show only actions permitted by their abilities.
- **SC-006**: Every visible menu item has a matching access-gate decision test proving execution is allowed for the same actor.
- **SC-007**: Public mode exposes only explicitly public capabilities to unknown visitors.
- **SC-008**: Missing access-mode configuration results in private behavior; invalid access-mode configuration never results in public exposure.
- **SC-009**: 100% of membership state transitions and access-mode changes create audit records.
- **SC-010**: Full relevant quality gates pass for the implementation branch: lint, build, unit tests, integration tests, and spec validation.

## Out of Scope

- Payment, subscription, or external identity verification for membership.
- Multi-tenant organization approval policies beyond the current bot instance.
- Production staging, backup, restore, rollback, and go/no-go evidence gates already covered by Spec #057.
- Rebuilding the entire menu system where current navigation can be extended with policy metadata.
- Replacing existing user-management profile storage.

## Dependencies

- Existing Telegram bot routing and middleware in `apps/bot-server`.
- Existing user-management profile and role model.
- Existing authorization ability registry and CASL integration.
- Existing settings-management and settings package behavior.
- Existing event-bus and audit infrastructure.
- Existing i18n package/module locale conventions.
