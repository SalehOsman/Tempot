# Feature Specification: CMS Engine Dynamic Translation Overrides

**Feature Branch**: `008-cms-engine-package`  
**Created**: 2026-03-19  
**Repaired**: 2026-05-06
**Status**: Ready for Superpowers implementation
**Input**: Product Manager approved activating `cms-engine` with AI-assisted editing support while keeping runtime translation lookup deterministic and fast.

## User Scenarios & Testing

### User Story 1 - Dynamic Text Update (Priority: P1)

As a system administrator, I want to update bot message values from an approved UI or admin workflow without restarting the server so that typos, guidance, and localization improvements can be applied quickly.

**Why this priority**: Dynamic content updates are the core value of `cms-engine`.

**Independent Test**: Update an existing translation key and verify the next translation resolution uses the new override through cache-backed lookup.

**Acceptance Scenarios**:

1. **Given** an existing static translation key, **When** an administrator updates its value, **Then** the system persists an override, invalidates the cache key, emits `cms.translation.updated`, and records an audit entry.
2. **Given** `TEMPOT_DYNAMIC_CMS=true`, **When** the same translation is requested again, **Then** the system resolves it from Redis cache first, then PostgreSQL override store, then static JSON fallback.

---

### User Story 2 - Protected Content (Priority: P1)

As a developer, I want critical legal, security, GDPR, and system-warning keys protected from unsafe editing so that dynamic content cannot weaken compliance or operational safety.

**Why this priority**: CMS writes must not bypass governance.

**Independent Test**: Attempt to update a protected key and verify the mutation returns a typed error without writing, publishing, or invalidating cache.

**Acceptance Scenarios**:

1. **Given** a protected key policy, **When** an update is submitted, **Then** the system rejects it with a typed `AppError`.
2. **Given** a protected key is viewed by a dashboard, **When** metadata is requested, **Then** the key is marked as read-only or review-gated according to policy.

---

### User Story 3 - AI-Assisted Draft Review (Priority: P2)

As an administrator, I want AI to review or suggest translation improvements before publication so that bot messages are clearer, consistent across languages, and safe to publish.

**Why this priority**: AI support improves content quality but must not affect hot-path translation performance.

**Independent Test**: Request AI review for a draft translation and verify the package calls an injected AI reviewer adapter, returns draft-only suggestions, and does not publish them automatically.

**Acceptance Scenarios**:

1. **Given** a draft translation value, **When** AI review is requested, **Then** the system returns suggestions, risk flags, and placeholder findings through an injected `CmsAiReviewerPort`.
2. **Given** a runtime translation lookup, **When** the key is resolved, **Then** the system never calls AI providers or AI adapters.
3. **Given** an AI suggestion exists, **When** it is accepted, **Then** the normal deterministic update path still validates placeholders, protected policy, sanitization, audit, cache invalidation, and event emission.

## Edge Cases

- **Cache invalidation across nodes**: All dynamic updates emit `cms.translation.updated` so every node can clear local or Redis-backed cache.
- **Dynamic CMS disabled**: When `TEMPOT_DYNAMIC_CMS` is not `true`, runtime resolution falls back to static JSON only and mutation APIs return a typed disabled error.
- **Fallback chain**: Runtime lookup order is `Redis override cache -> PostgreSQL override store -> Static JSON current locale -> Static JSON fallback locale -> missing-key error`.
- **Missing static key**: Dashboard or admin flows cannot create new keys. Key creation and deletion remain development work through JSON and SpecKit.
- **Interpolation safety**: Published values must preserve the placeholder set required by the static source value.
- **Sanitization**: Draft and published values must be sanitized according to a content format policy before storage.
- **AI safety**: AI suggestions are advisory and draft-only; no AI result is published without the normal deterministic update path.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a `cms-engine` package with strict TypeScript public contracts and package checklist compliance.
- **FR-002**: Runtime translation lookup MUST use the fallback order `Redis override cache -> PostgreSQL override store -> Static JSON current locale -> Static JSON fallback locale -> missing-key error`.
- **FR-003**: Runtime translation lookup MUST NOT call AI providers, AI adapters, or `ai-core`.
- **FR-004**: System MUST prevent dashboard/admin creation or deletion of translation keys; only existing static JSON keys may receive dynamic overrides.
- **FR-005**: System MUST enforce protected key policies for legal, security, GDPR, and critical system keys before any write.
- **FR-006**: System MUST validate that required interpolation placeholders are preserved before publishing an override.
- **FR-007**: System MUST sanitize values before persistence according to the configured content format.
- **FR-008**: System MUST persist override metadata including key, locale, value, previous value, updatedBy, updatedAt, and protection policy.
- **FR-009**: System MUST invalidate cache and emit `cms.translation.updated` after a successful override update.
- **FR-010**: System MUST record an audit entry with before/after values for every successful override mutation.
- **FR-011**: System MUST expose rollback contracts that can restore the previous value or the static JSON value through the same validated update path.
- **FR-012**: System MUST expose an optional AI review port that returns draft-only suggestions, placeholder findings, and risk flags.
- **FR-013**: AI-assisted review MUST be disabled by absence of the port and return a typed `AppError` instead of calling providers directly.
- **FR-014**: System MUST expose deterministic quality checks that can run without AI for placeholder preservation, protected policy, and sanitization.

### Key Entities

- **TranslationKey**: namespace, key, locale, static value, fallback value, format, protection policy.
- **TranslationOverride**: namespace, key, locale, value, previousValue, updatedBy, updatedAt, source.
- **TranslationRevision**: immutable before/after history for rollback and audit.
- **CmsAiReviewRequest**: draft translation, source value, locale, fallback locale, namespace, key, and context metadata.
- **CmsAiReviewReport**: draft-only suggestions, risk flags, placeholder findings, and approval recommendation.

## Success Criteria

- **SC-001**: Cached translation override retrieval remains measurable at `< 2ms` in package-level benchmark or latency test.
- **SC-002**: Content updates are visible across nodes within `< 5 seconds` through event-driven cache invalidation.
- **SC-003**: 100% of successful state changes produce an audit payload with before/after values.
- **SC-004**: AI review is proven by tests to be opt-in and absent from runtime translation lookup.
- **SC-005**: Placeholder mismatch, protected key updates, missing static keys, and disabled dynamic CMS paths all return typed `AppError` values.
