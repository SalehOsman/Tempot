# Contract: Telegram Managed Bots Opportunity

**Feature**: 026-architecture-isolation-and-saas-readiness
**Date**: 2026-04-28
**Source**: https://core.telegram.org/bots/features#managed-bots

## Product Position

Telegram Managed Bots are a positive opportunity for Tempot. They SHOULD be treated as a future optional capability that helps Tempot Cloud provision and operate customer bots.

## Required Future Boundaries

A future managed-bot capability MUST define:

- Manager bot identity
- Managed bot identity
- Managed bot owner
- Token retrieval and secure storage flow
- Bot lifecycle events
- Audit events for token access and bot management actions
- Authorization rules for who can create, configure, pause, or delete managed bots
- Failure and revocation behavior

## Prohibited Integration Path

Managed bot behavior MUST NOT be added directly as scattered logic inside unrelated modules. It must be introduced through a dedicated specification and approved boundary.

## Recommended Timing

Implementation SHOULD happen after architecture isolation hardening and SaaS readiness contracts are approved.
