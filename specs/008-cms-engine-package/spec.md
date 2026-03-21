# Feature Specification: CMS Engine (Dynamic Content)

**Feature Branch**: `008-cms-engine-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional cms-engine package for dynamic translation management and UI-driven content overrides as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Text Update (Priority: P1)

As a system administrator, I want to update bot messages from the dashboard without restarting the server so that I can refine instructions or fix typos instantly.

**Why this priority**: Core framework feature for rapid content updates and localization refinement.

**Independent Test**: Update a translation value in the dashboard and verify the bot uses the new value in the next interaction.

**Acceptance Scenarios**:

1. **Given** a translation key in the dashboard, **When** I change its value, **Then** the system updates the PostgreSQL store and triggers an `event-bus` invalidation.
2. **Given** an updated translation, **When** a user interacts with the bot, **Then** the bot retrieves the value from `cache-manager` (Redis) in < 2ms, reflecting the change instantly.

---

### User Story 2 - Protected Content (Priority: P2)

As a developer, I want to protect critical system messages (e.g., GDPR, Legal, Security) from being edited in the dashboard so that the system remains compliant and secure.

**Why this priority**: Essential for legal and security compliance (Section 8.5.6).

**Independent Test**: Attempting to edit a protected key in the dashboard and verifying the UI and API block the request.

**Acceptance Scenarios**:

1. **Given** a key marked as `protected`, **When** I attempt to edit it in the dashboard, **Then** the system denies the action and returns a clear error.
2. **Given** a protected key, **When** I view it in the dashboard, **Then** it is marked with a "Read-Only" indicator.

---

## Edge Cases

- **Cache Invalidation**: Ensuring all server instances clear their local cache when a key is updated (Answer: Use `event-bus` internal/external events).
- **Fallback Chain**: What if the database value is deleted? (Answer: Fall back to static JSON files as defined in Section 8.5.4).
- **Interpolation Errors**: Handling user-provided HTML or script in translations (Answer: Mandatory sanitization via `sanitize-html` before rendering).

## Clarifications

- **Technical Constraints**: `i18next` backend plugins for Postgres/Redis. `cache-manager` for overrides.
- **Constitution Rules**: Rule XIX (Cache) for override performance. Section 8.5.6 for Protected Keys (GDPR, Security).
- **Integration Points**: Overrides `i18n-core` values dynamically. Integrates with `event-bus` for cache invalidation.
- **Edge Cases**: Fallback chain (Redis → DB → Static JSON) ensures system stays functional if DB is down. Rollback feature reverts to previous versions or original JSON.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `i18next` backend plugins for Postgres and Redis storage.
- **FR-002**: System MUST implement a "Static JSON → Database → Redis Cache" fallback chain.
- **FR-003**: System MUST automatically sync new keys from static JSON to DB upon startup.
- **FR-004**: System MUST emit `cms.translation.updated` events for real-time cache invalidation across all nodes.
- **FR-005**: System MUST prevent the creation or deletion of translation keys via the dashboard (Rules-driven).
- **FR-006**: System MUST enforce protection for critical keys (GDPR, Security, System Warnings).
- **FR-007**: System MUST provide a "Rollback" feature to revert a key to its previous or original JSON value.

### Key Entities

- **TranslationOverride**: key, locale, value_new, value_old, updatedBy, updatedAt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Translation retrieval from Redis must take < 2ms.
- **SC-002**: Content updates from the dashboard must take effect across all nodes in < 5 seconds.
- **SC-003**: 100% of state changes must be recorded in the Audit Log with full diffs.
- **SC-004**: System successfully handles 1,000+ dynamic translation overrides without performance degradation.
