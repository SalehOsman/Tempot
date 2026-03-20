# ADR-001: grammY over Telegraf

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot requires a Telegram bot framework that is TypeScript-first, actively maintained, and supports modern Node.js patterns (ESM, async/await, middleware composition).

## Decision

Use **grammY v1.x** as the bot engine.

## Consequences

- Full TypeScript support with accurate type inference for all Telegram API objects
- Plugin ecosystem (`@grammyjs/conversations`, `@grammyjs/menu`, `@grammyjs/ratelimiter`) maintained by the same team
- Webhook and polling modes supported natively
- Active development with regular releases

## Alternatives Rejected

**Telegraf:** Older codebase, TypeScript support added as afterthought, slower to adopt new Telegram Bot API features. Plugin ecosystem fragmented.

**node-telegram-bot-api:** No middleware system, minimal TypeScript support, not suitable for complex bots.
