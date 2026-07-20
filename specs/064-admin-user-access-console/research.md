# Research: Admin User Access Console

**Created**: 2026-07-20  
**Feature**: `064-admin-user-access-console`

## Decision 1: Use A Hybrid Module Boundary

**Decision**: Keep user profile administration inside `user-management`, and create a separate access administration capability for delegated permissions.

**Rationale**: User identity, contact, regional data, status, and role belong to user administration. Fine-grained permission grants are a separate security concern that should not inflate `user-management` into a general authorization module.

**Alternatives Considered**:

- Put all administration in `user-management`: rejected because it mixes profile ownership, role safety, permission delegation, activity, and notifications in one module.
- Create a roles module: rejected because roles are constitutionally fixed and should not become a dynamic role taxonomy.

## Decision 2: Keep Roles Fixed And Add Delegated Permissions

**Decision**: Preserve the four roles and add permission grants for admin delegation.

**Rationale**: The current role model is simple and governed. Delegated permissions solve the operational need without expanding role complexity.

**Alternatives Considered**:

- Add `MODERATOR`: rejected because it conflicts with the current role contract and existing role enum expectations.
- Create custom role templates in the first release: deferred because permission grants are enough for the immediate use case.

## Decision 3: Reuse Existing Authorization And Navigation Enforcement

**Decision**: Menu visibility and callback denial must both use the same final authorization result.

**Rationale**: The previous issue showed that visible buttons without matching authorization produce confusing user experience. Menus must hide unauthorized actions, and stale callbacks must still be denied.

**Alternatives Considered**:

- Menu-only filtering: rejected because stale callbacks would still bypass current visibility.
- Callback-only enforcement: rejected because users would still see buttons they cannot use.

## Decision 4: Activity And Notifications Are Read-Only First

**Decision**: First expose bounded summaries for activity and notification history, then support test notification sending.

**Rationale**: Support users need immediate diagnostic visibility. Full analytics, reporting, and notification campaign management are outside this feature.

**Alternatives Considered**:

- Build a full activity dashboard: rejected as too large for this feature.
- Skip activity until a web dashboard exists: rejected because Telegram admin operations need support diagnostics now.

## Decision 5: Localized Display Normalization Is Mandatory

**Decision**: Any internal regional or i18n key must be converted to a user-facing label before rendering.

**Rationale**: Raw keys such as `eg.governorates.cairo` are support defects and can be rendered poorly by Telegram clients.

**Alternatives Considered**:

- Store only display labels: rejected because it loses stable regional identifiers and makes language switching harder.
- Sanitize raw keys only: rejected because it still exposes implementation details.
