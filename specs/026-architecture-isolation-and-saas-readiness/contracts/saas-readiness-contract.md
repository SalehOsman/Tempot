# Contract: Tempot Core and Tempot Cloud Readiness

**Feature**: 026-architecture-isolation-and-saas-readiness
**Date**: 2026-04-28

This contract defines the product-layer boundary between the current framework and the future SaaS product.

## Tempot Core Owns

- Telegram bot runtime foundation
- Packages and modules
- Event-driven module contracts
- Repository, settings, i18n, logging, audit, and AI abstractions
- Local and self-hosted deployment readiness
- Module creation methodology

## Tempot Cloud Owns Later

- Hosted multi-tenant account model
- Dashboard and onboarding
- Billing, plans, usage limits, and subscriptions
- Managed bot provisioning lifecycle
- Secure token vault
- Customer-level observability
- Tenant and bot-level administration

## SaaS Readiness Rule

Current Tempot Core work SHOULD avoid single-bot assumptions where a small contract addition can preserve future SaaS flexibility. It MUST NOT implement full SaaS concerns until a separate approved feature exists.

## Scope Fields for Future Compatibility

Future-compatible contracts SHOULD be able to carry:

- `tenantId`
- `workspaceId`
- `botId`
- `userId`
- `requestId`

These fields are not all mandatory in current code, but future-facing designs must identify where each belongs.
