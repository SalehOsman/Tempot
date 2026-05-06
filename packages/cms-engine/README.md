# @tempot/cms-engine

Deterministic dynamic translation overrides with optional AI-assisted draft review.

## Purpose

`@tempot/cms-engine` extends Tempot translation workflows with runtime-safe
override contracts. It does not replace `i18n-core`; it coordinates injected
cache, override-store, static-catalog, event, audit, and optional AI-review
ports.

## Runtime Boundary

Runtime translation lookup is deterministic:

```text
Redis override cache -> PostgreSQL override store -> Static JSON current locale -> Static JSON fallback locale
```

Runtime lookup never calls AI providers, AI adapters, Telegram, dashboard code,
or Prisma clients directly.

## AI Boundary

AI is available only through explicit draft-review APIs. Suggestions are
draft-only and must pass the normal deterministic update path before
publication.

## Toggle

Dynamic CMS is disabled unless `TEMPOT_DYNAMIC_CMS=true`.

- Runtime resolution falls back to static catalog values when disabled.
- Mutation APIs return typed disabled errors when disabled.

## Status

Activated for Spec #008 AI-ready MVP implementation.
