# ADR-022: Hono Built-in Multipart over multer

**Date:** 2026-03-19
**Status:** Accepted

## Context

File uploads in the Hono API (Dashboard, Mini App) require multipart/form-data parsing. v10 used multer, which was designed for Express and requires an adapter for Hono.

## Decision

Use **Hono's built-in `parseBody()`** for multipart parsing and **`hono/body-limit`** middleware for file size limits.

## Consequences

- No additional dependency for file upload parsing
- `hono/body-limit` integrates cleanly with the Hono middleware chain
- Consistent with Hono's design philosophy — built-in capabilities preferred over adapters
- Works on Edge Runtime if Tempot is ever deployed to Cloudflare Workers

## Alternatives Rejected

**multer (v10 approach):** Designed for Express. Requires `multer-hono` adapter — an unofficial wrapper. Additional dependency that may lag behind Hono updates. The adapter pattern introduces unnecessary abstraction.

**busboy directly:** Lower-level than needed. Would require manual integration with Hono's request lifecycle.
