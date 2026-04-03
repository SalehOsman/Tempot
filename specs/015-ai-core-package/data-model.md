# Data Model: AI Core (Integrated Bot Assistant)

## Entities

### `Embedding` (Drizzle Schema — exists in @tempot/database, requires dimension update)

The sole persistent entity for ai-core. Stores vector embeddings for all content types in a single table with `contentType` discriminator. Managed via Drizzle ORM (not Prisma) per ADR-017.

**Primary Key:** `id` (UUID v4, auto-generated).
**Storage:** PostgreSQL + pgvector via Drizzle ORM (`packages/database/src/drizzle/drizzle.schema.ts`).

| Field         | Type           | Description                                                          | Constraints / Validation                                                                                        |
| ------------- | -------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `id`          | `UUID` (text)  | Unique identifier                                                    | PK, auto-generated (`defaultRandom()`)                                                                          |
| `contentId`   | `text`         | Reference to the source content (module name, doc ID, user ID, etc.) | Required                                                                                                        |
| `contentType` | `text`         | Content discriminator for access control and retrieval filtering     | Required, one of: `ui-guide`, `bot-functions`, `db-schema`, `developer-docs`, `custom-knowledge`, `user-memory` |
| `vector`      | `vector(3072)` | Embedding vector from AI model                                       | Required, 3072 dimensions (updated from 768)                                                                    |
| `metadata`    | `jsonb`        | Content-type-specific metadata (see below)                           | Optional                                                                                                        |
| `createdAt`   | `timestamp`    | Creation timestamp                                                   | Auto-generated (`defaultNow()`)                                                                                 |
| `updatedAt`   | `timestamp`    | Last update timestamp                                                | Auto-generated (`defaultNow()`)                                                                                 |

**Indexes:**

- `embeddings_vector_hnsw_idx` — HNSW index via **halfvec expression cast**: `CREATE INDEX ... USING hnsw ((vector::halfvec(3072)) halfvec_cosine_ops)`. pgvector HNSW/IVFFlat indexes support max 2000 dimensions for `vector` type, but `halfvec` supports up to 4000 dimensions. Storage remains full-precision `vector(3072)`; the index casts to `halfvec(3072)` at index time. Benefits: smaller index (2 bytes vs 4 bytes per dimension), negligible precision loss for cosine similarity ranking.

**Metadata JSONB Structure** (varies by `contentType`):

| contentType        | Metadata Fields                                                                     |
| ------------------ | ----------------------------------------------------------------------------------- |
| `ui-guide`         | `{ title, source, language, chunkIndex?, totalChunks? }`                            |
| `bot-functions`    | `{ moduleName, toolName, version, language }`                                       |
| `db-schema`        | `{ tableName, moduleName, schemaVersion }`                                          |
| `developer-docs`   | `{ filePath, section?, language, chunkIndex?, totalChunks? }`                       |
| `custom-knowledge` | `{ title, uploadedBy, accessRoles: string[], language, chunkIndex?, totalChunks? }` |
| `user-memory`      | `{ userId, sessionId, summarizedAt, messageCount }`                                 |

---

### `AITool` (Runtime Interface — not persisted)

Contract for module-registered AI tools. Stored in-memory in the `ToolRegistry`. Not persisted to database.

| Property             | Type                                                  | Description                                                           |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `name`               | `string`                                              | Unique tool identifier (e.g., `users.create`)                         |
| `description`        | `string`                                              | Description for model context (what the tool does)                    |
| `parameters`         | `ZodSchema`                                           | Zod schema defining tool parameters                                   |
| `requiredPermission` | `{ action: string; subject: string }`                 | CASL permission check (e.g., `{ action: 'create', subject: 'User' }`) |
| `confirmationLevel`  | `'none' \| 'simple' \| 'detailed' \| 'escalated'`     | Write action confirmation level                                       |
| `version`            | `string`                                              | Follows module versioning                                             |
| `execute`            | `(params: unknown) => AsyncResult<unknown, AppError>` | Tool execution function                                               |

---

### `AISession` (Runtime — tracked in session-manager, not a separate table)

Represents an active AI conversation. Stored in Redis via `@tempot/session-manager`. Not a separate database table.

| Property              | Type                                                      | Description                                |
| --------------------- | --------------------------------------------------------- | ------------------------------------------ |
| `userId`              | `string`                                                  | User who started the session               |
| `isActive`            | `boolean`                                                 | Whether the session is currently active    |
| `conversationHistory` | `Array<{ role: 'user' \| 'assistant'; content: string }>` | Messages in current conversation           |
| `startedAt`           | `Date`                                                    | Session start timestamp                    |
| `messageCount`        | `number`                                                  | Messages sent (for rate limiting tracking) |

