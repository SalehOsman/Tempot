> **Superseded Notice**: This plan reflects the design intent before implementation.
> Subsequent design decisions are documented in `research.md` and the final task breakdown
> is in `tasks.md`. Where this plan diverges from `tasks.md` or `research.md`, the latter
> documents take precedence.

# Implementation Plan: AI Core — Integrated Bot Assistant (015)

**Spec**: `specs/015-ai-core-package/spec.md` (Complete)
**Created**: 2026-04-02
**Dependencies**: `@tempot/shared`, `@tempot/database`, `@tempot/event-bus`, `@tempot/logger`
**New External Dependencies**: `ai` (v6.x), `@ai-sdk/google`, `@ai-sdk/openai`, `cockatiel`, `rate-limiter-flexible`, `langfuse`, `js-tiktoken` (optional), `zod`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TelegramAssistantUI                              │
│  (/ai command, inline button, conversation mode via grammY)            │
├──────────┬──────────────┬───────────────┬──────────┬───────────────────┤
│          │              │               │          │                   │
│  IntentRouter    ConfirmationEngine  ConversationMemory  AlternativeSuggestions │
│  (AI SDK v6      (3 levels:          (summarize +       ("هل تقصد...؟"         │
│   tool calling    simple/detailed/    embed on end,       3 suggestions)        │
│   + agent loop)   escalated)          retrieve on start)                       │
├──────────┴──────────────┴───────────────┴──────────┴───────────────────┤
│                                                                       │
│  ToolRegistry          CASLToolFilter       RoleSystemPrompts         │
│  (event-driven          (filter by CASL      (per-role prompts        │
│   tool discovery)        before model call)   via i18n)               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  RAGPipeline          ContentIngestionService       AICache           │
│  (constrained RAG:     (chunk + sanitize +           (LanguageModel   │
│   contentType filter    embed + store)                Middleware)      │
│   + confidence threshold)                                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  AIProviderFactory     EmbeddingService       AuditService            │
│  (createProvider       (extends Drizzle       (Langfuse + OTel)       │
│   Registry())          VectorRepository)                              │
├──────────┬──────────────┬───────────────┬─────────────────────────────┤
│          │              │               │                             │
│  ResilienceService   RateLimiterService  AIConfig                    │
│  (cockatiel:          (rate-limiter-     (env-based config)          │
│   circuit breaker      flexible +                                    │
│   + retry + timeout    Redis)                                        │
│   + bulkhead)                                                        │
├──────────┴──────────────┴───────────────┴─────────────────────────────┤
│                                                                       │
│  DeveloperRAG          CLIAssistant                                   │
│  (pnpm ai:dev          (pnpm ai:review                                │
│   "question")           --module {name})                              │
└───────────────────────────────────────────────────────────────────────┘
```

**Three Phases:**

- **Phase 1A — Foundation**: Package scaffolding, types, AIProviderFactory, AIConfig, ResilienceService, EmbeddingService, AICache middleware, RateLimiterService, AuditService, Pluggable Toggle
- **Phase 1B — Intelligence**: RAGPipeline, ContentIngestionService, ToolRegistry, CASLToolFilter, RoleSystemPrompts, IntentRouter, ConfirmationEngine
- **Phase 1C — Interaction + Developer**: TelegramAssistantUI, ConversationMemory, AlternativeSuggestions, DeveloperRAG, CLIAssistant

---

## Task 0 — Package Scaffolding

### Files Created

- `packages/ai-core/package.json`
- `packages/ai-core/tsconfig.json`
- `packages/ai-core/.gitignore`
- `packages/ai-core/vitest.config.ts`
- `packages/ai-core/src/index.ts` (empty barrel)

### package.json

```jsonc
{
  "name": "@tempot/ai-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts",
    },
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
  },
  "dependencies": {
    "neverthrow": "8.2.0",
    "@tempot/shared": "workspace:*",
    "@tempot/database": "workspace:*",
    "@tempot/event-bus": "workspace:*",
    "@tempot/logger": "workspace:*",
    "ai": "^6.0.0",
    "@ai-sdk/google": "^1.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "cockatiel": "^3.0.0",
    "rate-limiter-flexible": "^5.0.0",
    "langfuse": "^3.0.0",
    "zod": "^3.0.0",
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vitest": "4.1.0",
  },
}
```

### 10-Point Checklist

All items from `docs/developer/package-creation-checklist.md` must pass before first code commit.

---

## Task 1 — Type Definitions & Contracts

### FR Covered: FR-001, FR-003, FR-008, FR-009, FR-017

### Files

- `src/ai-core.types.ts` — Core type definitions
- `src/ai-core.contracts.ts` — Service interfaces (structural DI)
- `src/ai-core.errors.ts` — Error code constants

### Types (`src/ai-core.types.ts`)

```typescript
import type { ZodSchema } from 'zod';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** AI provider identifier */
export type AIProviderType = 'gemini' | 'openai';

/** RAG content type discriminator */
export type AIContentType =
  | 'ui-guide'
  | 'bot-functions'
  | 'db-schema'
  | 'developer-docs'
  | 'custom-knowledge'
  | 'user-memory';

/** Write action confirmation level */
export type ConfirmationLevel = 'none' | 'simple' | 'detailed' | 'escalated';

/** AI degradation mode (from module.config.ts) */
export type AIDegradationMode = 'graceful' | 'queue' | 'disable';

/** Configuration for ai-core */
export interface AIConfig {
  enabled: boolean; // TEMPOT_AI env var, default true
  provider: AIProviderType; // TEMPOT_AI_PROVIDER env var, default 'gemini'
  embeddingModel: string; // AI_EMBEDDING_MODEL env var
  embeddingDimensions: number; // AI_EMBEDDING_DIMENSIONS env var, default 3072
  confidenceThreshold: number; // RAG confidence threshold, default 0.7
  generationTimeoutMs: number; // Generation timeout, default 30000
  embeddingTimeoutMs: number; // Embedding timeout, default 10000
}

/** Resilience configuration */
export interface ResilienceConfig {
  circuitBreakerThreshold: number; // Default 5
  circuitBreakerResetMs: number; // Default 600000 (10 minutes)
  retryMaxAttempts: number; // Default 3
  timeoutMs: number; // Default 30000
  maxConcurrent: number; // Bulkhead limit, default 5
}

/** Rate limiting configuration */
export interface RateLimitConfig {
  userLimit: number; // Default 20 messages/day
  adminLimit: number; // Default 50 messages/day
  superAdminLimit: number; // Default 0 = unlimited
  windowMs: number; // Default 86400000 (24 hours)
}

/** Content chunking configuration */
export interface ChunkingConfig {
  chunkSizeTokens: number; // Default 500
  overlapTokens: number; // Default 50
  maxDocumentBytes: number; // Default 10485760 (10MB)
}

/** AI tool interface — registered by modules */
export interface AITool {
  name: string;
  description: string;
  parameters: ZodSchema;
  requiredPermission: {
    action: string;
    subject: string;
  };
  confirmationLevel: ConfirmationLevel;
  version: string;
  execute: (params: unknown) => AsyncResult<unknown, AppError>;
}

/** AI session state — stored in Redis via session-manager */
export interface AISession {
  userId: string;
  isActive: boolean;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  startedAt: Date;
  messageCount: number;
}

/** Content to be embedded */
export interface EmbeddingInput {
  contentId: string;
  contentType: AIContentType;
  content: string | Buffer; // text or binary (image, PDF, audio, video)
  metadata?: Record<string, unknown>;
}

/** Embedding search options */
export interface EmbeddingSearchOptions {
  query: string | Buffer;
  contentTypes: AIContentType[]; // Pre-filtered by access control
  limit?: number; // Default 5
  confidenceThreshold?: number; // Override default 0.7
}

/** Embedding search result */
export interface EmbeddingSearchResult {
  contentId: string;
  contentType: AIContentType;
  score: number; // Cosine similarity score
  metadata: Record<string, unknown> | null;
}

/** Chunk result from content chunking */
export interface ContentChunk {
  text: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: Record<string, unknown>;
}

/** Default configuration values */
export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: true,
  provider: 'gemini',
  embeddingModel: 'gemini-embedding-2-preview',
  embeddingDimensions: 3072,
  confidenceThreshold: 0.7,
  generationTimeoutMs: 30_000,
  embeddingTimeoutMs: 10_000,
};

