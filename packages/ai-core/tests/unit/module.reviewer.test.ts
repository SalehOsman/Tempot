import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { EmbeddingSearchResult } from '../../src/ai-core.types.js';
import { ModuleReviewer } from '../../src/cli/module.reviewer.js';
import type { ModuleReviewerDeps } from '../../src/cli/module.reviewer.js';
import type { RAGContext } from '../../src/rag/rag-pipeline.service.js';

// --- Mock: generateText from 'ai' ---
const mockGenerateText = vi.fn();
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

// --- Mock factories ---
function createMockRAGPipeline() {
  return {
    retrieve: vi.fn(),
  };
}

function createMockResilience() {
  return {
    executeGeneration: vi.fn(),
    executeEmbedding: vi.fn(),
    isCircuitOpen: vi.fn().mockReturnValue(false),
  };
}

function createMockRegistry() {
  return {
    languageModel: vi.fn().mockReturnValue('mock-model'),
    textEmbeddingModel: vi.fn().mockReturnValue('mock-embedding-model'),
  };
}

// --- Test data ---
const devDocSources: EmbeddingSearchResult[] = [
  {
    contentId: 'doc-architecture',
    contentType: 'developer-docs',
    score: 0.92,
    metadata: { title: 'Architecture Guide' },
  },
];

const ragContextWithResults: RAGContext = {
  hasResults: true,
  context: '[developer-docs] Architecture Guide: (score: 0.92)',
  sources: devDocSources,
};

const ragContextEmpty: RAGContext = {
  hasResults: false,
  context: '',
  sources: [],
};

/** Helper to build a structured AI response JSON for all 5 checks */
function buildStructuredResponse(
  overrides: Partial<Record<string, { passed: boolean; detail: string }>> = {},
): string {
  const defaults: Record<string, { passed: boolean; detail: string }> = {
    'config-completeness': { passed: true, detail: 'Config is complete' },
    'missing-events': { passed: true, detail: 'All events present' },
    'ux-compliance': { passed: true, detail: 'UX patterns followed' },
    'i18n-completeness': { passed: true, detail: 'i18n keys complete' },
    'test-suggestions': { passed: true, detail: 'Test coverage adequate' },
  };
  const merged = { ...defaults, ...overrides };
  return JSON.stringify(merged);
}

describe('ModuleReviewer', () => {
  let reviewer: ModuleReviewer;
  let ragPipeline: ReturnType<typeof createMockRAGPipeline>;
  let resilience: ReturnType<typeof createMockResilience>;
  let registry: ReturnType<typeof createMockRegistry>;

  beforeEach(() => {
    vi.clearAllMocks();
    ragPipeline = createMockRAGPipeline();
    resilience = createMockResilience();
    registry = createMockRegistry();

    const deps: ModuleReviewerDeps = {
      ragPipeline: ragPipeline as never,
      resilience: resilience as never,
      registry,
      modelId: 'gemini-2.0-flash',
    };
    reviewer = new ModuleReviewer(deps);
  });

  describe('review', () => {
    it('returns ReviewResult with checks array and score when all checks pass', async () => {
      ragPipeline.retrieve.mockResolvedValue(ok(ragContextWithResults));
      resilience.executeGeneration.mockImplementation(async (fn: () => Promise<string>) => {
        const text = await fn();
        return ok(text);
      });
      mockGenerateText.mockResolvedValue({ text: buildStructuredResponse() });

      const result = await reviewer.review('auth-core');

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.moduleName).toBe('auth-core');
      expect(value.checks).toHaveLength(5);
      expect(value.score).toBe(5);
      // All checks passed
      for (const check of value.checks) {
        expect(check.passed).toBe(true);
        expect(check.checkName).toBeDefined();
        expect(check.detail).toBeDefined();
      }
    });

    it('returns correct score when some checks fail', async () => {
      ragPipeline.retrieve.mockResolvedValue(ok(ragContextWithResults));
      resilience.executeGeneration.mockImplementation(async (fn: () => Promise<string>) => {
        const text = await fn();
        return ok(text);
      });
      mockGenerateText.mockResolvedValue({
        text: buildStructuredResponse({
          'missing-events': { passed: false, detail: 'Missing event: module.initialized' },
          'i18n-completeness': { passed: false, detail: 'Missing key: auth.error.expired' },
        }),
      });

      const result = await reviewer.review('auth-core');

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.score).toBe(3);
      expect(value.checks.filter((c) => c.passed)).toHaveLength(3);
      expect(value.checks.filter((c) => !c.passed)).toHaveLength(2);
    });

    it('includes all 5 check names in the result', async () => {
      ragPipeline.retrieve.mockResolvedValue(ok(ragContextWithResults));
      resilience.executeGeneration.mockImplementation(async (fn: () => Promise<string>) => {
        const text = await fn();
        return ok(text);
      });
      mockGenerateText.mockResolvedValue({ text: buildStructuredResponse() });

      const result = await reviewer.review('shared');

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      const checkNames = value.checks.map((c) => c.checkName);
      expect(checkNames).toContain('config-completeness');
      expect(checkNames).toContain('missing-events');
      expect(checkNames).toContain('ux-compliance');
      expect(checkNames).toContain('i18n-completeness');
      expect(checkNames).toContain('test-suggestions');
    });

    it('returns empty checks with score 0 when no RAG results found', async () => {
      ragPipeline.retrieve.mockResolvedValue(ok(ragContextEmpty));

      const result = await reviewer.review('unknown-module');

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.moduleName).toBe('unknown-module');
      expect(value.checks).toEqual([]);
      expect(value.score).toBe(0);
    });

    it('returns err when RAG pipeline fails', async () => {
      const ragError = new AppError('ai-core.rag.search_failed', 'RAG search failed');
      ragPipeline.retrieve.mockResolvedValue(err(ragError));

      const result = await reviewer.review('auth-core');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ai-core.rag.search_failed');
    });

    it('returns err when generation fails', async () => {
      ragPipeline.retrieve.mockResolvedValue(ok(ragContextWithResults));
      resilience.executeGeneration.mockResolvedValue(err(new Error('Provider unavailable')));

      const result = await reviewer.review('auth-core');

      expect(result.isErr()).toBe(true);
    });

    it('handles malformed AI response by returning all checks as failed', async () => {
      ragPipeline.retrieve.mockResolvedValue(ok(ragContextWithResults));
      resilience.executeGeneration.mockImplementation(async (fn: () => Promise<string>) => {
        const text = await fn();
        return ok(text);
      });
      mockGenerateText.mockResolvedValue({ text: 'not valid json at all' });

      const result = await reviewer.review('auth-core');

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.checks).toHaveLength(5);
      expect(value.score).toBe(0);
      for (const check of value.checks) {
        expect(check.passed).toBe(false);
      }
    });

    it('calls RAG with developer role and module-specific query', async () => {
      ragPipeline.retrieve.mockResolvedValue(ok(ragContextEmpty));

      await reviewer.review('session-manager');

      expect(ragPipeline.retrieve).toHaveBeenCalledWith({
        query: expect.stringContaining('session-manager'),
        userRole: 'developer',
        userId: 'cli',
      });
    });
  });
});
