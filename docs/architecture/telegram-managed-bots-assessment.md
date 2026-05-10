# Telegram Managed Bots Assessment

**Status**: Draft execution artifact for spec #026
**Assessment date**: 2026-04-28
**Primary source**: `https://core.telegram.org/bots/features#managed-bots`

## Telegram Capability Summary

Telegram documents Managed Bots as a capability where a manager bot can let users create and manage their own bots. The manager bot can be enabled through BotFather's Mini App settings, shared through a `https://t.me/newbot/{manager_bot_username}/{new_username}?name={new_name}` link, receive a `managed_bot` update, and use `getManagedBotToken` to retrieve the created bot token.

## Impact on Tempot

| Area | Impact | Rationale |
| --- | --- | --- |
| Product strategy | Positive | Aligns with Tempot as a future bot factory or SaaS core |
| Current bot framework | Neutral | Does not require stopping current Core work |
| Architecture | Positive with risk | Creates a strong need for explicit bot-scope boundaries |
| Security | High risk | Token retrieval and custody must be controlled and audited |
| Developer experience | Positive | Could power templates and guided bot creation |
| Roadmap | Future track | Should follow boundary hardening, not precede it |

## Recommendation

Continue Tempot Core and architecture isolation work first. Treat Managed Bots as a future optional capability behind a dedicated adapter/service boundary. Do not cancel the project and do not pivot the current bot-server into a bot-management platform yet.

## Opportunities

- Self-serve creation of personal AI agents.
- Business bot provisioning.
- Template marketplace activation.
- Hosted onboarding for Tempot Cloud.
- Bot lifecycle management from an admin dashboard.

## Risks

- Bot token custody and rotation.
- Consent and ownership ambiguity.
- Abuse prevention and rate limiting.
- Audit trail completeness.
- Separation between manager bot and managed bot runtime.
- Future Telegram API changes.

## Adoption Timing

Managed Bots should be considered after:

1. Boundary rules are documented.
2. Security baseline is accepted.
3. Token rotation guidance exists.
4. Bot scope is represented in the SaaS readiness model.
5. A future feature spec defines the adapter and data model.