export const DEFAULT_RESILIENCE_CONFIG: ResilienceConfig = {
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 600_000,
  retryMaxAttempts: 3,
  timeoutMs: 30_000,
  maxConcurrent: 5,
};

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  userLimit: 20,
  adminLimit: 50,
  superAdminLimit: 0,
  windowMs: 86_400_000,
};

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  chunkSizeTokens: 500,
  overlapTokens: 50,
  maxDocumentBytes: 10_485_760,
};
```

### Contracts (`src/ai-core.contracts.ts`)

Structural interfaces for dependency injection. Prevents circular dependencies (Research Decision 12).

```typescript
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** Structural interface for logger dependency */
export interface AILogger {
  info: (data: object) => void;
  warn: (data: object) => void;
  error: (data: object) => void;
  debug: (data: object) => void;
}

/** Structural interface for event bus dependency */
export interface AIEventBus {
  publish: (eventName: string, payload: unknown) => AsyncResult<void, AppError>;
  subscribe: (eventName: string, handler: (payload: unknown) => void) => void;
}

/** Structural interface for cache dependency */
export interface AICache {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
}

/** Structural interface for CASL ability check */
export interface AIAbilityChecker {
  can: (action: string, subject: string) => boolean;
}
```

### Error Codes (`src/ai-core.errors.ts`)

```typescript
/** Hierarchical error codes for ai-core module (Rule XXII) */
export const AI_ERRORS = {
  // Package-level
  DISABLED: 'ai-core.disabled',
  ACCESS_DENIED: 'ai-core.access_denied',

  // Provider errors
  PROVIDER_UNAVAILABLE: 'ai-core.provider.unavailable',
  PROVIDER_AUTH_FAILED: 'ai-core.provider.auth_failed',
  PROVIDER_REFUSAL: 'ai-core.provider.refusal',
  PROVIDER_TIMEOUT: 'ai-core.provider.timeout',
  PROVIDER_UNKNOWN: 'ai-core.provider.unknown',

  // Resilience errors
  CIRCUIT_OPEN: 'ai-core.resilience.circuit_open',
  RATE_LIMITED: 'ai-core.resilience.rate_limited',
  BULKHEAD_FULL: 'ai-core.resilience.bulkhead_full',

  // Embedding errors
  EMBEDDING_FAILED: 'ai-core.embedding.failed',
  EMBEDDING_DIMENSION_MISMATCH: 'ai-core.embedding.dimension_mismatch',

  // Content errors
  CONTENT_SIZE_EXCEEDED: 'ai-core.content.size_exceeded',
  CONTENT_TYPE_INVALID: 'ai-core.content.type_invalid',
  CONTENT_CHUNK_FAILED: 'ai-core.content.chunk_failed',
  CONTENT_SANITIZE_FAILED: 'ai-core.content.sanitize_failed',

  // RAG errors
  RAG_NO_RESULTS: 'ai-core.rag.no_results',
  RAG_SEARCH_FAILED: 'ai-core.rag.search_failed',

  // Tool errors
  TOOL_NOT_FOUND: 'ai-core.tool.not_found',
  TOOL_EXECUTION_FAILED: 'ai-core.tool.execution_failed',
  TOOL_UNAUTHORIZED: 'ai-core.tool.unauthorized',

  // Confirmation errors
  CONFIRMATION_EXPIRED: 'ai-core.confirmation.expired',
  CONFIRMATION_REJECTED: 'ai-core.confirmation.rejected',
  CONFIRMATION_CODE_INVALID: 'ai-core.confirmation.code_invalid',

  // Conversation errors
  CONVERSATION_ACTIVE: 'ai-core.conversation.already_active',
  CONVERSATION_NOT_FOUND: 'ai-core.conversation.not_found',
  SUMMARIZATION_FAILED: 'ai-core.conversation.summarization_failed',

  // Audit errors
  AUDIT_LOG_FAILED: 'ai-core.audit.log_failed',

  // Event emission (warning-level, not returned to callers)
  EVENT_PUBLISH_FAILED: 'ai-core.event.publish_failed',
} as const;
```

---

## Task 2 — AIConfig Service

### FR Covered: FR-001, FR-017

### File: `src/ai-core.config.ts`

Reads configuration from environment variables. Returns `Result<AIConfig, AppError>` for validation.

```typescript
import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type {
  AIConfig,
  ResilienceConfig,
  RateLimitConfig,
  ChunkingConfig,
} from './ai-core.types.js';
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_RESILIENCE_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_CHUNKING_CONFIG,
} from './ai-core.types.js';
import { AI_ERRORS } from './ai-core.errors.js';

/** Load AI configuration from environment */
export function loadAIConfig(): Result<AIConfig, AppError> {
  const enabled = process.env.TEMPOT_AI !== 'false';
  const provider = (process.env.TEMPOT_AI_PROVIDER ?? 'gemini') as AIConfig['provider'];

  if (provider !== 'gemini' && provider !== 'openai') {
    return err(new AppError(AI_ERRORS.PROVIDER_UNKNOWN, { provider }));
  }

  return ok({
    ...DEFAULT_AI_CONFIG,
    enabled,
    provider,
    embeddingModel: process.env.AI_EMBEDDING_MODEL ?? DEFAULT_AI_CONFIG.embeddingModel,
    embeddingDimensions:
      Number(process.env.AI_EMBEDDING_DIMENSIONS) || DEFAULT_AI_CONFIG.embeddingDimensions,
    confidenceThreshold:
      Number(process.env.AI_CONFIDENCE_THRESHOLD) || DEFAULT_AI_CONFIG.confidenceThreshold,
    generationTimeoutMs:
      Number(process.env.AI_GENERATION_TIMEOUT_MS) || DEFAULT_AI_CONFIG.generationTimeoutMs,
    embeddingTimeoutMs:
      Number(process.env.AI_EMBEDDING_TIMEOUT_MS) || DEFAULT_AI_CONFIG.embeddingTimeoutMs,
  });
}

/** Load resilience config from environment */
export function loadResilienceConfig(): ResilienceConfig {
  return {
    ...DEFAULT_RESILIENCE_CONFIG,
    circuitBreakerThreshold:
      Number(process.env.AI_CB_THRESHOLD) || DEFAULT_RESILIENCE_CONFIG.circuitBreakerThreshold,
    circuitBreakerResetMs:
      Number(process.env.AI_CB_RESET_MS) || DEFAULT_RESILIENCE_CONFIG.circuitBreakerResetMs,
    maxConcurrent: Number(process.env.AI_MAX_CONCURRENT) || DEFAULT_RESILIENCE_CONFIG.maxConcurrent,
  };
}

/** Load rate limit config from environment */
export function loadRateLimitConfig(): RateLimitConfig {
  return {
    ...DEFAULT_RATE_LIMIT_CONFIG,
  };
}

/** Load chunking config from environment */
export function loadChunkingConfig(): ChunkingConfig {
  return {
    ...DEFAULT_CHUNKING_CONFIG,
  };
}
```

---

## Task 3 — AIProviderFactory

### FR Covered: FR-001, D8, NFR-004, SC-001

### File: `src/provider/ai-provider.factory.ts`

Uses Vercel AI SDK v6 `createProviderRegistry()` for provider management (ADR-031). Returns a provider registry with aliased model names.

```typescript
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AIConfig } from '../ai-core.types.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Create provider registry with aliased models (ADR-031) */
export function createAIProviderRegistry(
  config: AIConfig,
): Result<ReturnType<typeof createProviderRegistry>, AppError> {
  if (!config.enabled) {
    return err(new AppError(AI_ERRORS.DISABLED));
  }

  try {
    const registry = createProviderRegistry({
      google,
      openai,
    });

    return ok(registry);
  } catch (error: unknown) {
    return err(new AppError(AI_ERRORS.PROVIDER_AUTH_FAILED, error));
  }
}

