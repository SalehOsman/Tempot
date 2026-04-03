# Feature Specification: AI Core (Integrated Bot Assistant)

**Feature Branch**: `015-ai-core-package`
**Created**: 2026-03-19
**Clarified**: 2026-04-02
**Status**: Complete
**Input**: User description: "Build an integrated AI assistant for the Tempot Telegram bot — intent routing via tool calling, constrained RAG from bot knowledge, data analysis via natural language, role-aware with CASL tool filtering, multimodal embeddings, developer RAG, and CLI tools."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Natural Language Bot Control (Priority: P1)

As a user, I want to tell the assistant what I need in natural language and have it execute bot functions on my behalf so that I can use the bot without memorizing commands.

**Why this priority**: Core value proposition — transforms the bot from command-driven to intent-driven interaction.

**Independent Test**: Send "أضف مستخدم جديد اسمه أحمد" to the assistant and verify it calls the user creation tool with `name: "أحمد"`.

**Acceptance Scenarios**:

1. **Given** a user sends a natural language message via `/ai`, **When** the intent maps to an available tool, **Then** the assistant calls the tool with correct parameters and returns the result in the user's language.
2. **Given** a multi-step intent (e.g., "أنشئ فاتورة لأحمد بمبلغ 500 جنيه"), **When** the assistant resolves the intent, **Then** it executes a tool loop calling dependent tools sequentially (lookup user → create invoice) and returns the final result.
3. **Given** a write action with confirmation level `detailed`, **When** the assistant prepares the action, **Then** it shows a summary (what changes, who is affected) with [Confirm] / [Cancel] inline buttons before executing.

---

### User Story 2 - Constrained Knowledge Q&A (Priority: P1)

As a user, I want to ask questions about the bot and get accurate answers from indexed knowledge so that I can learn how to use features without contacting support.

**Why this priority**: Reduces support load and enables self-service — but MUST NOT fabricate information.

**Independent Test**: Ask "كيف أرسل فاتورة؟" and verify the answer cites indexed `ui-guide` content, not fabricated steps.

**Acceptance Scenarios**:

1. **Given** a user asks a question, **When** relevant `ui-guide` content exists in the vector store, **Then** the assistant answers citing retrieved context.
2. **Given** a user asks about something not in the knowledge base, **When** no relevant context is found (below confidence threshold), **Then** the assistant responds "لا أملك معلومات كافية للإجابة" — never fabricates.
3. **Given** a User role asks about database schema, **When** `db-schema` content type requires Super Admin access, **Then** the assistant does not retrieve that content and responds as if it doesn't exist.

---

### User Story 3 - Role-Based Tool Filtering (Priority: P1)

As a system administrator, I want the AI assistant to only offer tools the user has permission for so that users cannot discover or invoke unauthorized functions.

**Why this priority**: Security requirement — tool filtering at the model input level prevents hallucination about unavailable capabilities.

**Independent Test**: Log in as a User role, invoke `/ai`, and verify the model's tool list does not include any Admin-only tools.

**Acceptance Scenarios**:

1. **Given** a User role starts an AI session, **When** the system prepares the AI call, **Then** only tools matching the user's CASL abilities are passed to the model. The model does not know other tools exist.
2. **Given** a Super Admin role starts an AI session, **When** the system prepares the AI call, **Then** all registered tools are available.
3. **Given** a Visitor role, **When** they attempt to use `/ai`, **Then** the system returns `err(AppError('ai-core.access_denied'))` — no AI access.

---

### User Story 4 - Resilient AI Operations (Priority: P1)

As a user, I want the bot to continue working even if the AI service is down so that I am never stuck in a broken conversation.

**Why this priority**: Mandatory for system reliability (Rule XXXIII — AI Degradation).

**Independent Test**: Simulate 5 consecutive AI API failures and verify the circuit breaker activates, AI is disabled for 10 minutes, and the super admin is alerted.

**Acceptance Scenarios**:

1. **Given** 5 consecutive AI failures, **When** the 6th request arrives, **Then** the circuit breaker activates, disabling AI for 10 minutes and alerting the super admin via event bus.
2. **Given** an active circuit breaker, **When** a user sends a message to `/ai`, **Then** the system responds with a degradation message in the user's language and existing bot features continue working normally.
3. **Given** a non-urgent AI request during degradation, **When** the request is queued, **Then** it is processed when AI recovers (via BullMQ queue).

---

### User Story 5 - Developer Assistant (Priority: P2)

