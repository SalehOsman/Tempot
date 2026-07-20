# Implementation Plan: Admin User Access Console

**Created**: 2026-07-20  
**Feature**: `064-admin-user-access-console`  
**Status**: Draft

## Summary

Build a professional Telegram bot administration experience for post-approval user operations. The first delivery slice completes user management capabilities. The second delivery slice adds delegated admin permissions and connects those permissions to authorization and menu visibility.

## Scope

### In Scope

- Localized profile display fixes for regional values.
- Complete user list and user detail flows.
- Super admin profile editing for users.
- Safe role management using only constitutional roles.
- Permission delegation for admin users.
- Permission history and audit integration.
- Activity and notification summaries.
- Test notification action for authorized administrators.

### Out Of Scope

- Web dashboard administration.
- Dynamic custom roles.
- Billing, tenant, or multi-bot fleet management.
- Full analytics dashboard.
- Notification campaign management.

## Architecture Impact

### `user-management`

Owns:

- User listing.
- User detail rendering.
- User profile editing.
- Role changes.
- Last super admin protection.
- User-focused activity and notification entry points.

### `access-management`

Owns:

- Permission grant catalog.
- Grant and revoke flows.
- Permission history.
- Permission delegation authorization.

### `auth-core` And Bot Runtime

Own:

- Final ability construction from base role rules and active grants.
- Enforcement through existing authorization and access gate layers.
- Menu visibility based on final abilities.

### Adjacent Modules

- `membership-management`: remains responsible for membership request approval and rejection.
- `notification-center`: provides notification history and test notification behavior where available.
- `interaction-observability`: provides activity source data where available.
- `audit-viewer`: provides or receives audit records.

## Constitution Checks

- Roles remain `GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN`.
- User-facing text must use i18n keys.
- Public fallible services must return `Result<T, AppError>`.
- Handlers and services must not access Prisma directly.
- Modules must communicate through existing dependency contracts or event bus boundaries.
- No new direct cross-module imports between business modules.
- Tests must be written before production behavior changes.

## Delivery Strategy

### Sprint A: User Administration Foundation

1. Fix localized regional display in profile screens.
2. Replace pending user callbacks with user detail rendering.
3. Add user profile edit flows for super admins.
4. Add role change flow with last super admin protection.
5. Add focused tests and i18n coverage.

### Sprint B: Delegated Permissions

1. Add `access-management` module skeleton through project module tooling.
2. Add permission grant storage and repository.
3. Add permission grant and revoke flows.
4. Extend final authorization ability construction to include active grants.
5. Add menu and stale callback authorization tests.

### Sprint C: Activity And Notifications

1. Add activity summary view.
2. Add notification summary view.
3. Add test notification action.
4. Add fallback behavior when optional modules are disabled.

## Testing Strategy

- Unit tests for display normalization.
- Handler tests for user list, view, edit, and role callbacks.
- Service tests for validation and last super admin protection.
- Repository tests for permission grants and revocations.
- Authorization tests for delegated permissions.
- Regression tests for stale callbacks after permission revocation.
- Integration tests for audit records on admin mutations.
- Docker smoke test after runtime build.

## Validation Gates

- `pnpm --filter @tempot/user-management test`
- `pnpm --filter @tempot/session-manager test` if session behavior changes
- `pnpm --filter @tempot/auth-core test` if ability construction changes
- New `access-management` package/module tests once created
- `pnpm build:bot-runtime`
- `pnpm lint`
- `pnpm spec:validate`
- Docker rebuild and `/live` health check before bot testing

## Risks

- Dynamic permission integration can drift from existing CASL role definitions if not centralized.
- Activity and notification summaries depend on optional modules and must degrade cleanly.
- Existing dirty workspace state increases merge risk and should be isolated before implementation commits.
- User edit flows can grow large; files must stay under project size limits.