/** Get model ID string for the configured provider */
export function getModelId(config: AIConfig, purpose: 'chat' | 'embedding'): string {
  if (purpose === 'embedding') {
    // Embedding model is always from Google (gemini-embedding-2-preview)
    return `google:${config.embeddingModel}`;
  }

  switch (config.provider) {
    case 'gemini':
      return 'google:gemini-2.0-flash';
    case 'openai':
      return 'openai:gpt-4o';
    default:
      return 'google:gemini-2.0-flash';
  }
}
```

---

## Task 4 — ResilienceService

### FR Covered: FR-008, D9, SC-002, NFR-005

### File: `src/resilience/resilience.service.ts`

Uses `cockatiel` library for circuit breaker, retry, timeout, bulkhead, and fallback. Composes policies per operation type.

```typescript
import {
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  ExponentialBackoff,
  retry,
  handleAll,
  circuitBreaker,
  timeout,
  bulkhead,
  wrap,
  TimeoutStrategy,
} from 'cockatiel';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { ResilienceConfig } from '../ai-core.types.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export class ResilienceService {
  private readonly circuitBreakerPolicy: CircuitBreakerPolicy;
  private readonly generationPolicy: ReturnType<typeof wrap>;
  private readonly embeddingPolicy: ReturnType<typeof wrap>;

  constructor(
    private readonly config: ResilienceConfig,
    private readonly logger: AILogger,
    private readonly eventBus: AIEventBus,
  ) {
    // Circuit breaker: consecutive failures
    this.circuitBreakerPolicy = circuitBreaker(handleAll, {
      halfOpenAfter: config.circuitBreakerResetMs,
      breaker: new ConsecutiveBreaker(config.circuitBreakerThreshold),
    });

    // Listen for circuit open
    this.circuitBreakerPolicy.onBreak(() => {
      this.logger.error({
        code: AI_ERRORS.CIRCUIT_OPEN,
        message: 'AI circuit breaker activated',
        threshold: config.circuitBreakerThreshold,
        resetMs: config.circuitBreakerResetMs,
      });
      // Fire-and-log: emit degradation event
      void this.eventBus.publish('system.ai.degraded', {
        reason: 'circuit_breaker_activated',
        failureCount: config.circuitBreakerThreshold,
        disabledUntil: new Date(Date.now() + config.circuitBreakerResetMs),
        lastError: 'consecutive_failures',
      });
    });

    // Retry policy with exponential backoff
    const retryPolicy = retry(handleAll, {
      maxAttempts: config.retryMaxAttempts,
      backoff: new ExponentialBackoff(),
    });

    // Timeout policies
    const generationTimeout = timeout(config.timeoutMs, TimeoutStrategy.Aggressive);
    const embeddingTimeout = timeout(10_000, TimeoutStrategy.Aggressive);

    // Bulkhead: limit concurrent AI calls
    const bulkheadPolicy = bulkhead(config.maxConcurrent);

    // Compose policies: bulkhead → circuit breaker → retry → timeout
    this.generationPolicy = wrap(
      bulkheadPolicy,
      this.circuitBreakerPolicy,
      retryPolicy,
      generationTimeout,
    );
    this.embeddingPolicy = wrap(
      bulkheadPolicy,
      this.circuitBreakerPolicy,
      retryPolicy,
      embeddingTimeout,
    );
  }

  /** Execute an AI generation call with full resilience */
  async executeGeneration<T>(fn: () => Promise<T>): AsyncResult<T, AppError> {
    try {
      const result = await this.generationPolicy.execute(fn);
      return ok(result);
    } catch (error: unknown) {
      return this.mapError(error);
    }
  }

  /** Execute an embedding call with resilience */
  async executeEmbedding<T>(fn: () => Promise<T>): AsyncResult<T, AppError> {
    try {
      const result = await this.embeddingPolicy.execute(fn);
      return ok(result);
    } catch (error: unknown) {
      return this.mapError(error);
    }
  }

  /** Check if circuit is currently open */
  isCircuitOpen(): boolean {
    return this.circuitBreakerPolicy.state === 'open';
  }

  /** Map cockatiel errors to AppError */
  private mapError<T>(error: unknown): AsyncResult<T, AppError> {
    if (error instanceof Error) {
      if (error.message.includes('circuit breaker')) {
        return Promise.resolve(err(new AppError(AI_ERRORS.CIRCUIT_OPEN, error)));
      }
      if (error.message.includes('timeout')) {
        return Promise.resolve(err(new AppError(AI_ERRORS.PROVIDER_TIMEOUT, error)));
      }
      if (error.message.includes('bulkhead')) {
        return Promise.resolve(err(new AppError(AI_ERRORS.BULKHEAD_FULL, error)));
      }
    }
    return Promise.resolve(err(new AppError(AI_ERRORS.PROVIDER_UNAVAILABLE, error)));
  }
}
```

---

## Task 5 — EmbeddingService

### FR Covered: FR-002, D11, NFR-002, NFR-003

### File: `src/embedding/embedding.service.ts`

Extends `DrizzleVectorRepository` from `@tempot/database`. Adds content-type filtering, task prefix formatting, and confidence threshold filtering.

```typescript
import { embed } from 'ai';
import { cosineDistance, and, inArray, sql } from 'drizzle-orm';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { DrizzleVectorRepository } from '@tempot/database';
import { embeddings } from '@tempot/database';
import type {
  AIConfig,
  EmbeddingInput,
  EmbeddingSearchOptions,
  EmbeddingSearchResult,
} from '../ai-core.types.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export class EmbeddingService extends DrizzleVectorRepository {
  constructor(
    db: ConstructorParameters<typeof DrizzleVectorRepository>[0],
    private readonly config: AIConfig,
    private readonly resilience: ResilienceService,
    private readonly registry: unknown, // Provider registry from AIProviderFactory
  ) {
    super(db);
  }

  /** Embed content and store in vector database */
  async embedAndStore(input: EmbeddingInput): AsyncResult<string, AppError> {
    // Format content with task prefix for documents
    const formattedContent = this.formatForDocument(input);

    // Generate embedding with resilience
    const embeddingResult = await this.resilience.executeEmbedding(async () => {
      const { embedding } = await embed({
        model: (this.registry as any).languageModel(`google:${this.config.embeddingModel}`),
        value: formattedContent,
      });
      return embedding;
    });

    if (embeddingResult.isErr()) {
      return err(new AppError(AI_ERRORS.EMBEDDING_FAILED, embeddingResult.error));
    }

    // Store via parent class create method
    const createResult = await this.create({
      contentId: input.contentId,
      contentType: input.contentType,
      vector: embeddingResult.value,
      metadata: input.metadata ?? null,
    });

    if (createResult.isErr()) return err(createResult.error);
    return ok(createResult.value.id);
  }

  /** Search embeddings with content-type filtering and confidence threshold */
  async searchSimilar(
    options: EmbeddingSearchOptions,
  ): AsyncResult<EmbeddingSearchResult[], AppError> {
    // Format query with task prefix
    const formattedQuery = this.formatForQuery(options.query);
    const threshold = options.confidenceThreshold ?? this.config.confidenceThreshold;
    const limit = options.limit ?? 5;

    // Generate query embedding with resilience
    const embeddingResult = await this.resilience.executeEmbedding(async () => {
      const { embedding } = await embed({
        model: (this.registry as any).languageModel(`google:${this.config.embeddingModel}`),
        value: formattedQuery,
      });
      return embedding;
    });

    if (embeddingResult.isErr()) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, embeddingResult.error));
    }

    // Query with contentType filter and cosine distance
    try {
      const similarity = sql<number>`1 - ${cosineDistance(embeddings.vector, embeddingResult.value)}`;
      const results = await this.db
        .select({
          contentId: embeddings.contentId,
          contentType: embeddings.contentType,
          score: similarity,
          metadata: embeddings.metadata,
        })
        .from(embeddings)
        .where(
          and(
            inArray(embeddings.contentType, options.contentTypes),
            sql`${similarity} >= ${threshold}`,
          ),
        )
        .orderBy(sql`${similarity} DESC`)
        .limit(limit);

      return ok(results as EmbeddingSearchResult[]);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, error));
    }
  }

  /** Delete embeddings by contentId */
  async deleteByContentId(contentId: string): AsyncResult<void, AppError> {
    try {
      await this.db.delete(embeddings).where(sql`${embeddings.contentId} = ${contentId}`);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.EMBEDDING_FAILED, error));
    }
  }

  /** Format content with document task prefix (D11) */
  private formatForDocument(input: EmbeddingInput): string {
    const title = (input.metadata?.title as string) ?? input.contentId;
    const content = typeof input.content === 'string' ? input.content : '';
    return `title: ${title} | text: ${content}`;
  }

  /** Format query with search task prefix (D11) */
  private formatForQuery(query: string | Buffer): string {
    const text = typeof query === 'string' ? query : '';
    return `task: search result | query: ${text}`;
  }
}
```

---

## Task 6 — RateLimiterService

### FR Covered: FR-009, D12, SC-006

### File: `src/rate-limiter/rate-limiter.service.ts`

Uses `rate-limiter-flexible` with Redis backend. Daily per-user limits configurable per role.

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { RateLimitConfig } from '../ai-core.types.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** User role for rate limiting */
export type RateLimitRole = 'user' | 'admin' | 'super_admin';

export class RateLimiterService {
  private readonly limiter: RateLimiterRedis;
  private readonly config: RateLimitConfig;

  constructor(redisClient: unknown, config: RateLimitConfig) {
    this.config = config;
    this.limiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'ai:ratelimit',
      points: config.userLimit, // Default, overridden per role in consume()
      duration: Math.floor(config.windowMs / 1000), // seconds
    });
  }

  /** Check and consume a rate limit point for a user */
  async consume(userId: string, role: RateLimitRole): AsyncResult<void, AppError> {
    const limit = this.getLimitForRole(role);

    // Super Admin = unlimited
    if (limit === 0) return ok(undefined);

    try {
      await this.limiter.consume(userId, 1, { customDuration: undefined });
      return ok(undefined);
    } catch (error: unknown) {
      return err(
        new AppError(AI_ERRORS.RATE_LIMITED, {
          userId,
          role,
          limit,
          windowMs: this.config.windowMs,
        }),
      );
    }
  }

  /** Get remaining points for a user */
  async getRemaining(userId: string, role: RateLimitRole): AsyncResult<number, AppError> {
    const limit = this.getLimitForRole(role);
    if (limit === 0) return ok(Infinity);

    try {
      const res = await this.limiter.get(userId);
      if (!res) return ok(limit);
      return ok(Math.max(0, limit - res.consumedPoints));
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.RATE_LIMITED, error));
    }
  }

  /** Reset rate limit for a user (Super Admin action) */
  async reset(userId: string): AsyncResult<void, AppError> {
    try {
      await this.limiter.delete(userId);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.RATE_LIMITED, error));
    }
  }

  /** Get limit for a given role */
  private getLimitForRole(role: RateLimitRole): number {
    switch (role) {
      case 'super_admin':
        return this.config.superAdminLimit;
      case 'admin':
        return this.config.adminLimit;
      case 'user':
        return this.config.userLimit;
      default:
        return this.config.userLimit;
    }
  }
}
```

