# AI Provider Switching Evidence

## Change

Knowledge management now exposes AI provider controls in the bot UI. The controls
write dynamic settings only:

- `ai_chat_provider`
- `ai_embedding_provider`
- `ai_embedding_model`

API keys remain runtime secrets:

- `GOOGLE_GENERATIVE_AI_API_KEY`
- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`

## Provider Matrix

| Capability | Gemini | OpenAI | DeepSeek |
| --- | --- | --- | --- |
| Chat provider | Supported | Supported | Supported |
| Embedding provider | Supported | Supported | Not supported |
| Key source | Runtime env | Runtime env | Runtime env |
| Bot stores API key | No | No | No |

## Operator Notes

Changing the embedding provider or embedding model requires rebuilding the
knowledge index. Existing vectors must not be mixed across providers or models.

## Verification

Focused unit tests were added for:

- settings dynamic keys,
- `ai-core` provider parsing and model IDs,
- knowledge menu provider actions,
- provider settings rendering,
- live runtime readiness resolution.
