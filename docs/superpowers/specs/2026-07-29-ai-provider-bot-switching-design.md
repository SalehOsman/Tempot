# AI Provider Bot Switching Design

## Context

The knowledge management bot needs runtime provider switching without exposing or
storing API keys in Telegram. Existing infrastructure already includes
`@tempot/settings` for dynamic runtime settings and `@tempot/ai-core` for AI
provider abstraction.

## Decision

Provider switching is implemented as a super-admin operation in the knowledge
management bot UI. The bot stores only the selected provider/model in dynamic
settings. API keys remain in the runtime environment or secret store.

## Scope

- Chat providers: `gemini`, `openai`, `deepseek`.
- Embedding providers: `gemini`, `openai`.
- Embedding models:
  - `gemini-embedding-2-preview`
  - `gemini-embedding-2`
  - `text-embedding-3-small`
  - `text-embedding-3-large`

DeepSeek is supported for chat through the OpenAI-compatible provider path and
`DEEPSEEK_API_KEY`. It is not used for embeddings.

## UX

The knowledge menu exposes an AI providers screen with separate rows for:

- chat provider,
- embedding provider,
- embedding model.

Changing the embedding provider or model returns a warning that the knowledge
index must be rebuilt before relying on search answers.

## Security

The bot never accepts or renders API keys. Provider readiness checks only verify
whether the required environment variable exists.

## Validation

The implementation is covered by unit tests for settings keys, AI provider
resolution, knowledge menu layout, provider settings views, and live runtime
provider readiness.
