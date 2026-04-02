# AI Core Design — Technical Design Deepening

**Date:** 2026-04-02
**Feature:** 015-ai-core-package
**Spec:** `specs/015-ai-core-package/spec.md` (Complete, 384 lines)
**Plan:** `specs/015-ai-core-package/plan.md` (2068 lines, 24 tasks)

This document deepens the technical design for 6 concerns identified during the brainstorming phase. All decisions here supplement (not replace) the SpecKit artifacts.

---

## Design Concern 1: Drizzle NodePgDatabase Instance for EmbeddingService

### Problem

`EmbeddingService` extends `DrizzleVectorRepository`, which requires a `NodePgDatabase` in its constructor. There is no `drizzle.client.ts` in `@tempot/database` — the database package exports schemas and base repositories but leaves client creation to consumers.

### Decision: Constructor Injection (No Factory in ai-core)

`EmbeddingService` receives `NodePgDatabase` as its first constructor argument, passing it to `super(db)`. The consuming application (bot bootstrap or DI container) creates the Drizzle client from an existing `pg.Pool`.

```typescript
// EmbeddingService constructor signature:
constructor(
  db: NodePgDatabase,       // Consumer provides this
  config: AIConfig,
  resilience: ResilienceService,
  registry: ProviderRegistry,
)
```

**Rationale:**

- Follows the existing `DrizzleVectorRepository` pattern exactly
- ai-core does NOT own the database connection — separation of concerns
- Unit tests mock `db` entirely — no real Drizzle client needed
- No new Drizzle client factory code in ai-core

**Consumer usage example** (NOT in ai-core — in bot bootstrap):

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const embeddingService = new EmbeddingService(db, config, resilience, registry);
```

---

## Design Concern 2: ToolRegistry Version Conflict on Re-Registration

### Problem

When a module re-registers tools (e.g., after update), the spec says "stale tools replaced." The plan uses `Map.set()` which overwrites individual tools by name, but doesn't handle tool removal (if a module drops a tool in a new version).

### Decision: Full Replace Per Module

On `module.tools.registered` event, remove ALL tools from that module, then register the new set. A reverse index (`toolsByModule: Map<string, Set<string>>`) tracks which tools belong to which module.

```typescript
private readonly tools: Map<string, AITool> = new Map();
private readonly toolsByModule: Map<string, Set<string>> = new Map();

handleToolRegistration(payload: { moduleName: string; tools: AITool[] }): void {
  // 1. Remove all existing tools from this module
  const existing = this.toolsByModule.get(payload.moduleName);
  if (existing) {
    for (const name of existing) {
      this.tools.delete(name);
    }
  }

  // 2. Register new tools
  const newNames = new Set<string>();
  for (const tool of payload.tools) {
    this.tools.set(tool.name, tool);
    newNames.add(tool.name);
  }
  this.toolsByModule.set(payload.moduleName, newNames);

  // 3. Log the update
  this.logger.info({
    message: 'Module tools registered',
    moduleName: payload.moduleName,
    toolCount: payload.tools.length,
    toolNames: [...newNames],
  });
}
```

**Rationale:**

- Prevents orphaned tools when a module removes a tool in a new version
- Full replace is idempotent — registering the same tools twice is a no-op
- The reverse index adds minimal overhead (one Set per module)
- Edge case: if module A and module B both register a tool with the same name, last-write-wins (acceptable — tool names include module prefix, e.g., `users.create`)

---

## Design Concern 3: AICache Middleware Key Computation

### Problem

The cache key must be deterministic, collision-resistant, and capture all dimensions that affect the response (prompt, tools, role).

### Decision: SHA-256 Hash of Prompt + Sorted Tool Names

```typescript
import { createHash } from 'node:crypto';

function computeCacheKey(params: Record<string, unknown>): string {
  const hash = createHash('sha256');
  // Prompt captures system prompt (includes role) + user message + RAG context
  hash.update(JSON.stringify(params.prompt ?? ''));
  // Tool names sorted for determinism — schemas don't change between calls
  const toolNames = Object.keys((params.tools as Record<string, unknown>) ?? {}).sort();
  hash.update(JSON.stringify(toolNames));
  return `ai:cache:${hash.digest('hex').slice(0, 16)}`;
}
```

**Key decisions:**

- `node:crypto` — built-in, no extra dependency
- Truncate to 16 hex chars (64 bits) — negligible collision probability at our scale
- Tool names only (not full schemas) — schemas are static per tool version
- Role is implicit — the system prompt (part of `params.prompt`) already includes role-specific text
- `wrapGenerate` only — Telegram doesn't support streaming (deferred feature)
- Default TTL: 24 hours (configurable via `AI_CACHE_TTL_MS` env var)

---

## Design Concern 4: ConfirmationEngine and grammY Callback Queries

### Problem

grammY inline keyboard callback data has a 64-byte limit. The ConfirmationEngine needs to map callback data to a `PendingConfirmation`. Escalated confirmations require a 6-digit code typed as a regular message.

### Decision: Prefixed UUID Callback Data + Lazy Expiry

**Callback data format:**

```
ai:c:{uuid}   — confirm (5 + 36 = 41 chars, within 64-byte limit)
ai:x:{uuid}   — cancel  (5 + 36 = 41 chars, within 64-byte limit)
```

**Inline keyboard construction** (in TelegramAssistantUI):

```typescript
const keyboard = new InlineKeyboard()
  .text('تأكيد', `ai:c:${confirmation.id}`)
  .text('إلغاء', `ai:x:${confirmation.id}`);