As a developer using the Tempot framework, I want to ask questions about the codebase and get AI-powered module reviews so that I can develop faster and catch issues early.

**Why this priority**: Developer productivity — secondary to core user-facing assistant but high value for framework adoption.

**Independent Test**: Run `pnpm ai:dev "how does the event bus work?"` and verify it returns an answer citing indexed `developer-docs` content.

**Acceptance Scenarios**:

1. **Given** a developer runs `pnpm ai:dev "question"`, **When** relevant `developer-docs` content exists, **Then** the CLI returns an answer citing retrieved context.
2. **Given** a developer runs `pnpm ai:review --module users`, **When** the module exists, **Then** the CLI checks module.config.ts completeness, discovers missing events, reviews UX compliance, checks i18n key completeness, and suggests test cases.

---

### User Story 6 - Conversation Continuity (Priority: P2)

As a user, I want the assistant to remember context from my previous conversations so that I don't have to repeat myself every session.

**Why this priority**: UX improvement — provides continuity without storing full chat logs.

**Independent Test**: Have a conversation about invoices, end the session, start a new one, and verify the assistant recalls the invoice context.

**Acceptance Scenarios**:

1. **Given** a user ends an AI session, **When** the session ends (exit command, timeout, or explicit end), **Then** the conversation is summarized and the summary is embedded and stored with the user's reference.
2. **Given** a user starts a new AI session, **When** the session begins, **Then** 3-5 relevant past summaries are retrieved via semantic search and included in the context.

---

## Edge Cases

- **Model Downtime / Circuit Breaker**: After 5 consecutive AI API failures, the circuit breaker activates for 10 minutes. During this period, all AI features return a degradation message in the user's language. The super admin is alerted via `system.ai.degraded` event. Non-urgent requests are queued for retry via BullMQ. The bot's non-AI features continue working normally. (Answer: cockatiel circuit breaker with 5-failure threshold, 10-minute reset, BullMQ queue for deferred requests, event bus alert.)
- **Daily Message Limit Exceeded**: When a user exceeds their daily AI message limit, the system returns an i18n message ("لقد تجاوزت الحد اليومي") and blocks further AI interactions until the next day. Super Admin can adjust or reset limits per user. (Answer: rate-limiter-flexible with Redis backend, configurable per role, Super Admin override via admin tool.)
- **Concurrent AI Sessions**: Only one active AI conversation per user at a time. Starting a new `/ai` session ends the previous one. The ending session is summarized before being closed. (Answer: session-manager tracks active AI session, new session triggers summarization of previous.)
- **Tool Execution Failure**: When a tool call fails during intent routing, the assistant shows an error message in the user's language and suggests the manual alternative. Full error details are recorded in the audit log. The assistant does NOT retry failed tools automatically. (Answer: tool execution wrapped in Result pattern, error surfaced via i18n, audit logged with tool name + error code + stack.)
- **RAG Content Size Limits**: Large documents are chunked before embedding. Default chunk size is ~500 tokens with configurable overlap (default 50 tokens). Maximum document size is configurable (default 10MB). Documents exceeding the limit are rejected with `AppError('ai-core.content.size_exceeded')`. (Answer: chunking service with configurable size/overlap, size validation before processing.)
- **Unauthorized Data Access via RAG**: Tool filtering makes tool-based access impossible — the model doesn't have unauthorized tools. For RAG content, each content type has role-based access rules. Content types the user cannot access are excluded from retrieval queries. If no authorized content is found, the model responds "لا أملك معلومات كافية للإجابة". (Answer: contentType-based namespace filtering in vector search, CASL check before retrieval, filtered content never reaches the model.)
- **Model Hallucination Prevention**: Constrained RAG — the model MUST base answers on retrieved context. If no relevant context is found (cosine similarity below configurable confidence threshold, default 0.7), the model says "لا أملك معلومات كافية" instead of guessing. The system prompt explicitly instructs the model to cite sources and never fabricate. (Answer: confidence threshold on retrieval, system prompt constraint, no-context fallback response.)
- **PII in Embeddings**: Never embed raw personal data (names, phone numbers, IDs). Content is sanitized before embedding — personal data is replaced with reference IDs. The `user-memory` content type stores conversation summaries, not raw transcripts. (Answer: content sanitizer strips PII before embedding, reference IDs used instead.)
- **Embedding Dimension Migration**: Current database defaults to 768 dimensions. The spec requires 3072 dimensions (gemini-embedding-2-preview). Changing dimensions requires full re-indexing — existing vectors are incompatible. Migration strategy: database migration changes the column dimension, then a background job re-embeds all existing content. (Answer: Prisma migration for column change, BullMQ batch re-embedding job, zero-downtime via dual-read during migration.)
- **Provider Switch Incompatibility**: Embedding models from different providers produce incompatible vector spaces. Switching embedding providers requires full re-indexing. This is a deployment decision, not a runtime feature. (Answer: warning in configuration docs, re-indexing job provided, no automatic fallback between embedding providers.)
- **Write Action Confirmation Timeout**: Confirmation messages expire after 5 minutes (Rule LXVII). If the user doesn't respond, the action is cancelled. Escalated confirmations (confirmation code) also expire after 5 minutes. (Answer: grammY callback query with TTL, expiry handler cancels action and notifies user.)
- **Failed Intent / Ambiguous Query**: When the assistant cannot understand user intent, it shows alternative suggestions: "هل تقصد...؟" with up to 3 options based on available tools and recent user actions. If the user rejects all suggestions, the assistant acknowledges it cannot help with that request. (Answer: AI SDK generates suggestions from tool descriptions, recent action history from session.)
- **AI Provider Safety Filter Refusal**: When the AI model refuses a request due to safety filters, the system detects the refusal and returns a standardized `AppError('ai-core.provider.refusal')` with an i18n message explaining the request could not be processed. The refusal is logged in the audit trail but does NOT trigger the circuit breaker (it is not a system failure). (Answer: provider-specific refusal detection, translated to AppError, audit logged, circuit breaker not affected.)
- **Module Tool Versioning**: Tools follow module versioning via the `version` field in `AITool`. When a module is updated and re-registers tools with a new version, outdated tool metadata in the `ToolRegistry` is replaced. If tool descriptions change, the corresponding `bot-functions` content in the vector store triggers re-indexing of that module's tool documentation. (Answer: version comparison on re-registration, stale tools replaced, re-indexing of tool descriptions via ContentIngestionService.)

