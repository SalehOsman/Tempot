# ADR-031: Vercel AI SDK Advanced Features for ai-core Architecture

**Date:** 2026-03-26
**Status:** Accepted

## Context

ADR-016 chose Vercel AI SDK v4.x as the provider-agnostic abstraction layer. The initial ai-core architecture (per docs/tempot_v11_final.md) designs several custom abstractions: `AIProviderFactory` for provider management, manual `generateText()` + parsing for classification, and per-service caching/circuit-breaker logic.

Research into the SDK's advanced features reveals that most of these custom abstractions duplicate built-in SDK capabilities.

## Decision

Use **Vercel AI SDK's built-in advanced features** instead of hand-rolled abstractions in ai-core.

### Specific replacements

| Custom Abstraction (Planned)                         | SDK Built-in Replacement                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `AIProviderFactory` (hand-rolled registry)           | `createProviderRegistry()` — supports aliasing, fallbacks, middleware |
| Manual `generateText()` + parsing for classification | `Output.choice({ options })` — type-safe enum classification          |
| Manual `generateObject()` wrapper for extraction     | `Output.object({ schema })` — already planned correctly, confirmed    |
| Per-service caching logic                            | `LanguageModelMiddleware` — cross-cutting concern applied once        |
| Per-service circuit-breaker                          | `LanguageModelMiddleware` — composable with caching                   |
| Custom retry/timeout logic                           | Built-in `maxRetries`, `abortSignal` on every AI call                 |
| Custom token counting                                | Built-in `usage` object returned from every call                      |
| Custom telemetry                                     | Built-in `experimental_telemetry` with OpenTelemetry support          |

### Version consideration

Evaluate upgrading from AI SDK v4.x to v5.x during ai-core spec phase. The API has evolved significantly — `Output.choice()` and `LanguageModelMiddleware` may require v5.x.

## Consequences

- ai-core becomes a thin orchestration layer over the SDK rather than a reimplementation of SDK features
- `createProviderRegistry()` provides provider aliasing (`text → gemini-2.0-flash`, `embedding → text-embedding-004`) with zero custom code
- `LanguageModelMiddleware` enables composable cross-cutting concerns (caching, circuit-breaker, logging) applied once at the registry level
- Classification tasks use `Output.choice()` — type-safe, no manual parsing, provider-agnostic
- Significantly less custom code to write, test, and maintain
- ADR-016's promise of "switching providers requires only changing `TEMPOT_AI_PROVIDER`" is fully realized through the registry pattern

## Alternatives Rejected

**Hand-rolled AIProviderFactory (v11 architecture):** Duplicates `createProviderRegistry()` with inferior aliasing, no middleware support, and more custom code to maintain.

**Per-service caching/circuit-breaker:** Duplicates `LanguageModelMiddleware` capabilities. Scatters cross-cutting concerns across every service instead of applying them once at the provider level.

**Manual generateText() + parsing for classification:** Error-prone, requires custom output parsing per provider, ignores SDK's type-safe `Output.choice()` which handles all providers uniformly.

> **Note (2026-04-02):** Version resolved to v6.x (not v5.x) per ADR-037. All recommendations in this ADR apply to v6 APIs.