---

## Task 7 — AuditService

### FR Covered: FR-011, D10, NFR-007, SC-004

### File: `src/audit/audit.service.ts`

Uses Langfuse + OpenTelemetry for AI-specific observability.

```typescript
import { Langfuse } from 'langfuse';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AILogger } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Audit log entry for an AI interaction */
export interface AIAuditEntry {
  userId: string;
  action: 'generation' | 'embedding' | 'tool_call' | 'rag_search' | 'conversation_end';
  input?: string;
  output?: string;
  toolName?: string;
  tokenUsage?: { input: number; output: number; total: number };
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  private readonly langfuse: Langfuse;

  constructor(private readonly logger: AILogger) {
    this.langfuse = new Langfuse();
  }

  /** Log an AI interaction to Langfuse */
  async log(entry: AIAuditEntry): AsyncResult<void, AppError> {
    try {
      const trace = this.langfuse.trace({
        name: entry.action,
        userId: entry.userId,
        metadata: {
          success: entry.success,
          latencyMs: entry.latencyMs,
          ...(entry.metadata ?? {}),
        },
      });

      if (entry.action === 'generation' || entry.action === 'tool_call') {
        trace.generation({
          name: entry.toolName ?? entry.action,
          input: entry.input,
          output: entry.output,
          usage: entry.tokenUsage
            ? {
                input: entry.tokenUsage.input,
                output: entry.tokenUsage.output,
                total: entry.tokenUsage.total,
              }
            : undefined,
          metadata: {
            success: entry.success,
            errorCode: entry.errorCode,
          },
        });
      }

      return ok(undefined);
    } catch (error: unknown) {
      this.logger.warn({
        code: AI_ERRORS.AUDIT_LOG_FAILED,
        entry,
        error: String(error),
      });
      // Audit failure should not break the operation — fire-and-log
      return ok(undefined);
    }
  }

  /** Flush pending events to Langfuse */
  async flush(): AsyncResult<void, AppError> {
    try {
      await this.langfuse.flushAsync();
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.AUDIT_LOG_FAILED, error));
    }
  }

  /** Shutdown Langfuse client */
  async shutdown(): AsyncResult<void, AppError> {
    try {
      await this.langfuse.shutdownAsync();
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.AUDIT_LOG_FAILED, error));
    }
  }
}
```

---

## Task 7b — AICache Middleware

### FR Covered: FR-019, D8

### File: `src/cache/ai-cache.middleware.ts`

Implements caching of identical AI responses via `LanguageModelMiddleware` (ADR-031). Uses cache-manager through the structural `AICache` interface defined in contracts.

```typescript
import type { LanguageModelMiddleware } from 'ai';
import type { AICache } from '../ai-core.contracts.js';
import type { AILogger } from '../ai-core.contracts.js';

const DEFAULT_CACHE_TTL_MS = 86_400_000; // 24 hours

/** Create a caching middleware for AI model calls */
export function createCacheMiddleware(
  cache: AICache,
  logger: AILogger,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): LanguageModelMiddleware {
  return {
    wrapGenerate: async ({ doGenerate, params }) => {
      // Compute cache key from prompt hash + tool set hash
      const cacheKey = computeCacheKey(params);

      // Check cache
      const cached = await cache.get<Awaited<ReturnType<typeof doGenerate>>>(cacheKey);
      if (cached) {
        logger.debug({ message: 'AI cache hit', cacheKey });
        return cached;
      }

      // Execute and cache
      const result = await doGenerate();
      await cache.set(cacheKey, result, ttlMs);
      return result;
    },
  };
}

/** Compute deterministic cache key from model params */
function computeCacheKey(params: Record<string, unknown>): string {
  const prompt = JSON.stringify(params.prompt ?? '');
  const tools = JSON.stringify(Object.keys((params.tools as Record<string, unknown>) ?? {}));
  // Simple hash: sum of char codes mod large prime
  const combined = `${prompt}:${tools}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return `ai:cache:${hash.toString(36)}`;
}
```

> **Implementation Note**: The actual hash function should use a cryptographic hash (e.g., `crypto.createHash('sha256')`) in production. The simplified version above is for illustration. Cache key includes prompt content and tool set — role is already embedded in the system prompt. TTL configurable, default 24 hours (FR-019).

---

## Task 8 — ContentIngestionService

### FR Covered: FR-013, D13, Edge Cases (RAG Content Size Limits, PII in Embeddings)

### File: `src/content/content-ingestion.service.ts`

Handles chunking, PII sanitization, and embedding of content.

```typescript
import { ok, err } from 'neverthrow';
import type { AsyncResult, Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type {
  EmbeddingInput,
  AIContentType,
  ChunkingConfig,
  ContentChunk,
} from '../ai-core.types.js';
import type { EmbeddingService } from '../embedding/embedding.service.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export class ContentIngestionService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly chunkingConfig: ChunkingConfig,
    private readonly logger: AILogger,
    private readonly eventBus: AIEventBus,
  ) {}

  /** Ingest content: validate → sanitize → chunk → embed → store */
  async ingest(
    contentId: string,
    contentType: AIContentType,
    content: string,
    metadata?: Record<string, unknown>,
    source: 'auto' | 'manual' = 'auto',
  ): AsyncResult<number, AppError> {
    // 1. Validate size
    const sizeBytes = Buffer.byteLength(content, 'utf8');
    if (sizeBytes > this.chunkingConfig.maxDocumentBytes) {
      return err(
        new AppError(AI_ERRORS.CONTENT_SIZE_EXCEEDED, {
          sizeBytes,
          maxBytes: this.chunkingConfig.maxDocumentBytes,
        }),
      );
    }

    // 2. Sanitize PII
    const sanitized = this.sanitizePII(content);

    // 3. Chunk content
    const chunks = this.chunkContent(sanitized, metadata ?? {});

    // 4. Delete existing embeddings for this contentId (re-indexing)
    await this.embeddingService.deleteByContentId(contentId);

    // 5. Embed and store each chunk
    let storedCount = 0;
    for (const chunk of chunks) {
      const input: EmbeddingInput = {
        contentId,
        contentType,
        content: chunk.text,
        metadata: {
          ...chunk.metadata,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
        },
      };

      const result = await this.embeddingService.embedAndStore(input);
      if (result.isErr()) {
        this.logger.warn({
          code: AI_ERRORS.CONTENT_CHUNK_FAILED,
          contentId,
          chunkIndex: chunk.chunkIndex,
          error: result.error.code,
        });
        continue; // Best-effort: skip failed chunks
      }
      storedCount++;
    }

    // 6. Emit content indexed event
    void this.eventBus.publish('ai-core.content.indexed', {
      contentId,
      contentType,
      chunkCount: storedCount,
      source,
    });

    return ok(storedCount);
  }

  /** Chunk content into overlapping segments */
  chunkContent(text: string, metadata: Record<string, unknown>): ContentChunk[] {
    // Simple word-based chunking (approximate token count)
    const words = text.split(/\s+/);
    const chunkSize = this.chunkingConfig.chunkSizeTokens;
    const overlap = this.chunkingConfig.overlapTokens;
    const chunks: ContentChunk[] = [];

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkText = words.slice(start, end).join(' ');
      chunks.push({
        text: chunkText,
        chunkIndex: chunks.length,
        totalChunks: 0, // Will be set after loop
        metadata,
      });
      start = end - overlap;
      if (start >= words.length) break;
      if (end === words.length) break;
    }

    // Set totalChunks
    for (const chunk of chunks) {
      chunk.totalChunks = chunks.length;
    }

    return chunks;
  }

  /** Sanitize PII from content before embedding */
  sanitizePII(content: string): string {
    // Replace common PII patterns with placeholders
    let sanitized = content;
    // Phone numbers (international and local)
    sanitized = sanitized.replace(/\+?\d{10,15}/g, '[PHONE]');
    // Email addresses
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    // National IDs (Egyptian-style: 14 digits)
    sanitized = sanitized.replace(/\b\d{14}\b/g, '[NATIONAL_ID]');
    return sanitized;
  }
}
```

---

## Task 9 — RAGPipeline

### FR Covered: FR-005, D5, Edge Cases (Model Hallucination Prevention, Unauthorized Data Access via RAG), SC-003

### File: `src/rag/rag-pipeline.service.ts`

Constrained RAG pipeline: filters content types by role, searches embeddings, and returns context with confidence scoring.

```typescript
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AIContentType, EmbeddingSearchResult } from '../ai-core.types.js';
import type { EmbeddingService } from '../embedding/embedding.service.js';
import type { AIAbilityChecker } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** RAG context result */
export interface RAGContext {
  hasResults: boolean;
  context: string;
  sources: EmbeddingSearchResult[];
}

