# Tempot SaaS Migration Map

**Status**: Draft execution artifact for spec #026
**Purpose**: Map current Tempot Core components to future Tempot Cloud concerns without requiring current rewrites.

Tempot Core is a production-grade single Telegram bot template first. The SaaS
migration path exists to keep today's template choices compatible with a future
multi-bot product, not to move current development priority away from simple
single-bot setup, extension, and deployment.

## Component Mapping

| Current component | Current role | Future SaaS concern | Action now |
| --- | --- | --- | --- |
| `apps/bot-server` | Single bot runtime composition | Multi-bot runtime worker | Keep bot-scope context in mind |
| `apps/docs` | Documentation platform | Hosted developer docs | No SaaS change |
| `packages/auth-core` | Roles and guards | Tenant and workspace roles | Document future scopes |
| `packages/database` | Repositories and schema | Tenant-aware data access | Do not add tenant fields yet without spec |
| `packages/settings` | Static/dynamic settings | Scoped tenant/bot settings | Preserve scope-ready interfaces |
| `packages/logger` | Technical and audit logging | Central audit/search | Keep metadata extensible |
| `packages/event-bus` | Local/Redis events | Cross-worker events | Keep event contracts explicit |
| `packages/session-manager` | Session state | Bot-scoped sessions | Avoid global-only assumptions |
| `packages/module-registry` | Module discovery | Marketplace/module enablement | Keep module metadata explicit |
| `packages/i18n-core` | Translations | Tenant/module language overrides | Keep translation ownership clear |
| `packages/storage-engine` | Attachment storage | Tenant storage quotas | Keep provider abstraction |
| `packages/ai-core` | AI tools and RAG | Tenant quotas and provider policies | Keep provider abstraction and audit |
| `packages/input-engine` | Dynamic forms | Reusable form generation | No SaaS change |
| `packages/ux-helpers` | Telegram UX helpers | Bot UI consistency | No SaaS change |
| `packages/regional-engine` | Locale/time/currency | Tenant regional defaults | Keep context-driven APIs |
| `packages/sentry` | Error monitoring | Hosted operations | Keep app/environment tags |
| `packages/national-id-parser` | Egyptian ID utility | Regional compliance utility | Keep pure utility boundary |
| `modules/user-management` | User/profile module | Account/user lifecycle reference | Audit for scope assumptions |
| `modules/test-module` | Registry fixture | Test fixture only | Keep out of production SaaS design |

## Migration Milestones

1. Boundary inventory and enforcement.
2. Scope-ready settings and audit design.
3. Managed bot strategy and token policy.
4. Dashboard app planning.
5. Tenant data model spec.
6. Hosted deployment and operations spec.

## Current Priority Boundary

Until a future Product Manager decision activates Tempot Cloud work, developers
should:

- Keep `apps/bot-server` simple enough to operate one bot locally or in a
  normal deployment.
- Use packages and modules to make that bot easy to extend.
- Preserve explicit bot-scope metadata where it already exists.
- Avoid adding tenant, billing, hosted dashboard, or fleet-management logic to
  current template workflows.

## Non-Goals

- No tenant migration is created by this document.
- No billing implementation is implied.
- No existing package should be rewritten until a future SaaS spec accepts the change.