---

### Configuration Types (Runtime — from environment)

| Config Type        | Fields                                                                                                    | Used By                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------- |
| `AIConfig`         | `provider`, `embeddingModel`, `embeddingDimensions`, `confidenceThreshold`, `enabled`                     | All ai-core services      |
| `ResilienceConfig` | `circuitBreakerThreshold` (5), `circuitBreakerResetMs` (600000), `timeoutMs` (30000), `maxConcurrent` (5) | `ResilienceService`       |
| `RateLimitConfig`  | `userLimit` (20), `adminLimit` (50), `superAdminLimit` (0=unlimited), `windowMs` (86400000)               | `RateLimiterService`      |
| `ChunkingConfig`   | `chunkSizeTokens` (500), `overlapTokens` (50), `maxDocumentBytes` (10485760)                              | `ContentIngestionService` |

---

### Event Payloads (not persisted)

| Payload                        | Fields                                                                 | Event Name                   |
| ------------------------------ | ---------------------------------------------------------------------- | ---------------------------- |
| `AIServiceDegradedPayload`     | `reason`, `failureCount`, `disabledUntil: Date`, `lastError`           | `system.ai.degraded`         |
| `AIToolExecutedPayload`        | `userId`, `toolName`, `success`, `executionMs`, `tokenUsage`           | `ai-core.tool.executed`      |
| `AIConversationEndedPayload`   | `userId`, `messageCount`, `summarized`, `durationMs`                   | `ai-core.conversation.ended` |
| `AIContentIndexedPayload`      | `contentId`, `contentType`, `chunkCount`, `source: 'auto' \| 'manual'` | `ai-core.content.indexed`    |
| `ModuleToolsRegisteredPayload` | `moduleName`, `toolCount`, `toolNames: string[]`                       | `module.tools.registered`    |

---

## Relationships

- `Embedding` has **no foreign key relationships** to other Prisma/Drizzle models.
- Uses **polymorphic association** via `contentId`/`contentType` — any content source (module, document, user conversation) can store embeddings by setting these logical references.
- `AITool` is an **in-memory runtime interface** with no database backing. Tools are registered via event bus and stored in `ToolRegistry`.
- `AISession` is an **in-memory runtime type** backed by Redis via `@tempot/session-manager`. No separate database table.
- Event payloads are defined inline in `event-bus.events.ts` (structurally matching the types above) to avoid circular dependencies.

---

## Storage Mechanisms

### Content Type Access Control

Access control is enforced at query time by filtering `contentType` values based on the user's role BEFORE vector similarity search:

| contentType        | Accessible By                                      |
| ------------------ | -------------------------------------------------- |
| `ui-guide`         | User, Admin, Super Admin                           |
| `bot-functions`    | Admin, Super Admin                                 |
| `db-schema`        | Super Admin only                                   |
| `developer-docs`   | Developer (via bot + CLI)                          |
| `custom-knowledge` | Configurable per content (set by Super Admin)      |
| `user-memory`      | User's own only (filtered by `userId` in metadata) |

### Embedding Lifecycle

1. **Ingestion**: Content received (module registration, manual upload, conversation end) → sanitized (PII removed) → chunked (if large) → embedded via AI model → stored in `embeddings` table
2. **Retrieval**: Query received → embedded → filtered by allowed `contentType` + user access → cosine similarity search via HNSW index → top-K results returned
3. **Re-indexing**: When embedding model changes or dimensions change → background BullMQ job re-embeds all existing content → old embeddings replaced

### Chunk Metadata Linkage

Large documents are split into chunks. Each chunk is stored as a separate embedding row with:

```
metadata: {
  title: "Document Title",
  source: "manual",
  chunkIndex: 0,      // 0-based index of this chunk
  totalChunks: 5,      // total chunks for the parent document
  language: "ar"
}
```

All chunks share the same `contentId`, enabling full-document retrieval and deletion.

### Vector Dimension Configuration

```typescript
// packages/database/src/database.config.ts (requires update)
DB_CONFIG.VECTOR_DIMENSIONS = Number(process.env.VECTOR_DIMENSIONS) || 3072; // Updated from 768

// packages/database/src/drizzle/drizzle.schema.ts
vector: vector('vector', { dimensions: DB_CONFIG.VECTOR_DIMENSIONS }).notNull();
```

### Task Prefix Formatting (gemini-embedding-2-preview)

Optimal retrieval requires different prefixes for queries vs. documents:

| Content Type | Prefix Format                             |
| ------------ | ----------------------------------------- |
| Query        | `task: search result \| query: {content}` |
| Document     | `title: {title} \| text: {content}`       |