## Design Decisions & Clarifications

### D1. AI as a Bot Tool, Not a Chatbot

ai-core is an assistant that works within bot boundaries only. It understands what the bot can do (via registered tools), knows the user's permissions (via CASL), and helps users use the bot effectively through natural language. It is NOT a general-purpose chatbot. The system prompt constrains the model to bot-related tasks only. Normal bot flows are never affected by AI unless a module developer explicitly integrates it.

### D2. Activation Mode — Hybrid

AI is activated via:

- Dedicated `/ai` command and inline button for full conversation mode
- Module developers can opt-in to integrate AI in specific flows via `hasAI: true` in `module.config.ts`
- Normal bot flows are NEVER affected unless explicitly integrated

### D3. Tool Registration & Discovery

Each module registers its own tools via a standard `AITool` interface. The `ToolRegistry` discovers available tools automatically at runtime via event bus subscription (`module.tools.registered`). Tool metadata includes: `name`, `description` (for model context), `parameters` (Zod schema), `requiredPermission` (CASL action + subject), `confirmationLevel` (`simple` | `detailed` | `escalated`), and `version`. Modules opt-in to AI integration — they are NOT forced.

### D4. CASL Tool Filtering at Model Input Level

Before each AI model call, the system filters tools based on the user's CASL abilities. Only permitted tools are passed to `generateText()` / tool loop. The model doesn't know other tools exist — it cannot hallucinate about unavailable capabilities. This is more secure than post-hoc filtering because the model never generates plans involving unauthorized tools.

### D5. Six RAG Content Types in a Single Vector Store

All knowledge is stored in the `embeddings` table with a `contentType` discriminator. Access control per content type:

- `ui-guide` — User, Admin, Super Admin
- `bot-functions` — Admin, Super Admin
- `db-schema` — Super Admin only
- `developer-docs` — Developer (via bot + CLI)
- `custom-knowledge` — configurable access per content (set by Super Admin)
- `user-memory` — user's own only (filtered by `userId`)

Retrieval queries filter by `contentType` based on the user's role BEFORE vector similarity search.

### D6. Three Write Action Confirmation Levels

Configurable per tool in the `AITool` registration:

- **Simple**: Brief summary of what will happen + [Confirm] [Cancel] inline keyboard
- **Detailed**: Full details (what changes, who is affected, before/after preview) + [Confirm] [Cancel]
- **Escalated**: For dangerous actions (delete, permission change) — extra 6-digit confirmation code sent to user, must be typed back to proceed

