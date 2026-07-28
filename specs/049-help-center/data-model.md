# Data Model: help-center

No new module-owned persistence is introduced.

## Runtime Contracts

### HelpAssistantQuestion

- `question`: sanitized user question submitted through `/ask`.
- `userId`: Telegram user id as string.
- `chatId`: Telegram chat id as string.
- `role`: Tempot runtime user role.
- `locale`: current user language code.

### HelpAssistantAnswer

- `state`: `answered`, `no-context`, or `degraded`.
- `answer`: grounded answer text or an empty string for no-context state.
- `citations`: retrieved RAG source references.
- `confidence`: retrieval confidence score from the selected source.

## External Data

The live provider reads existing vectorized documentation from the `@tempot/ai-core`
embedding storage and does not create help-center tables.
