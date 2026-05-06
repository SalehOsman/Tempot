# CMS Engine Research

## Decision 1: Keep Runtime Lookup AI-Free

**Decision:** Runtime translation lookup must never call AI providers, `ai-core`, or AI adapters.

**Rationale:** The architecture requires Redis-backed override retrieval below 2ms. AI latency, provider availability, and cost are incompatible with hot-path translation resolution.

**Alternatives Considered:**

- Calling AI during missing-key fallback. Rejected because it creates nondeterministic user-facing output and violates latency expectations.
- Pre-generating AI suggestions during startup. Rejected for MVP because it creates unnecessary provider dependency and startup risk.

## Decision 2: Use Ports for Persistence, Cache, Events, Audit, and AI

**Decision:** The package core exposes ports and does not instantiate Prisma, Redis, event bus, audit, dashboard, Telegram, or AI clients.

**Rationale:** This matches existing package patterns and keeps the package testable under strict TDD.

**Alternatives Considered:**

- Direct Prisma repository inside `cms-engine`. Rejected because service packages must not bypass repositories and the MVP can define contracts first.
- Direct `ai-core` dependency. Rejected for MVP because AI must be optional and draft-only.

## Decision 3: Protected Policy Is More Expressive Than Boolean

**Decision:** Use `editable`, `requires_review`, `super_admin_only`, and `locked` policies instead of a single protected boolean.

**Rationale:** The architecture identifies different sensitive content classes. A boolean cannot express review-gated content or super-admin-only content without later migration.

## Decision 4: Placeholder Validation Is Deterministic

**Decision:** Placeholder preservation is enforced by deterministic parsing before storage. AI may report additional risks but cannot replace this check.

**Rationale:** Placeholder mismatches cause runtime formatting failures and must be caught reliably.

## Decision 5: Sanitization Policy Is Format-Aware

**Decision:** Store values after applying a content-format policy: `plain`, `telegram_html`, or `markdown`.

**Rationale:** Telegram HTML permits a small tag set while plain text should strip all tags. A single global sanitizer would either be too permissive or too restrictive.

## Decision 6: Rollback Uses Normal Mutation Path

**Decision:** Rollback restores previous or static values by calling the same validated update path.

**Rationale:** Rollback should not bypass protection, placeholders, sanitization, audit, events, or cache invalidation.