### D7. Conversation Memory Strategy

Active conversations are tracked per user session. When a session ends (user exits `/ai` mode, session timeout, or explicit end command), the conversation is summarized by the AI model. The summary is embedded and stored in the `embeddings` table with `contentType: 'user-memory'` and the user's ID. New sessions retrieve 3-5 relevant past summaries via semantic search. This gives continuity without storing full chat logs.

### D8. Vercel AI SDK v6 as Thin Orchestration Layer (ADR-031)

Per ADR-031, ai-core uses Vercel AI SDK v6 built-in features instead of hand-rolled abstractions:

- `createProviderRegistry()` for provider management
- `Output.choice()` and `Output.object()` for structured extraction
- `LanguageModelMiddleware` for caching and resilience cross-cutting concerns
- Built-in `usage` object for token tracking
- Built-in OpenTelemetry for observability
- Tool calling + multi-step agent loops for intent routing

> **Note**: Current project uses AI SDK v4.x. Upgrade to v6.x is required. A new ADR should be created for the upgrade decision covering breaking changes.

### D9. Resilience via cockatiel Library

Resilience is handled by the `cockatiel` library (not hand-rolled):

- Circuit breaker: 5-failure threshold, 10-minute reset
- Retry: exponential backoff for transient errors
- Timeout: configurable per operation (default 30s for generation, 10s for embedding)
- Bulkhead: limit concurrent AI API calls (default 5)
- Fallback: return degradation message when circuit is open

### D10. Langfuse for AI Observability

Langfuse provides AI-specific observability alongside existing Sentry error tracking. Clear separation:

- **Langfuse**: AI traces, token usage, cost tracking, prompt management, conversation analytics
- **Sentry**: General application errors, performance monitoring

Integration via `@langfuse/otel` with Vercel AI SDK's OpenTelemetry support.

### D11. Multimodal Embeddings via gemini-embedding-2-preview

Supports embedding text, images, video (up to 128s), audio, and PDF documents. All modalities map to the same 3072-dimension vector space for cross-modal search. Task prefixes for optimal retrieval:

- Queries: `task: search result | query: {content}`
- Documents: `title: {title} | text: {content}`

### D12. Cost Control via Rate Limiting

Daily message limit per user, configurable per role via `rate-limiter-flexible` with Redis backend. Default limits:

- User: 20 messages/day
- Admin: 50 messages/day
- Super Admin: unlimited

When limit is reached: clear i18n message, no more AI until the next day. Super Admin can adjust limits.

### D13. Content Ingestion — Automatic and Manual

- **Automatic**: Module metadata (functions, UI text, configuration) is indexed when modules register via `module.registered` event
- **Automatic**: Prisma schema changes trigger schema re-indexing
- **Manual**: Super Admin uploads custom knowledge documents (PDF, text) via storage-engine
- **Automatic**: Conversation summaries stored per user on session end

### Cross-Package Modifications

