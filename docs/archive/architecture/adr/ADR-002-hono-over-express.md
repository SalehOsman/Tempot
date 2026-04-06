# ADR-002: Hono over Express

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot needs a web server for the Hono API (webhook endpoint, health check, dashboard API). The server must be lightweight, TypeScript-native, and performant.

## Decision

Use **Hono v4.x** as the web server.

## Consequences

- Fastest Node.js web framework in benchmarks
- Edge-compatible (works on Cloudflare Workers, Deno, Bun, Node.js)
- TypeScript-first with full type inference for routes and middleware
- Built-in multipart body parsing eliminates the need for multer (see ADR-022)
- `hono/body-limit` middleware for file upload size limits

## Alternatives Rejected

**Express:** Aged codebase, TypeScript types via `@types/express` are incomplete, significantly slower in benchmarks, no built-in multipart support.

**Fastify:** More complex setup, plugin architecture adds cognitive overhead for Tempot's use case.
