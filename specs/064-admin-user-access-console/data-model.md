# Data Model: Admin User Access Console

**Created**: 2026-07-20  
**Feature**: `064-admin-user-access-console`

## Existing Entities

### UserProfile

Represents a registered Telegram user.

Relevant attributes:

- `id`
- `telegramId`
- `username`
- `email`
- `language`
- `role`
- `createdAt`
- `updatedAt`
- `nationalId`
- `mobileNumber`
- `birthDate`
- `gender`
- `governorate`
- `countryCode`
- status field if available in the current profile/session model

Required behavior:

- Regional stored values can remain stable internal identifiers.
- Rendered values must be localized human labels.
- Role values must remain inside the constitutional role set.

## New Or Extended Entities

### AdminPermissionGrant

Represents a fine-grained permission assigned to an admin user.

Fields:

- `id`: unique grant identifier.
- `targetUserId`: admin user receiving the permission.
- `permission`: canonical permission token.
- `grantedByUserId`: actor who granted the permission.
- `reason`: optional reason.
- `createdAt`: grant timestamp.
- `revokedAt`: nullable revoke timestamp.
- `revokedByUserId`: nullable actor who revoked the permission.
- `revokeReason`: optional revoke reason.

Rules:

- Active grants are records with no `revokedAt`.
- `SUPER_ADMIN` does not require stored grants for `manage.all`.
- Only users with permission delegation authority can create or revoke grants.

### PermissionChangeHistory

Represents immutable permission delegation history.

Fields:

- `id`
- `targetUserId`
- `actorUserId`
- `permission`
- `action`: `GRANTED` or `REVOKED`
- `reason`
- `createdAt`
- `status`: `SUCCESS` or `DENIED`

Rules:

- Every grant and revoke attempt creates history.
- Denied attempts must be auditable without changing active grants.

### UserActivitySummary

Represents a bounded support view over recent user activity.

Fields:

- `targetUserId`
- `lastStartedAt`
- `lastCommand`
- `lastCallback`
- `lastAccessDenial`
- `interactionCount`
- `recentEvents`

Rules:

- Sensitive payloads must not be displayed.
- Missing activity must be shown as unavailable, not as misleading zero values.

### UserNotificationSummary

Represents a bounded support view over user notification history.

Fields:

- `targetUserId`
- `recentNotifications`
- `lastNotificationStatus`
- `lastNotificationAt`
- `lastFailureReason`

Rules:

- Sensitive message payloads must not be exposed.
- Test notification results must be visible to the initiating admin.

## Permission Catalog

Initial permission tokens:

- `read.users`
- `read.user_details`
- `update.users`
- `manage.user_roles`
- `ban.users`
- `read.user_activity`
- `read.user_notifications`
- `send.test_notification`
- `approve.membership`
- `reject.membership`
- `manage.admin_permissions`

## State And Safety Rules

- Last active super admin protection applies to role changes and account disabling.
- Revoked permissions are inactive immediately on the next interaction.
- Disabled optional modules hide dependent actions from menus.
- Audit records are required for every administrative mutation.