- `packages/database/src/database.config.ts`: Update `VECTOR_DIMENSIONS` default from 768 to 3072
- `packages/database/src/drizzle/schema/embeddings.table.ts`: Ensure `embeddings` table vector column supports 3072 dimensions (Drizzle ORM — pgvector columns are managed via Drizzle, not Prisma; see ADR-017)
- `packages/event-bus/src/event-bus.events.ts`: Register ai-core events in `TempotEvents` interface
- `docs/architecture/adr/`: New ADR for AI SDK v4→v6 upgrade decision

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an `AIProviderFactory` using Vercel AI SDK v6 `createProviderRegistry()` to create provider instances. Default provider: Gemini (`@ai-sdk/google`). Alternative: OpenAI (`@ai-sdk/openai`). Provider is selected via `TEMPOT_AI_PROVIDER` environment variable (ADR-016, ADR-031, Rule XVIII).
- **FR-002**: System MUST provide an `EmbeddingService` that extends `DrizzleVectorRepository` for multimodal embeddings via `gemini-embedding-2-preview` (default, configurable). Supports text, image, video, audio, and PDF content. Uses task prefix formatting for queries vs. documents. Stores embeddings with `contentType` discriminator. Dimensions configurable (default 3072).
- **FR-003**: System MUST provide a `ToolRegistry` where modules register AI tools via a standard `AITool` interface. Each tool declares: `name`, `description`, `parameters` (Zod schema), `requiredPermission` (CASL action + subject), `confirmationLevel`, and `version`. Tools are discovered automatically at runtime via event bus subscription.
- **FR-004**: System MUST provide a `CASLToolFilter` that filters registered tools based on the current user's CASL abilities before every AI model call. Only permitted tools are passed to the model. The model never receives information about tools the user cannot access.
- **FR-005**: System MUST provide a `RAGPipeline` for constrained retrieval-augmented generation. The pipeline retrieves relevant context from pgvector based on cosine similarity with configurable confidence threshold (default 0.7). Content is filtered by `contentType` and user role before retrieval. When no relevant context is found, the system responds "لا أملك معلومات كافية للإجابة" via i18n. _(Note: Content ingestion — chunking, embedding, and storing — is the responsibility of `ContentIngestionService` (FR-013), not RAGPipeline.)_
- **FR-006**: System MUST provide an `IntentRouter` using AI SDK v6 tool calling and multi-step agent loops. The router understands user intent from natural language, selects appropriate tools, and executes them. For write actions, it invokes the `ConfirmationEngine` before execution.
- **FR-007**: System MUST provide a `ConfirmationEngine` with three configurable confirmation levels for write actions: `simple` (summary + confirm/cancel), `detailed` (full details + confirm/cancel), and `escalated` (extra confirmation code). Confirmation messages expire after 5 minutes (Rule LXVII).
- **FR-008**: System MUST provide a `ResilienceService` using `cockatiel` library implementing circuit breaker (5 failures, 10-minute reset), retry (exponential backoff), timeout (configurable), and bulkhead (configurable concurrency limit). When circuit is open, AI features return degradation message and non-urgent requests are queued via BullMQ.
- **FR-009**: System MUST provide a `RateLimiterService` using `rate-limiter-flexible` with Redis backend for daily per-user AI message limits. Limits are configurable per role. When exceeded, returns i18n message. Super Admin can adjust or reset limits.
- **FR-010**: System MUST provide a `ConversationMemory` service that summarizes conversations on session end, embeds summaries in pgvector with `contentType: 'user-memory'` and userId, and retrieves 3-5 relevant past summaries via semantic search for new sessions.
- **FR-011**: System MUST provide an `AuditService` using Langfuse + OpenTelemetry for logging every AI interaction: who asked, what was asked, what was answered, which tools were called, token usage, cost, and latency. Super Admin can view AI usage reports.
- **FR-012**: System MUST provide per-role system prompts: Super Admin ("مساعد إداري شامل"), Admin ("مساعد إداري مقيد"), User ("مساعد شخصي — ممنوع بيانات الآخرين"). System prompts are managed via i18n and constrain the model to bot-related tasks only.
- **FR-013**: System MUST provide a `ContentIngestionService` for automatic indexing (module metadata on registration, Prisma schema changes) and manual upload (Super Admin uploads via storage-engine). Content is chunked (configurable, default ~500 tokens with 50-token overlap), sanitized (PII removed), and embedded.
- **FR-014**: System MUST provide alternative suggestions when intent cannot be resolved: "هل تقصد...؟" with up to 3 options based on available tools and recent user actions.
- **FR-015**: System MUST provide a `TelegramAssistantUI` with `/ai` command and inline button for entering conversation mode. Uses grammY conversation for multi-turn interaction. Supports one active AI conversation per user.
- **FR-016**: System MUST provide developer assistant tools: `pnpm ai:dev "question"` for codebase questions (RAG from `developer-docs` content type) and `pnpm ai:review --module {name}` for AI-powered module review (config completeness, missing events, UX compliance, i18n completeness, test suggestions).
- **FR-017**: System MUST support a `TEMPOT_AI` environment variable (`true`/`false`, default `true`) to enable/disable the ai-core package per Constitution Rule XVI (Pluggable Architecture). When disabled, all AI service methods return `err(AppError('ai-core.disabled'))`.
- **FR-018**: System MUST respond in the user's configured language (via i18n settings). Arabic is the primary language, English secondary. RAG content is stored in its original language; queries use the user's language.
- **FR-019**: System MUST provide `AICache` middleware using cache-manager to cache identical AI responses. Cache key is computed from prompt hash + tool set hash + role. TTL configurable (default 24 hours).

### Key Entities

#### Embedding (Drizzle Schema — already exists in @tempot/database)

