# ADR-037: Vercel AI SDK v6 Upgrade for ai-core

**Date:** 2026-04-02
**Status:** Accepted
**Supersedes:** ADR-016 (version reference only — ADR-016's provider abstraction decision remains valid)

## Context

ADR-016 adopted Vercel AI SDK v4.x. ADR-031 recommended evaluating v5.x during the ai-core spec phase. During specification (2026-04-02), the evaluation determined that v6.x is the appropriate version because:

- `Output.choice()` for type-safe intent classification requires v6
- `LanguageModelMiddleware` for composable cross-cutting concerns requires v6
- `createProviderRegistry()` with middleware support is fully stable in v6
- Built-in OpenTelemetry integration (for Langfuse) is production-ready in v6

The AI SDK is NOT currently installed anywhere in the monorepo — this is a fresh adoption, not an upgrade of existing code.

## Decision

Use Vercel AI SDK v6.x (`"ai": "^6.0.0"`) with `@ai-sdk/google` and `@ai-sdk/openai` provider adapters. This is scoped exclusively to the `@tempot/ai-core` package.

## Consequences

- ai-core uses v6 APIs directly — no migration from v4 needed (no v4 code exists)
- ADR-016's provider abstraction decision remains valid — v6 enhances it with `createProviderRegistry()`
- ADR-031's recommendations for built-in features over hand-rolled abstractions apply to v6 APIs
- Future packages that need AI capabilities import from `@tempot/ai-core`, never from `ai` directly

## Alternatives Rejected

**v4.x (ADR-016 original):** Missing `Output.choice()`, `LanguageModelMiddleware`, and stable provider registry.
**v5.x (ADR-031 suggestion):** Transitional version — v6 is the stable release with all required features.
