# Feature Specification: Admin User Access Console

**Feature Branch**: `064-admin-user-access-console`  
**Created**: 2026-07-20  
**Status**: Draft  
**Input**: User request to create a professional administration experience for approved members, user profile editing, role management, delegated admin permissions, user activity review, notification review, and test notification sending.

## User Scenarios & Testing

### User Story 1 - Review And Open User Profiles (Priority: P1)

A super admin can open the Users area, browse registered users, search by known identifiers, and open a complete user profile without seeing raw internal localization keys.

**Why this priority**: The current post-approval flow leaves super admins without practical visibility into users after membership approval.

**Independent Test**: Can be fully tested by approving or creating at least one member, opening Users, selecting that member, and verifying the detail screen shows localized, non-raw profile data.

**Acceptance Scenarios**:

1. **Given** a super admin and at least one registered user, **When** the super admin opens Users, **Then** the system shows a paginated user list with name, role, status, language, and registration date.
2. **Given** a user with governorate stored as an internal regional key, **When** any profile detail screen is rendered, **Then** the governorate is displayed as a localized human label and never as the raw key.
3. **Given** a super admin selects a user from search results, **When** the user detail screen opens, **Then** the screen shows identity, contact, regional, role, status, registration, and administrative metadata sections.
4. **Given** an authorized user opens `/start` on a narrow Telegram client, **When** the main menu is rendered, **Then** each action appears in a readable single-button row with a leading visual icon and no clipped labels.

---

### User Story 2 - Edit User Data As Super Admin (Priority: P1)

A super admin can edit user profile fields after membership approval, including identity, contact, language, and regional data.

**Why this priority**: Membership approval is not enough for operations; administrators need to correct profile data and support users.

**Independent Test**: Can be tested by opening a user detail screen, choosing an editable field, submitting a valid update, and confirming the detail screen and audit history reflect the change.

**Acceptance Scenarios**:

1. **Given** a super admin viewing a user, **When** the super admin edits the user's mobile number, **Then** the system validates, saves, audits, and displays the updated number.
2. **Given** a super admin edits a national ID, **When** the submitted national ID is valid for the supported region, **Then** the system updates derived regional fields consistently.
3. **Given** an invalid update value, **When** the super admin submits it, **Then** the system keeps the previous value and shows a localized validation message.

---

### User Story 3 - Manage Roles Safely (Priority: P1)

A super admin can promote or demote users between the constitution-approved roles while the system prevents unsafe role changes.

**Why this priority**: Role changes control access to operational functions and must be safe before delegated permissions are introduced.

**Independent Test**: Can be tested by promoting a normal user to admin, demoting an admin to user, and attempting blocked operations against protected super admin constraints.

**Acceptance Scenarios**:

1. **Given** a super admin opens a user's role screen, **When** the role choices are shown, **Then** only `GUEST`, `USER`, `ADMIN`, and `SUPER_ADMIN` are available for assignment where allowed.
2. **Given** the last active super admin, **When** any action would demote, ban, or disable that account, **Then** the system blocks the action with a clear localized message.
3. **Given** an admin without role-management permission, **When** they attempt to change a user role, **Then** the system denies the action and records the denial.
4. **Given** a known account is demoted to `GUEST`, **When** that account runs `/start`, **Then** the system offers the membership request path again instead of a protected menu with unavailable actions.
5. **Given** a super admin blocks a user, **When** the blocked user sends any command or membership request callback, **Then** the bot denies the interaction before any feature logic runs.
6. **Given** a super admin opens a blocked user profile, **When** the account status action is shown, **Then** the same status-control position offers unblock instead of block.
7. **Given** a super admin confirms unblocking a blocked user, **When** the update succeeds, **Then** the user status returns to `ACTIVE` and the next interaction proceeds according to the user's role and permissions.

---

### User Story 4 - Delegate Admin Permissions (Priority: P2)

A super admin can grant and revoke fine-grained permissions to selected admins without creating new global roles.

**Why this priority**: The project constitution keeps roles simple, but operational teams need controlled delegation.

**Independent Test**: Can be tested by granting one permission to an admin, verifying the related menu and action become available, revoking it, and verifying both menu visibility and callback authorization are removed.

**Acceptance Scenarios**:

1. **Given** a super admin views an admin account, **When** they grant `update.users`, **Then** that admin can edit permitted user profile fields.
2. **Given** a permission is revoked, **When** the affected admin opens the main menu or presses an old callback, **Then** the menu hides the action and the old callback is denied.
3. **Given** any permission grant or revoke, **When** the change is saved, **Then** the system records who changed it, when it changed, and why if a reason was supplied.

---

### User Story 5 - Review Activity And Notifications (Priority: P2)

A super admin or delegated admin can review a user's operational activity, permission denials, notification history, and send a test notification.

**Why this priority**: Support and troubleshooting require visibility into user behavior and communication outcomes.

**Independent Test**: Can be tested by opening a user detail screen, viewing activity, viewing notifications, and sending a test notification to the selected user.

**Acceptance Scenarios**:

