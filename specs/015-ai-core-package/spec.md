# Feature Specification: AI Core (Provider Abstraction)

**Feature Branch**: `015-ai-core-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional ai-core package as an abstraction layer for various AI providers as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Provider Swapping (Priority: P1)

As a developer, I want to switch from Gemini to OpenAI by simply changing an environment variable so that I can use the best model for my needs without code changes.

**Why this priority**: Fundamental architectural requirement (Rule XVIII, ADR-016) to prevent vendor lock-in.

**Independent Test**: Switching `AI_PROVIDER` to `openai` and verifying that the same `AICore.generate()` call now uses the OpenAI API.

**Acceptance Scenarios**:

1. **Given** a request to generate text, **When** `AI_PROVIDER=gemini`, **Then** the system uses the Gemini Provider implementation.
2. **Given** the same request, **When** `AI_PROVIDER=openai`, **Then** the system uses the OpenAI Provider implementation with 100% compatible output.

---

### User Story 2 - Resilient AI Operations (Priority: P1)

As a user, I want the bot to continue working even if the AI service is down so that I am never stuck in a broken conversation.

**Why this priority**: Mandatory for system reliability and "Graceful Degradation" (Rule XXXIII).

**Independent Test**: Simulating an AI API timeout/error and verifying the system triggers the `circuit-breaker` and falls back to manual mode.

**Acceptance Scenarios**:

1. **Given** 5 consecutive AI failures, **When** the 6th request arrives, **Then** the `circuit-breaker` activates, disabling AI for 10 minutes and alerting the super admin.
2. **Given** an active `circuit-breaker`, **When** the Input Engine encounters an `AIExtractorField`, **Then** it automatically switches to manual step-by-step input.

---

## Edge Cases

- **Model Incompatibility**: Moving from a 1536-dimension embedding to a 768-dimension one (Answer: Mandatory "Dual Index" migration strategy or full re-indexing required).
- **Rate Limits**: Handling AI provider throttling (Answer: Implement internal queueing or retry logic in the provider wrapper).
- **Safety Filters**: Handling "Refusal" from AI providers (Answer: The abstraction layer MUST detect and translate provider-specific refusals into a standardized `AppError`).

## Clarifications

- **Technical Constraints**: Vercel AI SDK (ADR-016). Drizzle ORM for pgvector (ADR-017).
- **Constitution Rules**: Rule XVIII (Abstraction Layer). Rule XXXIII (AI Degradation). Rule XIX (Cache) for response caching.
- **Integration Points**: Provides semantic search for `search-engine` and data extraction for `input-engine`.
- **Edge Cases**: Changing providers requires a "Dual Index" migration or full re-index. Provider refusals (safety filters) are translated to `AppError`. Circuit-breaker triggers after 5 consecutive failures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `Vercel AI SDK` as the base for all provider implementations (ADR-016).
- **FR-002**: System MUST implement the `AIProvider` interface for Gemini (default) and OpenAI.
- **FR-003**: System MUST provide a `classifier`, `extractor`, `summarizer`, and `summarizer` service.
- **FR-004**: System MUST implement `pgvector` storage via `Drizzle ORM` for all embeddings (ADR-017).
- **FR-005**: System MUST enforce `AI Degradation` modes: `graceful`, `queue`, `circuit-breaker`.
- **FR-006**: System MUST automatically cache AI responses via `cache-manager` to save costs.
- **FR-007**: System MUST support multi-modal embeddings (Text, Image, PDF) via `gemini-embedding-2-preview`.

### Key Entities

- **Embedding**: vector (float[]), contentId, contentType, metadata (JSON).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AI Provider swap must be completed in < 1 minute via `.env` change.
- **SC-002**: AI failure detection and circuit-breaker activation must be 100% accurate.
- **SC-003**: Semantic search precision (Top-1) should be > 80% for standardized test datasets.
- **SC-004**: 100% of AI operations are logged with cost and latency metadata.
