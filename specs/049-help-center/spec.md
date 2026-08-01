# Feature Specification: help-center

## User Stories

### Story 1 - Open Help

Users can open contextual help from the main menu or `/help`.

### Story 2 - Ask the Help Assistant

Authorized users can open the AI assistant entry from Help and submit a
question through `/ask <question>`. The module returns a grounded answer from
the configured RAG runtime when context is available, and returns a clear
localized fallback when AI is unavailable or no relevant context is found.

## Functional Requirements

- FR-001: The module MUST expose a `/help` command.
- FR-002: The module MUST own the `help:*` callback namespace.
- FR-003: The module MUST declare its help navigation contribution in module
  configuration.
- FR-004: The module MUST expose a `/ask` command for help assistant queries.
- FR-005: The module MUST expose an AI assistant help menu action that explains
  how to submit a question.
- FR-006: The module MUST declare `hasAI: true` and `aiDegradationMode:
  graceful`.
- FR-007: The module MUST use an injected AI assistant provider instead of
  importing `@tempot/ai-core` directly.
- FR-008: The bot runtime MUST compose the injected AI assistant provider from
  the existing `@tempot/ai-core` RAG pipeline and database vector storage.
- FR-009: The assistant response MUST include citations when retrieved context
  is returned by the RAG runtime.
- FR-010: The assistant MUST return localized no-context and degraded responses
  when retrieval cannot produce a usable answer.

## Acceptance Criteria

- SC-001: Pressing the Help button opens a help page instead of the unhandled
  callback fallback.
- SC-002: Pressing the assistant action opens a localized assistant prompt with
  a back button.
- SC-003: Running `/ask <question>` calls the injected AI assistant provider
  with user id, chat id, locale, role, and question.
- SC-004: Running `/ask` without a question returns a localized usage message.
- SC-005: Running `/ask <question>` when no provider is configured returns a
  localized graceful-degradation message.

## Non-Functional Requirements

- The help page MUST render from i18n keys only.
- The assistant UI MUST follow Telegram keyboard UX button sizing rules.
- The module MUST keep AI runtime dependencies behind the bot-server
  composition boundary.
- The first activation slice MAY return the best grounded retrieved context
  snippet rather than performing generative answer synthesis.