```typescript
// packages/database/src/schema/embeddings.ts (existing, requires dimension update)
export const embeddings = pgTable('embeddings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  contentId: text('content_id').notNull(),
  contentType: text('content_type').notNull(), // 'ui-guide' | 'bot-functions' | 'db-schema' | 'developer-docs' | 'custom-knowledge' | 'user-memory'
  vector: vector('vector', { dimensions: 3072 }).notNull(), // Updated from 768
  metadata: jsonb('metadata'), // { title, source, userId, chunkIndex, totalChunks, language, ... }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// HNSW index on halfvec expression for 3072-dim vectors (pgvector max 2000 for vector type)
export const embeddingIndex = index('embedding_hnsw_idx').using(
  'hnsw',
  sql`(vector::halfvec(3072)) halfvec_cosine_ops`,
);
```

> **Implementation Note**: The `contentType` field already exists. The `metadata` JSONB field stores content-type-specific metadata including `userId` (for `user-memory`), `chunkIndex`/`totalChunks` (for chunked documents), `title`, `source`, and `language`. No new Prisma models are needed — ai-core extends the existing `embeddings` table via Drizzle.

#### AITool (Runtime Interface — not persisted)

```typescript
interface AITool {
  name: string; // Unique tool identifier (e.g., 'users.create')
  description: string; // Description for model context
  parameters: ZodSchema; // Zod schema for tool parameters
  requiredPermission: {
    // CASL permission check
    action: string; // e.g., 'create'
    subject: string; // e.g., 'User'
  };
  confirmationLevel: 'none' | 'simple' | 'detailed' | 'escalated';
  version: string; // Follows module versioning
  execute: (params: unknown) => AsyncResult<unknown, AppError>;
}
```

#### AISession (Runtime — tracked in session-manager, not a separate table)

```typescript
interface AISession {
  userId: string;
  isActive: boolean;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  startedAt: Date;
  messageCount: number; // For rate limiting tracking
}
```

### Event Payloads

```typescript
// Registered in packages/event-bus/src/event-bus.events.ts TempotEvents interface

// system.ai.degraded — circuit breaker activated
interface AIServiceDegradedPayload {
  reason: string;
  failureCount: number;
  disabledUntil: Date;
  lastError: string;
}

// ai-core.tool.executed — tool was called by assistant
interface AIToolExecutedPayload {
  userId: string;
  toolName: string;
  success: boolean;
  executionMs: number;
  tokenUsage: number;
}

// ai-core.conversation.ended — session summarized
interface AIConversationEndedPayload {
  userId: string;
  messageCount: number;
  summarized: boolean;
  durationMs: number;
}

// ai-core.content.indexed — new content added to vector store
interface AIContentIndexedPayload {
  contentId: string;
  contentType: string;
  chunkCount: number;
  source: string; // 'auto' | 'manual'
}

// module.tools.registered — module registers its AI tools
interface ModuleToolsRegisteredPayload {
  moduleName: string;
  toolCount: number;
  toolNames: string[];
}
```

---

## Non-Functional Requirements

- **NFR-001**: AI response latency < 5s for intent routing (tool selection + execution), excluding external API latency.
- **NFR-002**: Embedding generation < 500ms per text chunk (excluding API latency).
- **NFR-003**: Vector similarity search < 100ms for up to 100K embeddings (HNSW index).
- **NFR-004**: Provider switch (Gemini ↔ OpenAI) requires ZERO code changes — configuration only via `TEMPOT_AI_PROVIDER` env var.
- **NFR-005**: Circuit breaker activation < 1ms after threshold reached.
- **NFR-006**: Conversation summarization < 3s per session.
- **NFR-007**: All AI operations MUST be auditable — 100% of interactions logged with cost, latency, and token metadata via Langfuse.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: AI provider swap completed via `.env` change with zero code changes (NFR-004).
- **SC-002**: Circuit breaker activates after exactly 5 consecutive failures and disables AI for 10 minutes.
- **SC-003**: RAG retrieval precision (Top-3) > 80% for standardized test queries against indexed bot knowledge.
- **SC-004**: 100% of AI operations are logged with cost, latency, and token metadata (NFR-007).
- **SC-005**: CASL tool filtering produces zero unauthorized tool access — model never receives tools the user cannot use.
- **SC-006**: Daily rate limiting enforced per role with zero bypass — limit exceeded returns i18n message.
- **SC-007**: Conversation memory retrieves relevant past context in new sessions (semantic search recall > 70%).