```

**Timeout handling:**

- `PendingConfirmation.expiresAt` = creation time + 5 minutes (Rule LXVII)
- `cleanExpired()` runs lazily on every `createConfirmation()` and `confirm()` call
- No background timer — expired entries are cleaned on access
- When a user clicks an expired button, `confirm()` returns `err(AppError('ai-core.confirmation.expired'))`

**Escalated confirmation flow:**

1. Assistant shows message: "هذا إجراء حساس. أدخل الرمز: XXXXXX"
2. User types the 6-digit code as a regular text message
3. `TelegramAssistantUI` in conversation mode catches the next message
4. Calls `confirmationEngine.confirm(id, userId, code)`
5. If wrong code: `err(AppError('ai-core.confirmation.code_invalid'))`

**Rationale:**

- UUID fits in callback data with room to spare
- Lazy cleanup avoids background timers and their lifecycle management
- Escalated flow uses grammY's conversation mode (already part of the TelegramAssistantUI design) — no extra infrastructure

---

## Design Concern 5: Token Counting for Chunking

### Problem

`ContentIngestionService` chunks documents at ~500 tokens with 50-token overlap. Without `js-tiktoken`, how to estimate token count?

### Decision: Character-Based Approximation (4 chars/token)

```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

**Rationale:**

- Chunking is a coarse operation — 10-20% inaccuracy is acceptable
- Average token length: ~4 chars for English, ~2-3 chars for Arabic characters (but Arabic words are shorter, balancing out)
- The embedding model's limit (8192 tokens for gemini-embedding-2-preview) is 16x larger than our 500-token chunks — there's massive headroom
- `js-tiktoken` would add a dependency for marginal precision gain
- If precision becomes critical later, `js-tiktoken` can be added without changing the `ChunkingConfig` API — only the estimation function changes

**Implementation in ContentIngestionService.chunkContent():**

```typescript
chunkContent(text: string, metadata: Record<string, unknown>): ContentChunk[] {
  const chunkSizeChars = this.chunkingConfig.chunkSizeTokens * 4;
  const overlapChars = this.chunkingConfig.overlapTokens * 4;
  const chunks: ContentChunk[] = [];

  let start = 0;
  while (start < text.length) {
    // Find a word boundary near chunkSizeChars
    let end = Math.min(start + chunkSizeChars, text.length);
    if (end < text.length) {
      // Back up to last space to avoid splitting words
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }

    chunks.push({
      text: text.slice(start, end),
      chunkIndex: chunks.length,
      totalChunks: 0, // Set after loop
      metadata,
    });

    start = end - overlapChars;
    if (start >= text.length || end === text.length) break;
  }

  for (const chunk of chunks) {
    chunk.totalChunks = chunks.length;
  }

  return chunks;
}
```

This is a refinement over the plan's word-based approach — character-based with word-boundary awareness is more predictable.

---

## Design Concern 6: LanguageModelMiddleware Composition with Provider Registry

### Problem

How are `LanguageModelMiddleware` instances (caching, resilience telemetry) composed and attached to models from `createProviderRegistry()`?

### Decision: wrapLanguageModel() at Model Retrieval Time

AI SDK v6 provides `wrapLanguageModel()` to apply middleware. Middleware wraps the model, not the registry.

```typescript
import { wrapLanguageModel } from 'ai';

// Get base model from registry:
const baseModel = registry.languageModel(modelId);

// Wrap with middleware chain (innermost applied first):
const wrappedModel = wrapLanguageModel({
  model: wrapLanguageModel({
    model: baseModel,
    middleware: cacheMiddleware, // Check cache first
  }),
  middleware: telemetryMiddleware, // Log all calls (including cache hits)
});
```

**Helper in AIProviderFactory:**

```typescript
export function getWrappedModel(
  registry: ProviderRegistry,
  modelId: string,
  middlewares: LanguageModelMiddleware[],
): LanguageModel {
  let model = registry.languageModel(modelId);
  for (const mw of middlewares) {
    model = wrapLanguageModel({ model, middleware: mw });
  }
  return model;
}
```

**Middleware application order:**

1. Cache middleware (innermost) — avoid API calls for cached responses
2. Telemetry middleware (outermost) — log all calls including cache hits

**Where wrapping happens:**

- `IntentRouter` wraps the chat model on each `route()` call (because tool set varies per user)
- `EmbeddingService` uses the embedding model directly (no `LanguageModelMiddleware` for embeddings — the AI SDK's `embed()` function uses `EmbeddingModel`, not `LanguageModel`)
- `ConversationMemory` wraps the chat model for summarization (no tools, just generation)

**Rationale:**

- Per-call wrapping enables dynamic middleware composition (e.g., different cache TTLs for different operations)
- `wrapLanguageModel` is the SDK's recommended approach — not a hack
- Embedding calls (`embed()`) don't use `LanguageModelMiddleware` — resilience for embeddings is handled by `ResilienceService.executeEmbedding()` directly

---

## Summary

| Concern                    | Decision                                                         | Key Rationale                                        |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| 1. Drizzle DB instance     | Constructor injection                                            | Follows DrizzleVectorRepository pattern              |
| 2. Tool version conflicts  | Full replace per module + reverse index                          | Prevents orphaned tools                              |
| 3. AICache key computation | SHA-256 of prompt + sorted tool names, truncated to 16 hex chars | Deterministic, collision-resistant, uses node:crypto |
| 4. Confirmation + grammY   | `ai:c:{uuid}` / `ai:x:{uuid}` callback data, lazy expiry         | Fits 64-byte limit, no background timers             |
| 5. Token counting          | Character approximation (4 chars/token)                          | Sufficient for chunking, no extra dependency         |
| 6. Middleware composition  | `wrapLanguageModel()` per call, helper in factory                | SDK-recommended, dynamic composition                 |
