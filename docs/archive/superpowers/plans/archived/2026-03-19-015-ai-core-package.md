# AI Core Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational ai-core package as an abstraction layer for various AI providers (Gemini, OpenAI) as per Architecture Spec v11 Blueprint.

**Architecture:** A provider-agnostic `AIService` that delegates to specialized drivers via the `Vercel AI SDK`. It provides high-level services for classification, extraction, and summarization. It leverages the centralized `DrizzleVectorRepository` from `@tempot/database` for vector storage, implements a `CircuitBreaker` for resilience, and uses `cache-manager` to automatically cache identical AI responses.

**Tech Stack:** TypeScript, Vercel AI SDK (@ai-sdk/google, @ai-sdk/openai), @tempot/database (Drizzle), @tempot/shared (CacheService, AppError).

---

### Task 1: AI Provider Interface and Factory (FR-001, FR-002)

**Files:**

- Create: `packages/ai-core/src/providers/ai.provider.ts`
- Test: `packages/ai-core/tests/unit/provider-factory.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { AIProviderFactory } from '../src/providers/ai.provider';

describe('AIProviderFactory', () => {
  it('should return Gemini provider by default', () => {
    const provider = AIProviderFactory.create('gemini');
    expect(provider.name).toBe('google');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/ai-core/tests/unit/provider-factory.test.ts`
Expected: FAIL (AIProviderFactory not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

export class AIProviderFactory {
  static create(providerName: string = 'gemini') {
    if (providerName === 'openai') return openai('gpt-4o');
    return google('gemini-1.5-flash');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/ai-core/tests/unit/provider-factory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ai-core/src/providers/ai.provider.ts
git commit -m "feat(ai-core): implement AIProviderFactory with Vercel AI SDK (FR-001)"
```

---

### Task 2: Vector Search Integration (FR-004)

**Files:**

- Create: `packages/ai-core/src/services/embedding.service.ts`
- Test: `packages/ai-core/tests/integration/embedding-search.test.ts`

- [ ] **Step 1: Write the failing test for embedding search**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EmbeddingService } from '../src/services/embedding.service';

describe('EmbeddingService', () => {
  it('should generate embeddings and call vector repository', async () => {
    const repo = { search: vi.fn() };
    const service = new EmbeddingService(repo as any);
    // ... test logic ...
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/ai-core/tests/integration/embedding-search.test.ts`
Expected: FAIL (EmbeddingService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export class EmbeddingService {
  constructor(private vectorRepo: any) {}

  async searchSimilar(text: string) {
    const { embedding } = await embed({
      model: google.embedding('text-embedding-004'),
      value: text,
    });
    return this.vectorRepo.search(embedding);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/ai-core/tests/integration/embedding-search.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ai-core/src/services/embedding.service.ts
git commit -m "feat(ai-core): implement EmbeddingService using centralized vector repository (FR-004)"
```

---

### Task 3: CircuitBreaker for AI Resiliency (FR-005)

**Files:**

- Create: `packages/ai-core/src/resiliency/circuit-breaker.ts`
- Test: `packages/ai-core/tests/unit/circuit-breaker.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker } from '../src/resiliency/circuit-breaker';

describe('CircuitBreaker', () => {
  it('should trip after 5 consecutive failures', async () => {
    const cb = new CircuitBreaker(5, 60000); // 5 fails, 1 min reset
    for (let i = 0; i < 5; i++) cb.recordFailure();
    expect(cb.isOpen()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/ai-core/tests/unit/circuit-breaker.test.ts`
Expected: FAIL (CircuitBreaker not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' = 'CLOSED';
  private lastFailureTime?: number;

  constructor(
    private threshold: number,
    private resetTimeout: number,
  ) {}

  isOpen(): boolean {
    if (this.state === 'OPEN' && Date.now() - (this.lastFailureTime || 0) > this.resetTimeout) {
      this.state = 'CLOSED';
      this.failures = 0;
    }
    return this.state === 'OPEN';
  }

  recordFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.lastFailureTime = Date.now();
    }
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/ai-core/tests/unit/circuit-breaker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ai-core/src/resiliency/circuit-breaker.ts
git commit -m "feat(ai-core): implement CircuitBreaker for AI service resilience (FR-005)"
```

---

### Task 4: High-Level AI Services with Caching (FR-003, FR-006)

**Files:**

- Create: `packages/ai-core/src/services/ai.service.ts`
- Test: `packages/ai-core/tests/integration/ai-services.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../src/services/ai.service';
import { z } from 'zod';

describe('AIService', () => {
  it('should extract, classify, and summarize data using the AI model', async () => {
    // Requires valid API key or mock
  });

  it('should use cached response for identical prompts', async () => {
    // Requires cache mock
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { createHash } from 'crypto';

export class AIService {
  constructor(
    private provider: any,
    private circuitBreaker: any,
    private cache: any,
  ) {}

  private async getCachedOrExecute<T>(prompt: string, execute: () => Promise<T>): Promise<T> {
    const hash = createHash('sha256').update(prompt).digest('hex');
    const cacheKey = `ai:cache:${hash}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as T;

    if (this.circuitBreaker.isOpen()) throw new Error('AI_SERVICE_UNAVAILABLE');

    try {
      const result = await execute();
      await this.cache.set(cacheKey, result, 86400); // 24h TTL
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (e) {
      this.circuitBreaker.recordFailure();
      throw e;
    }
  }

  async extract<T extends z.ZodTypeAny>(prompt: string, schema: T) {
    return this.getCachedOrExecute(prompt, async () => {
      const { object } = await generateObject({
        model: this.provider,
        schema,
        prompt,
      });
      return object;
    });
  }

  async classify(text: string, categories: string[]) {
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}.\nText: ${text}`;
    return this.getCachedOrExecute(prompt, async () => {
      const { text: result } = await generateText({ model: this.provider, prompt });
      return result.trim();
    });
  }

  async summarize(text: string, maxLength: number = 100) {
    const prompt = `Summarize the following text in under ${maxLength} words.\nText: ${text}`;
    return this.getCachedOrExecute(prompt, async () => {
      const { text: result } = await generateText({ model: this.provider, prompt });
      return result.trim();
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/ai-core/src/services/ai.service.ts
git commit -m "feat(ai-core): implement AIService with extraction, classification, summarization and caching (FR-003, FR-006)"
```