1. **Given** a user has recent interactions, **When** an authorized admin opens Activity, **Then** the system shows recent commands, callbacks, access denials, and timestamps.
2. **Given** a user has notification records, **When** an authorized admin opens Notifications, **Then** the system shows recent notification status and relevant metadata without exposing sensitive payloads.
3. **Given** an authorized admin sends a test notification, **When** the notification is delivered or fails, **Then** the result is shown and audited.

### Edge Cases

- Existing approved users may have incomplete profile fields; detail screens must display stable placeholders rather than raw nulls or internal keys.
- A super admin must not be able to remove the last active super admin path.
- Demoted `GUEST` users remain eligible to submit a new membership request unless their profile status is blocked.
- Blocked users must not be able to bypass the block by using `/start` or membership request callbacks.
- Blocked users must receive a human-readable blocked-account message rather than a generic permission or internal error response.
- An admin must not grant themselves new permissions unless they already have explicit permission delegation authority.
- Permission revocation must affect both newly rendered menus and stale callbacks.
- Disabled optional modules must not leave broken buttons in user details.
- Notification sending failures must not mutate user data.
- User searches with no results must provide an actionable empty state.
- Internal i18n or regional keys must never be displayed as raw user-facing values.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a user administration area for super admins and delegated admins.
- **FR-002**: The system MUST list users with pagination or bounded result sets.
- **FR-003**: The system MUST support searching users by display name, Telegram ID, username, email, and mobile number where those values exist.
- **FR-004**: The system MUST provide a complete user detail screen with identity, contact, regional, role, status, registration, and administrative metadata.
- **FR-005**: The system MUST display localized human labels for regional values such as governorate and language.
- **FR-006**: The system MUST prevent raw localization keys, regional keys, and internal enum labels from appearing in user-facing bot messages.
- **FR-007**: The system MUST allow super admins to edit user profile fields after membership approval.
- **FR-008**: The system MUST validate every administrative profile update before saving it.
- **FR-009**: The system MUST audit every administrative profile update with actor, target, changed field category, timestamp, and outcome.
- **FR-010**: The system MUST allow role changes only among constitution-approved roles.
- **FR-011**: The system MUST remove non-constitutional role choices from administration menus.
- **FR-012**: The system MUST protect the last active super admin from demotion, disabling, banning, or any equivalent lockout.
- **FR-013**: The system MUST prevent an admin from managing users or roles without explicit permission.
- **FR-014**: The system MUST provide a dedicated permission delegation capability controlled by super admins.
- **FR-015**: The system MUST support granting and revoking fine-grained permissions to admin users.
- **FR-016**: The system MUST record permission grant and revoke history.
- **FR-017**: The system MUST combine base role permissions with delegated permissions when authorizing actions.
- **FR-018**: The system MUST hide menu items for actions the current actor is not allowed to perform.
- **FR-019**: The system MUST deny stale callbacks for actions that are no longer permitted.
- **FR-020**: The system MUST expose recent user activity to authorized administrators.
- **FR-021**: The system MUST expose recent user notification history to authorized administrators.
- **FR-022**: The system MUST allow authorized administrators to send a test notification to a selected user.
- **FR-023**: The system MUST show localized success, validation, denial, and failure messages.
- **FR-024**: The system MUST keep membership approval responsibilities separate from post-approval user administration.
- **FR-025**: The system MUST keep user profile ownership separate from delegated permission ownership.

### Key Entities

- **User Profile**: A registered Telegram user profile with identity, contact, language, role, status, regional, registration, and audit metadata.
- **Admin Permission Grant**: A fine-grained permission assigned to an admin user by a super admin or authorized delegator.
- **Permission Change History**: An immutable record of grants and revocations with actor, target, permission, reason, and timestamp.
- **User Activity Summary**: A bounded operational view of recent commands, callbacks, access denials, and notable support events.
- **User Notification Summary**: A bounded operational view of recent notifications, delivery state, and safe metadata.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A super admin can open any registered user's detail screen from the bot menu in no more than 4 interactions after opening Users.
- **SC-002**: 100% of displayed regional and language values use localized human labels instead of raw internal keys.
- **SC-003**: 100% of role choices shown in administration menus are constitution-approved roles.
- **SC-004**: 100% of administrative data changes produce an audit record with actor, target, action, and outcome.
- **SC-005**: Permission revocation takes effect for both menus and stale callbacks on the next interaction.
- **SC-006**: The system blocks every attempt to remove the last active super admin.
- **SC-007**: Authorized admins can complete a delegated user edit flow in under 2 minutes for common fields.
- **SC-008**: A test notification result is visible to the initiating admin within one interaction after sending.

## Assumptions

- The four constitutional roles remain `GUEST`, `USER`, `ADMIN`, and `SUPER_ADMIN`.
- Fine-grained permissions extend admin capabilities without introducing new roles.
- Super admins retain `manage.all` behavior and cannot lose the final super admin recovery path.
- Telegram bot menus are the first administration surface; dashboard or web admin UI is outside this feature.
- Existing audit, notification, interaction observability, and module navigation capabilities should be reused where possible.
- Disabled optional modules should cause related menu actions to be hidden rather than broken.