/** Content type access control matrix (D5) */
const CONTENT_TYPE_ACCESS: Record<AIContentType, string[]> = {
  'ui-guide': ['user', 'admin', 'super_admin'],
  'bot-functions': ['admin', 'super_admin'],
  'db-schema': ['super_admin'],
  'developer-docs': ['developer', 'super_admin'],
  'custom-knowledge': [], // Checked per-content via metadata.accessRoles
  'user-memory': [], // Checked per-user via metadata.userId
};

export class RAGPipeline {
  constructor(private readonly embeddingService: EmbeddingService) {}

  /** Retrieve relevant context for a query, filtered by user role */
  async retrieve(
    query: string,
    userRole: string,
    userId: string,
    confidenceThreshold?: number,
  ): AsyncResult<RAGContext, AppError> {
    // 1. Determine accessible content types
    const allowedTypes = this.getAccessibleContentTypes(userRole, userId);

    if (allowedTypes.length === 0) {
      return ok({ hasResults: false, context: '', sources: [] });
    }

    // 2. Search embeddings with content type filter
    const searchResult = await this.embeddingService.searchSimilar({
      query,
      contentTypes: allowedTypes,
      limit: 5,
      confidenceThreshold,
    });

    if (searchResult.isErr()) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, searchResult.error));
    }

    const results = searchResult.value;

    // 3. Filter user-memory results to only the requesting user
    const filtered = results.filter((r) => {
      if (r.contentType === 'user-memory') {
        return (r.metadata as Record<string, unknown>)?.userId === userId;
      }
      if (r.contentType === 'custom-knowledge') {
        const accessRoles = (r.metadata as Record<string, unknown>)?.accessRoles as
          | string[]
          | undefined;
        return accessRoles ? accessRoles.includes(userRole) : false;
      }
      return true;
    });

    if (filtered.length === 0) {
      return ok({ hasResults: false, context: '', sources: [] });
    }

    // 4. Build context string from results
    const context = filtered
      .map((r) => {
        const title = (r.metadata as Record<string, unknown>)?.title ?? r.contentId;
        return `[${r.contentType}] ${title}: (score: ${r.score.toFixed(2)})`;
      })
      .join('\n\n');

    return ok({ hasResults: true, context, sources: filtered });
  }

  /** Get content types accessible to a given role */
  private getAccessibleContentTypes(role: string, _userId: string): AIContentType[] {
    const types: AIContentType[] = [];
    for (const [contentType, roles] of Object.entries(CONTENT_TYPE_ACCESS)) {
      if (roles.includes(role)) {
        types.push(contentType as AIContentType);
      }
    }
    // user-memory is always accessible (filtered by userId in results)
    if (!types.includes('user-memory')) {
      types.push('user-memory');
    }
    // custom-knowledge is always queried (filtered by accessRoles in results)
    if (!types.includes('custom-knowledge')) {
      types.push('custom-knowledge');
    }
    return types;
  }
}
```

---

## Task 10 — ToolRegistry

### FR Covered: FR-003, D3, Edge Cases (Module Tool Versioning)

### File: `src/tools/tool-registry.ts`

In-memory tool registry. Tools discovered via event bus subscription.

```typescript
import type { AITool } from '../ai-core.types.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';

export class ToolRegistry {
  private readonly tools: Map<string, AITool> = new Map();

  constructor(
    private readonly logger: AILogger,
    private readonly eventBus: AIEventBus,
  ) {
    // Subscribe to tool registration events
    this.eventBus.subscribe('module.tools.registered', (payload: unknown) => {
      this.handleToolRegistration(payload);
    });
  }

  /** Register a single tool */
  register(tool: AITool): void {
    const existing = this.tools.get(tool.name);
    if (existing && existing.version !== tool.version) {
      this.logger.info({
        message: 'Tool version updated',
        toolName: tool.name,
        oldVersion: existing.version,
        newVersion: tool.version,
      });
    }
    this.tools.set(tool.name, tool);
  }

  /** Get all registered tools */
  getAll(): AITool[] {
    return Array.from(this.tools.values());
  }

  /** Get a specific tool by name */
  get(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  /** Handle tool registration event from modules */
  private handleToolRegistration(payload: unknown): void {
    const data = payload as { tools?: AITool[] };
    if (!data.tools || !Array.isArray(data.tools)) return;
    for (const tool of data.tools) {
      this.register(tool);
    }
  }
}
```

---

## Task 11 — CASLToolFilter

### FR Covered: FR-004, D4, SC-005

### File: `src/tools/casl-tool-filter.ts`

Filters registered tools based on user's CASL abilities before passing to the AI model.

```typescript
import type { AITool } from '../ai-core.types.js';
import type { AIAbilityChecker } from '../ai-core.contracts.js';
import type { ToolRegistry } from './tool-registry.js';

export class CASLToolFilter {
  constructor(private readonly toolRegistry: ToolRegistry) {}

