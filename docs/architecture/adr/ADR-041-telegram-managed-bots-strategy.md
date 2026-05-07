# ADR-041: Telegram Managed Bots Strategy

## Context

Telegram now documents Managed Bots as a capability where a manager bot can help users create and manage other bots. Telegram states that a manager bot can receive a `managed_bot` update, use `getManagedBotToken`, and then control the created bot through the Bot API.

This is strategically relevant to Tempot because it supports future self-serve bot creation, AI agent templates, business bots, and hosted bot management. It also introduces sensitive token custody, consent, audit, and ownership risks.

## Decision

We classify Telegram Managed Bots as a positive optional future capability for Tempot, not an immediate rewrite trigger.

Managed Bots must be introduced later behind a dedicated adapter/service boundary. The future boundary must include:

- Explicit owner consent.
- Token retrieval and storage controls.
- Audit logging for provisioning and token access.
- Bot-scope ownership records.
- Event-driven provisioning flow.
- Isolation from existing `apps/bot-server` startup and unrelated modules.

## Consequences

- Positive: Tempot can become a strong foundation for self-serve bot creation.
- Positive: The current architecture hardening path remains intact.
- Positive: Security requirements are recognized before implementation.
- Negative: Managed-bot support is deferred until boundary governance is stable.
- Negative: Future token custody will require stronger operations guidance.

## Alternatives Rejected

1. **Implement Managed Bots directly inside bot-server now**: rejected because it would couple provisioning, token custody, and runtime startup too early.
2. **Treat Managed Bots as irrelevant**: rejected because the capability aligns strongly with Tempot's future SaaS/productization path.
3. **Let each module manage child bots independently**: rejected because it would create duplicated token handling and inconsistent audit behavior.
