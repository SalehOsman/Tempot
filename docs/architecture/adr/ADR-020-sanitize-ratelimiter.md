# ADR-020: sanitize-html and @grammyjs/ratelimiter over Custom Implementations

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot requires input sanitization (XSS prevention) and rate limiting for the bot. v10 built custom middleware for both. Building custom security libraries violates the "don't reinvent the wheel" principle and introduces untested security code.

## Decision

Use **sanitize-html v2.x** for input sanitization and **@grammyjs/ratelimiter** for bot rate limiting. Use **rate-limiter-flexible** for the Hono API (Dashboard/Mini App).

## Consequences

- sanitize-html: battle-tested, 3k+ stars, configurable allowlists for HTML tags and attributes
- @grammyjs/ratelimiter: official grammY plugin, Redis-backed, designed specifically for Telegram bots
- rate-limiter-flexible: supports Redis, PostgreSQL, and in-memory backends; handles the Hono API
- Security libraries are maintained by their communities, not by Tempot

## Alternatives Rejected

**Custom input sanitization (v10):** Security code written by the application team. Regex-based approaches miss edge cases. XSS vectors evolve — community-maintained libraries track them.

**Custom rate limiter (v10):** Redis key management, sliding window logic, penalty calculation — all re-implemented. @grammyjs/ratelimiter already handles all of this correctly for the Telegram use case.