  /** Filter tools to only those the user is permitted to use */
  filterForUser(abilityChecker: AIAbilityChecker): AITool[] {
    const allTools = this.toolRegistry.getAll();
    return allTools.filter((tool) => {
      if (tool.confirmationLevel === 'none') {
        // Read-only tools: check 'read' permission
        return abilityChecker.can(tool.requiredPermission.action, tool.requiredPermission.subject);
      }
      return abilityChecker.can(tool.requiredPermission.action, tool.requiredPermission.subject);
    });
  }
}
```

---

## Task 12 — RoleSystemPrompts

### FR Covered: FR-012, D1

### File: `src/prompts/role-system-prompts.ts`

Per-role system prompts managed via i18n. Constrains the model to bot-related tasks only.

```typescript
/** Get system prompt for a given role (D1: AI as bot tool, not chatbot) */
export function getSystemPrompt(role: string, language: string): string {
  // System prompts are loaded from i18n at runtime
  // These are the i18n key patterns — actual text comes from locale files
  const prompts: Record<string, string> = {
    super_admin: `ai-core.system_prompt.super_admin`,
    admin: `ai-core.system_prompt.admin`,
    user: `ai-core.system_prompt.user`,
  };

  return prompts[role] ?? prompts.user;
}
```

> **Implementation Note**: Actual prompt content lives in `locales/ar.json` and `locales/en.json`. The i18n keys resolve to role-specific system prompts that constrain the model (D1). Example Arabic prompts from spec: Super Admin = "مساعد إداري شامل", Admin = "مساعد إداري مقيد", User = "مساعد شخصي — ممنوع بيانات الآخرين".

---

## Task 13 — ConfirmationEngine

### FR Covered: FR-007, D6, Rule LXVII, Edge Cases (Write Action Confirmation Timeout)

### File: `src/confirmation/confirmation.engine.ts`

Three-level write action confirmation with 5-minute expiry.

```typescript
import { ok, err } from 'neverthrow';
import type { AsyncResult, Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { ConfirmationLevel } from '../ai-core.types.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Pending confirmation state */
export interface PendingConfirmation {
  id: string;
  userId: string;
  toolName: string;
  params: unknown;
  level: ConfirmationLevel;
  summary: string;
  details?: string;
  confirmationCode?: string; // For escalated level
  createdAt: Date;
  expiresAt: Date;
}

const CONFIRMATION_TTL_MS = 5 * 60 * 1000; // 5 minutes (Rule LXVII)

export class ConfirmationEngine {
  private readonly pending: Map<string, PendingConfirmation> = new Map();

  /** Create a pending confirmation for a write action */
  createConfirmation(
    userId: string,
    toolName: string,
    params: unknown,
    level: ConfirmationLevel,
    summary: string,
    details?: string,
  ): Result<PendingConfirmation, AppError> {
    // Clean expired confirmations
    this.cleanExpired();

    const id = crypto.randomUUID();
    const now = new Date();
    const confirmation: PendingConfirmation = {
      id,
      userId,
      toolName,
      params,
      level,
      summary,
      details,
      confirmationCode: level === 'escalated' ? this.generateCode() : undefined,
      createdAt: now,
      expiresAt: new Date(now.getTime() + CONFIRMATION_TTL_MS),
    };

    this.pending.set(id, confirmation);
    return ok(confirmation);
  }

  /** Confirm a pending action */
  confirm(
    confirmationId: string,
    userId: string,
    code?: string,
  ): Result<PendingConfirmation, AppError> {
    this.cleanExpired();

    const pending = this.pending.get(confirmationId);
    if (!pending) return err(new AppError(AI_ERRORS.CONFIRMATION_EXPIRED));
    if (pending.userId !== userId) return err(new AppError(AI_ERRORS.CONFIRMATION_REJECTED));

    // Check expiry
    if (new Date() > pending.expiresAt) {
      this.pending.delete(confirmationId);
      return err(new AppError(AI_ERRORS.CONFIRMATION_EXPIRED));
    }

    // Check escalated code
    if (pending.level === 'escalated') {
      if (!code || code !== pending.confirmationCode) {
        return err(new AppError(AI_ERRORS.CONFIRMATION_CODE_INVALID));
      }
    }

    this.pending.delete(confirmationId);
    return ok(pending);
  }

  /** Cancel a pending confirmation */
  cancel(confirmationId: string, userId: string): Result<void, AppError> {
    const pending = this.pending.get(confirmationId);
    if (!pending) return err(new AppError(AI_ERRORS.CONFIRMATION_EXPIRED));
    if (pending.userId !== userId) return err(new AppError(AI_ERRORS.CONFIRMATION_REJECTED));
    this.pending.delete(confirmationId);
    return ok(undefined);
  }

  /** Generate a 6-digit confirmation code */
  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
    // NOTE: Implementation uses crypto.randomInt(100000, 1000000) for cryptographic security
  }

  /** Clean expired confirmations */
  private cleanExpired(): void {
    const now = new Date();
    for (const [id, pending] of this.pending) {
      if (now > pending.expiresAt) {
        this.pending.delete(id);
      }
    }
  }
}
```

---

## Task 14 — IntentRouter

### FR Covered: FR-006, D8, Edge Cases (Failed Intent / Ambiguous Query)

### File: `src/router/intent-router.ts`

Uses AI SDK v6 tool calling and multi-step agent loops for intent routing.

```typescript
import { generateText } from 'ai';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AITool } from '../ai-core.types.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import type { CASLToolFilter } from '../tools/casl-tool-filter.js';
import type { ConfirmationEngine } from '../confirmation/confirmation.engine.js';
import type { RAGPipeline, RAGContext } from '../rag/rag-pipeline.service.js';
import type { AuditService } from '../audit/audit.service.js';
import type { AIAbilityChecker, AILogger } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Intent routing result */
export interface IntentResult {
  response: string;
  toolsCalled: string[];
  tokenUsage: { input: number; output: number; total: number };
  requiresConfirmation?: {
    confirmationId: string;
    level: string;
    summary: string;
    details?: string;
    code?: string;
  };
}

export class IntentRouter {
  constructor(
    private readonly registry: unknown, // Provider registry
    private readonly modelId: string,
    private readonly resilience: ResilienceService,
    private readonly caslFilter: CASLToolFilter,
    private readonly confirmationEngine: ConfirmationEngine,
    private readonly ragPipeline: RAGPipeline,
    private readonly auditService: AuditService,
    private readonly logger: AILogger,
  ) {}

  /** Route a user message to appropriate tools or RAG */
  async route(
    message: string,
    userId: string,
    userRole: string,
    abilityChecker: AIAbilityChecker,
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): AsyncResult<IntentResult, AppError> {
    const startTime = Date.now();

    // 1. Get filtered tools for this user
    const allowedTools = this.caslFilter.filterForUser(abilityChecker);

    // 2. Get RAG context
    const ragResult = await this.ragPipeline.retrieve(message, userRole, userId);
    const ragContext = ragResult.isOk()
      ? ragResult.value
      : { hasResults: false, context: '', sources: [] };

    // 3. Build messages with system prompt + RAG context + conversation history
    const messages = this.buildMessages(systemPrompt, ragContext, conversationHistory, message);

    // 4. Convert AITools to AI SDK tool format
    const sdkTools = this.convertToSDKTools(allowedTools);

    // 5. Execute with resilience
    const generationResult = await this.resilience.executeGeneration(async () => {
      return generateText({
        model: (this.registry as any).languageModel(this.modelId),
        messages,
        tools: sdkTools,
        maxSteps: 5, // Multi-step agent loop
      });
    });

    if (generationResult.isErr()) {
      return err(generationResult.error);
    }

    const result = generationResult.value;
    const latencyMs = Date.now() - startTime;

    // 6. Audit log
    void this.auditService.log({
      userId,
      action: 'generation',
      input: message,
      output: result.text,
      tokenUsage: {
        input: result.usage?.promptTokens ?? 0,
        output: result.usage?.completionTokens ?? 0,
        total: result.usage?.totalTokens ?? 0,
      },
      latencyMs,
      success: true,
    });

    return ok({
      response: result.text,
      toolsCalled: result.toolCalls?.map((tc: { toolName: string }) => tc.toolName) ?? [],
      tokenUsage: {
        input: result.usage?.promptTokens ?? 0,
        output: result.usage?.completionTokens ?? 0,
        total: result.usage?.totalTokens ?? 0,
      },
    });
  }

