# ADR-040: Tempot Core and Tempot Cloud Boundary

## Context

Tempot began as an enterprise Telegram bot framework. The project now has enough infrastructure to become the core of a future hosted SaaS product, but an immediate SaaS pivot would increase blast radius and weaken the current bot framework delivery path.

The owner approved a strategy where Tempot remains useful as a standalone bot framework while preserving a future path for hosted multi-bot, multi-tenant productization.

## Decision

We accept a two-layer product model:

- **Tempot Core** is the current open framework and runtime layer. It owns bot runtime, packages, business modules, module registry, settings, audit, i18n, and local deployment.
- **Tempot Cloud** is a future hosted product layer. It may own tenant accounts, workspaces, billing, multi-bot provisioning, hosted dashboards, managed-bot automation, operational dashboards, and marketplace distribution.

Tempot Core remains the current implementation priority. Tempot Cloud must not force immediate rewrites of current packages or modules. Core code may become scope-ready, but full tenant enforcement belongs to a later approved SaaS feature.

## Consequences

- Positive: Current bot framework work continues without a disruptive pivot.
- Positive: SaaS concerns are documented early enough to avoid blocking decisions.
- Positive: Modules can be reviewed for bot-scope and future tenant-scope readiness.
- Negative: Some future SaaS requirements will require later migrations.
- Negative: Documentation must distinguish readiness from implementation.

## Alternatives Rejected

1. **Rewrite Tempot as SaaS immediately**: rejected because it would disrupt the current framework and multiply architectural risk.
2. **Ignore SaaS until later**: rejected because early scope decisions affect settings, audit, tokens, and ownership.
3. **Mix SaaS behavior into current bot modules opportunistically**: rejected because it would violate separation of concerns and make later hosted product boundaries unclear.
