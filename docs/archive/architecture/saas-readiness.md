# Tempot SaaS Readiness

**Status**: Draft execution artifact for spec #026
**Decision source**: ADR-040

## Product Layers

| Layer | Status | Responsibility |
| --- | --- | --- |
| Tempot Core | Current priority | Standalone Telegram bot framework, packages, modules, local deployment, module registry |
| Tempot Cloud | Future product track | Hosted SaaS, tenants, workspaces, billing, bot provisioning, dashboards, marketplace |

Tempot Core must remain valuable without Tempot Cloud. SaaS readiness means Core avoids blocking decisions; it does not mean Core implements full tenancy now.

## Scope Concepts

| Concept | Core readiness | Cloud ownership |
| --- | --- | --- |
| Tenant | Keep room for tenant ID propagation later | Own tenant account and billing |
| Workspace | Not required now | Group users and bots |
| Bot scope | Treat one Telegram bot as an operational boundary | Manage many bot scopes |
| User | Current module and auth model | Cross-bot identity and account mapping |
| Settings | Keep settings scope-aware | Tenant/workspace/bot settings UI |
| Audit | Preserve actor, bot, and future tenant context | Central audit explorer |
| Token | Keep current bot token local | Managed custody and rotation |
| Usage limits | Package-level rate limiting | Subscription and quota enforcement |

## Multi-Tenant Guardrails

Future tenant support must include:

- Tenant ID propagation through request context.
- Bot ID propagation through runtime context.
- Audit context for tenant, bot, user, and actor.
- Settings scoping by global, tenant, bot, module, and user.
- Token ownership records.
- Billing isolation.
- Admin roles at tenant and bot levels.
- Deployment topology that separates hosted operations from open Core.

## Admin Dashboard Scope

Future dashboard scope:

- Module enablement and configuration.
- Settings management.
- User and role management.
- Bot inventory and health.
- Tenant administration.
- Audit search.
- Error and queue visibility.

Dashboard implementation belongs to a future app surface, not current bot modules.

## Excluded From Current Slice

- Billing implementation.
- Tenant database migrations.
- Hosted account onboarding.
- Managed bot token custody implementation.
- Multi-tenant authorization enforcement.
- Dashboard UI implementation.

## Readiness Checklist

A package or module is SaaS-ready when:

- It has explicit ownership scope.
- It does not assume a single global bot where future bot scope is relevant.
- It can accept contextual audit metadata.
- It uses settings APIs rather than hardcoded configuration.
- It avoids direct cross-module coupling.
- It has clear enable/disable behavior.