  /** Build messages array for the model */
  private buildMessages(
    systemPrompt: string,
    ragContext: RAGContext,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentMessage: string,
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // System prompt with RAG context
    let system = systemPrompt;
    if (ragContext.hasResults) {
      system += `\n\nRelevant context from knowledge base:\n${ragContext.context}`;
    }
    messages.push({ role: 'system', content: system });

    // Conversation history
    for (const msg of history) {
      messages.push(msg);
    }

    // Current message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /** Convert AITool to AI SDK tool format */
  private convertToSDKTools(tools: AITool[]): Record<string, unknown> {
    const sdkTools: Record<string, unknown> = {};
    for (const tool of tools) {
      sdkTools[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (params: unknown) => {
          const result = await tool.execute(params);
          if (result.isErr()) {
            throw result.error;
          }
          return result.value;
        },
      };
    }
    return sdkTools;
  }
}
```

---

## Task 15 — ConversationMemory

### FR Covered: FR-010, D7, Edge Cases (Concurrent AI Sessions)

### File: `src/memory/conversation-memory.service.ts`

Summarizes conversations on session end, embeds summaries, retrieves past context.

```typescript
import { generateText } from 'ai';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { EmbeddingService } from '../embedding/embedding.service.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

export class ConversationMemory {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly resilience: ResilienceService,
    private readonly registry: unknown, // Provider registry
    private readonly modelId: string,
    private readonly logger: AILogger,
    private readonly eventBus: AIEventBus,
  ) {}

  /** Summarize and store a completed conversation */
  async summarizeAndStore(
    userId: string,
    sessionId: string,
    conversation: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): AsyncResult<void, AppError> {
    if (conversation.length === 0) return ok(undefined);

    // 1. Generate summary
    const summaryResult = await this.resilience.executeGeneration(async () => {
      const conversationText = conversation.map((m) => `${m.role}: ${m.content}`).join('\n');

      const { text } = await generateText({
        model: (this.registry as any).languageModel(this.modelId),
        prompt: `Summarize the following conversation concisely, focusing on key topics, decisions, and user preferences. Keep the summary under 200 words.\n\n${conversationText}`,
      });
      return text;
    });

    if (summaryResult.isErr()) {
      return err(new AppError(AI_ERRORS.SUMMARIZATION_FAILED, summaryResult.error));
    }

    // 2. Embed and store the summary
    const embedResult = await this.embeddingService.embedAndStore({
      contentId: `session:${sessionId}`,
      contentType: 'user-memory',
      content: summaryResult.value,
      metadata: {
        userId,
        sessionId,
        summarizedAt: new Date().toISOString(),
        messageCount: conversation.length,
      },
    });

    if (embedResult.isErr()) {
      return err(new AppError(AI_ERRORS.SUMMARIZATION_FAILED, embedResult.error));
    }

    // 3. Emit conversation ended event
    void this.eventBus.publish('ai-core.conversation.ended', {
      userId,
      messageCount: conversation.length,
      summarized: true,
      durationMs: 0, // Calculated by caller
    });

    return ok(undefined);
  }

  /** Retrieve relevant past context for a new session */
  async retrievePastContext(
    userId: string,
    currentQuery: string,
    limit: number = 5,
  ): AsyncResult<string[], AppError> {
    const searchResult = await this.embeddingService.searchSimilar({
      query: currentQuery,
      contentTypes: ['user-memory'],
      limit,
      confidenceThreshold: 0.5, // Lower threshold for memory recall
    });

    if (searchResult.isErr()) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, searchResult.error));
    }

    // Filter to this user's memories only
    const userMemories = searchResult.value.filter(
      (r) => (r.metadata as Record<string, unknown>)?.userId === userId,
    );

    // Return content IDs (summaries would be retrieved separately)
    return ok(userMemories.map((m) => m.contentId));
  }
}
```

---

## Task 16 — AlternativeSuggestions

### FR Covered: FR-014, Edge Cases (Failed Intent / Ambiguous Query)

### File: `src/suggestions/alternative-suggestions.ts`

Generates "هل تقصد...؟" suggestions when intent cannot be resolved.

```typescript
import type { AITool } from '../ai-core.types.js';
import type { ToolRegistry } from '../tools/tool-registry.js';

export class AlternativeSuggestions {
  constructor(private readonly toolRegistry: ToolRegistry) {}

