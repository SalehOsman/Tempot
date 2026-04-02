# ADR-016: Vercel AI SDK for AI Provider Abstraction

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot's AI Core uses Gemini for embeddings and AI capabilities. Binding directly to `@google/genai` creates vendor lock-in — switching to OpenAI or another provider would require rewriting every AI call in the codebase.

## Decision

Use **Vercel AI SDK v4.x** as the provider-agnostic abstraction layer. Gemini is the default provider via `@ai-sdk/google`.

## Consequences

- Switching AI providers requires changing only `AI_PROVIDER` in `.env` and the provider adapter
- All modules use the same AI interface regardless of the underlying provider
- Circuit breaker, retry logic, and degradation modes are implemented once in ai-core
- Vercel AI SDK supports streaming, structured output, and tool use across providers
- `AI_PROVIDER=gemini|openai|cohere` with zero code changes in modules

## Alternatives Rejected

**Direct @google/genai usage (v10 approach):** Hard vendor lock-in. Every AI call uses Gemini-specific types. Switching providers requires touching every module that uses AI.

**LangChain:** Significantly more complex, opinionated about abstractions, heavy dependency footprint not justified for Tempot's use case.

> **Note (2026-04-02):** Version updated to v6.x per ADR-037. The provider abstraction decision remains unchanged.