  /** Generate up to 3 alternative suggestions based on available tools */
  suggest(userMessage: string, filteredTools: AITool[], maxSuggestions: number = 3): string[] {
    // Simple keyword-based matching against tool descriptions
    const words = userMessage.toLowerCase().split(/\s+/);
    const scored = filteredTools
      .map((tool) => {
        const desc = tool.description.toLowerCase();
        const nameWords = tool.name.split('.').join(' ').toLowerCase();
        let score = 0;
        for (const word of words) {
          if (desc.includes(word)) score++;
          if (nameWords.includes(word)) score += 2;
        }
        return { tool, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);

    return scored.map((s) => s.tool.description);
  }
}
```

---

## Task 17 — TelegramAssistantUI

### FR Covered: FR-015, D2, Edge Cases (Concurrent AI Sessions)

### File: `src/ui/telegram-assistant-ui.ts`

Provides `/ai` command and inline button. Uses grammY conversation for multi-turn interaction.

> **Implementation Note**: This task integrates with grammY's conversation system. The exact implementation depends on how Tempot's bot framework structures conversation handlers. The service orchestrates: rate limit check → session management → intent routing → response → confirmation handling.

```typescript
// This file orchestrates the AI conversation flow in Telegram
// It depends on grammY's conversation API and @tempot/session-manager

import type { IntentRouter } from '../router/intent-router.js';
import type { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
import type { ConversationMemory } from '../memory/conversation-memory.service.js';
import type { ConfirmationEngine } from '../confirmation/confirmation.engine.js';

export interface TelegramAssistantDeps {
  intentRouter: IntentRouter;
  rateLimiter: RateLimiterService;
  conversationMemory: ConversationMemory;
  confirmationEngine: ConfirmationEngine;
}

// The actual grammY conversation handler will be implemented
// following the pattern in packages/session-manager and Tempot's module system
// (§15.4 Feature-Based structure: handler.ts + conversation.ts + service.ts)
```

---

## Task 18 — Developer RAG and CLI Tools

### FR Covered: FR-016

### Files

- `src/cli/dev-assistant.ts` — `pnpm ai:dev "question"` handler
- `src/cli/module-reviewer.ts` — `pnpm ai:review --module {name}` handler

> **Implementation Note**: CLI tools reuse `AIProviderFactory`, `EmbeddingService`, and `RAGPipeline` but run outside the Telegram context. They read `developer-docs` content from the vector store. Exact CLI integration depends on the project's script runner configuration.

---

## Task 19 — Event Registration

### FR Covered: Spec § Event Payloads

### File Modified: `packages/event-bus/src/event-bus.events.ts`

Add ai-core events to the `TempotEvents` interface with typed payloads defined **inline** (to avoid circular dependency — event-bus must NOT import from ai-core):

```typescript
export interface TempotEvents {
  // ... existing events ...
  'system.ai.degraded': {
    reason: string;
    failureCount: number;
    disabledUntil: Date;
    lastError: string;
  };
  'ai-core.tool.executed': {
    userId: string;
    toolName: string;
    success: boolean;
    executionMs: number;
    tokenUsage: number;
  };
  'ai-core.conversation.ended': {
    userId: string;
    messageCount: number;
    summarized: boolean;
    durationMs: number;
  };
  'ai-core.content.indexed': {
    contentId: string;
    contentType: string;
    chunkCount: number;
    source: string;
  };
  'module.tools.registered': {
    moduleName: string;
    toolCount: number;
    toolNames: string[];
  };
}
```

This is the ONLY file modified in `packages/event-bus/`.

---

## Task 20 — Cross-Package Modifications

### FR Covered: Spec § Cross-Package Modifications

### Files Modified

1. `packages/database/src/database.config.ts` — Update `VECTOR_DIMENSIONS` default from 768 to 3072
2. `packages/database/src/drizzle/drizzle.schema.ts` — Confirm dimensions use `DB_CONFIG.VECTOR_DIMENSIONS` (already does)

```typescript
// packages/database/src/database.config.ts — updated default
export const DB_CONFIG = {
  VECTOR_DIMENSIONS: Number(process.env.VECTOR_DIMENSIONS) || 3072, // Updated from 768
};
```

---

## Task 21 — Barrel Exports

### File: `src/index.ts`

All public types, interfaces, constants, services, and factories are exported. Uses `.js` extensions on all relative imports.

---

## Task 22 — Pluggable Architecture Toggle (Rule XVI)

### FR Covered: FR-017

### File: `src/ai-core.guard.ts`

Constitution Rule XVI requires `TEMPOT_AI=true/false` environment variable. When disabled, all public service methods must return `err(AppError('ai-core.disabled'))` without initializing any providers or making any external calls.

```typescript
import { err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { AI_ERRORS } from './ai-core.errors.js';

/** Guard function — checks if AI is enabled before executing */
export function guardEnabled<T>(
  enabled: boolean,
  fn: () => AsyncResult<T, AppError>,
): AsyncResult<T, AppError> {
  if (!enabled) {
    return Promise.resolve(err(new AppError(AI_ERRORS.DISABLED)));
  }
  return fn();
}
```

> **Implementation Note**: Each public service method (EmbeddingService, IntentRouter, RAGPipeline, etc.) wraps its logic with `guardEnabled(this.config.enabled, () => ...)`. This is the same pattern used by storage-engine (Task 14). The guard is a pure function that can be unit tested independently.

---

## Testing Strategy

### Unit Tests (vitest)

| Test File                           | What It Tests                                                       | Key Assertions                                                    |
| ----------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ai-core.config.test.ts`            | Config loading, env var parsing, validation                         | Defaults correct, invalid provider rejected, disabled state works |
| `ai-provider.factory.test.ts`       | Registry creation, model ID resolution                              | Returns ok/err correctly, provider switching works                |
| `resilience.service.test.ts`        | Circuit breaker, retry, timeout, bulkhead                           | Circuit opens after N failures, resets after timeout              |
| `embedding.service.test.ts`         | Embed and store, search with filters, delete by contentId           | Vector stored, contentType filter applied, confidence threshold   |
| `rate-limiter.service.test.ts`      | Daily limits per role, unlimited for Super Admin, reset             | Consume returns err after limit, unlimited returns ok             |
| `audit.service.test.ts`             | Langfuse trace creation, fire-and-log on failure                    | Log creates trace, failure does not throw                         |
| `ai-cache.middleware.test.ts`       | Cache hit/miss, key computation, TTL expiry                         | Cached result returned on hit, doGenerate called on miss          |
| `content-ingestion.service.test.ts` | Chunking, PII sanitization, embed + store flow                      | Correct chunks, PII replaced, events emitted                      |
| `rag-pipeline.service.test.ts`      | Content type filtering, confidence threshold, user-memory isolation | Only allowed types returned, below-threshold excluded             |
| `tool-registry.test.ts`             | Register, get, update version, event-driven discovery               | Tools stored, version updates logged, event handler works         |
| `casl-tool-filter.test.ts`          | Filter by CASL abilities                                            | Only permitted tools returned                                     |
| `confirmation.engine.test.ts`       | Create, confirm, cancel, expiry, escalated code                     | Expired returns err, wrong code rejected, TTL enforced            |
| `intent-router.test.ts`             | Message routing, tool calling, RAG integration, error handling      | Model called with filtered tools + RAG context                    |
| `conversation-memory.test.ts`       | Summarize + store, retrieve past context, user isolation            | Summary embedded, user memories only returned                     |
| `alternative-suggestions.test.ts`   | Keyword matching, max suggestions, empty results                    | Correct suggestions returned, max enforced                        |

### Integration Tests (deferred)

AI API calls, Langfuse integration, and Redis-backed rate limiting require live services and are NOT in scope for unit tests. They will use Testcontainers in integration test phase.

---

## Dependencies Summary

| Dependency              | Version      | Purpose                                   | Runtime/Dev |
| ----------------------- | ------------ | ----------------------------------------- | ----------- |
| `neverthrow`            | 8.2.0        | Result pattern                            | runtime     |
| `@tempot/shared`        | workspace:\* | AppError, Result/AsyncResult              | runtime     |
| `@tempot/database`      | workspace:\* | DrizzleVectorRepository, Drizzle schema   | runtime     |
| `@tempot/event-bus`     | workspace:\* | Event publishing/subscribing              | runtime     |
| `@tempot/logger`        | workspace:\* | Structured logging (Pino)                 | runtime     |
| `ai`                    | ^6.0.0       | Vercel AI SDK v6 (core)                   | runtime     |
| `@ai-sdk/google`        | ^1.0.0       | Gemini provider adapter                   | runtime     |
| `@ai-sdk/openai`        | ^1.0.0       | OpenAI provider adapter                   | runtime     |
| `cockatiel`             | ^3.0.0       | Circuit breaker, retry, timeout, bulkhead | runtime     |
| `rate-limiter-flexible` | ^5.0.0       | Per-user rate limiting with Redis         | runtime     |
| `langfuse`              | ^3.0.0       | AI observability, cost tracking           | runtime     |
| `zod`                   | ^3.0.0       | Schema validation for tool parameters     | runtime     |
| `typescript`            | 5.9.3        | Build                                     | dev         |
| `vitest`                | 4.1.0        | Testing                                   | dev         |

---

## Phase 2 — LLM-Friendly Patterns

**Added**: 2026-04-04

### Overview

Phase 2 adds 5 patterns that make ai-core more practical for real LLM tool calling. These are additive — no existing APIs are broken.

### Architecture

#### New Files

| File                                | Purpose                         | Size Est.  | Dependencies                  |
| ----------------------------------- | ------------------------------- | ---------- | ----------------------------- |
| `src/pagination/pagination.util.ts` | Generic `paginate<T>()` utility | ~50 lines  | None (pure function)          |
| `src/tools/output-limiter.util.ts`  | `truncateToolOutput()` utility  | ~45 lines  | None (pure function)          |
| `src/tools/input-normalization.ts`  | 6 Zod preprocessors + namespace | ~85 lines  | `zod`                         |
| `src/tools/batch-executor.ts`       | `executeBatch()` function       | ~100 lines | `tool.registry.ts`, contracts |

#### Modified Files

| File                          | Changes                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ai-core.types.ts`        | Add `group?`, `maxOutputChars?` to `AITool`; add `defaultMaxOutputChars?` to `AIConfig`; add `PaginatedResult<T>`, `PaginationOptions`, `BatchItem`, `BatchResult` types; update `DEFAULT_AI_CONFIG` |
| `src/ai-core.errors.ts`       | Add `BATCH_EMPTY_ITEMS: 'ai-core.batch.empty_items'`                                                                                                                                                 |
| `src/ai-core.config.ts`       | Add `TEMPOT_AI_MAX_OUTPUT_CHARS` env var loading                                                                                                                                                     |
| `src/tools/tool.registry.ts`  | Add `getByGroup()`, `getByGroups()`, `getGroups()` methods; pagination overloads on `getAll()` and `getByGroup()`                                                                                    |
| `src/router/intent.router.ts` | Add output truncation in `convertToSDKTools()` after tool execution; add optional `config?: AIConfig` to `IntentRouterDeps`                                                                          |
| `src/index.ts`                | Add barrel exports for all new types and utilities                                                                                                                                                   |

#### Task Dependency Graph (Phase 2)

```
Task 23 (Types + Errors + Pagination Utility)
  ├─→ Task 24 (Extension Groups — needs AITool.group from T23)
  ├─→ Task 25 (Output Limiting — needs AITool.maxOutputChars + AIConfig from T23)
  ├─→ Task 26 (Input Normalization — standalone, but after T23 for consistency)
  └─→ Task 27 (Batch Executor — needs BatchResult type from T23)
       └─→ Task 28 (Barrel Exports — after all new code exists)
```

### Integration Points

**IntentRouter.convertToSDKTools()** (current lines 213-244 of `intent.router.ts`):

- After `tool.execute(params)` returns `ok` (line 239: `return result.value`), add truncation:
  ```typescript
  const output = result.value;
  const maxChars = tool.maxOutputChars ?? this.deps.config?.defaultMaxOutputChars ?? 4000;
  const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
  return truncateToolOutput(outputStr, maxChars);
  ```
- Add `config?: AIConfig` to `IntentRouterDeps` interface (line 41-50)

**ToolRegistry** (current 79 lines):

- New methods use the existing `this.tools` Map
- Pagination methods use the generic `paginate()` utility from `pagination/pagination.util.ts`
