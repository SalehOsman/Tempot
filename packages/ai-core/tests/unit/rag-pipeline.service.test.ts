import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { EmbeddingSearchResult } from '../../src/ai-core.types.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import { RAGPipeline } from '../../src/rag/rag-pipeline.service.js';

// --- Mock: EmbeddingService ---
function createMockEmbeddingService() {
  return {
    searchSimilar: vi.fn().mockResolvedValue(ok([])),
    embedAndStore: vi.fn(),
    deleteByContentId: vi.fn(),
  };
}

describe('RAGPipeline', () => {
  let pipeline: RAGPipeline;
  let embeddingService: ReturnType<typeof createMockEmbeddingService>;

  beforeEach(() => {
    vi.clearAllMocks();
    embeddingService = createMockEmbeddingService();
    pipeline = new RAGPipeline(embeddingService as never);
  });

  describe('role-based content access', () => {
    it('user role gets ui-guide + user-memory + custom-knowledge', async () => {
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      await pipeline.retrieve({
        query: 'how to use dashboard',
        userRole: 'user',
        userId: 'user-1',
      });

      const calledOptions = embeddingService.searchSimilar.mock.calls[0][0] as {
        contentTypes: string[];
      };
      expect(calledOptions.contentTypes).toContain('ui-guide');
      expect(calledOptions.contentTypes).toContain('user-memory');
      expect(calledOptions.contentTypes).toContain('custom-knowledge');
      expect(calledOptions.contentTypes).not.toContain('bot-functions');
      expect(calledOptions.contentTypes).not.toContain('db-schema');
      expect(calledOptions.contentTypes).not.toContain('developer-docs');
    });

    it('admin gets ui-guide + bot-functions + user-memory + custom-knowledge', async () => {
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      await pipeline.retrieve({
        query: 'admin query',
        userRole: 'admin',
        userId: 'admin-1',
      });

      const calledOptions = embeddingService.searchSimilar.mock.calls[0][0] as {
        contentTypes: string[];
      };
      expect(calledOptions.contentTypes).toContain('ui-guide');
      expect(calledOptions.contentTypes).toContain('bot-functions');
      expect(calledOptions.contentTypes).toContain('user-memory');
      expect(calledOptions.contentTypes).toContain('custom-knowledge');
      expect(calledOptions.contentTypes).not.toContain('db-schema');
      expect(calledOptions.contentTypes).not.toContain('developer-docs');
    });

    it('super admin gets ALL content types', async () => {
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      await pipeline.retrieve({
        query: 'super admin query',
        userRole: 'super_admin',
        userId: 'sa-1',
      });

      const calledOptions = embeddingService.searchSimilar.mock.calls[0][0] as {
        contentTypes: string[];
      };
      expect(calledOptions.contentTypes).toContain('ui-guide');
      expect(calledOptions.contentTypes).toContain('bot-functions');
      expect(calledOptions.contentTypes).toContain('db-schema');
      expect(calledOptions.contentTypes).toContain('developer-docs');
      expect(calledOptions.contentTypes).toContain('user-memory');
      expect(calledOptions.contentTypes).toContain('custom-knowledge');
    });

    it('developer role gets developer-docs', async () => {
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      await pipeline.retrieve({
        query: 'API docs query',
        userRole: 'developer',
        userId: 'dev-1',
      });

      const calledOptions = embeddingService.searchSimilar.mock.calls[0][0] as {
        contentTypes: string[];
      };
      expect(calledOptions.contentTypes).toContain('developer-docs');
      expect(calledOptions.contentTypes).toContain('user-memory');
      expect(calledOptions.contentTypes).toContain('custom-knowledge');
      expect(calledOptions.contentTypes).not.toContain('ui-guide');
      expect(calledOptions.contentTypes).not.toContain('bot-functions');
      expect(calledOptions.contentTypes).not.toContain('db-schema');
    });
  });

  describe('post-filtering', () => {
    it('user-memory results filtered by userId', async () => {
      const searchResults: EmbeddingSearchResult[] = [
        {
          contentId: 'mem-1',
          contentType: 'user-memory',
          score: 0.9,
          metadata: { userId: 'user-1', title: 'My Memory' },
        },
        {
          contentId: 'mem-2',
          contentType: 'user-memory',
          score: 0.85,
          metadata: { userId: 'user-other', title: 'Other Memory' },
        },
        {
          contentId: 'guide-1',
          contentType: 'ui-guide',
          score: 0.8,
          metadata: { title: 'Dashboard Guide' },
        },
      ];
      embeddingService.searchSimilar.mockResolvedValue(ok(searchResults));

      const result = await pipeline.retrieve({
        query: 'my preferences',
        userRole: 'user',
        userId: 'user-1',
      });

      expect(result.isOk()).toBe(true);
      const ctx = result._unsafeUnwrap();
      expect(ctx.hasResults).toBe(true);
      // Should include user-1's memory and the guide, but not user-other's memory
      expect(ctx.sources).toHaveLength(2);
      expect(ctx.sources.map((s) => s.contentId)).toContain('mem-1');
      expect(ctx.sources.map((s) => s.contentId)).toContain('guide-1');
      expect(ctx.sources.map((s) => s.contentId)).not.toContain('mem-2');
    });

    it('custom-knowledge filtered by accessRoles in metadata', async () => {
      const searchResults: EmbeddingSearchResult[] = [
        {
          contentId: 'ck-1',
          contentType: 'custom-knowledge',
          score: 0.9,
          metadata: { accessRoles: ['user', 'admin'], title: 'Public KB' },
        },
        {
          contentId: 'ck-2',
          contentType: 'custom-knowledge',
          score: 0.85,
          metadata: { accessRoles: ['admin'], title: 'Admin KB' },
        },
      ];
      embeddingService.searchSimilar.mockResolvedValue(ok(searchResults));

      const result = await pipeline.retrieve({
        query: 'knowledge query',
        userRole: 'user',
        userId: 'user-1',
      });

      expect(result.isOk()).toBe(true);
      const ctx = result._unsafeUnwrap();
      // User should only see ck-1 (accessRoles includes 'user'), not ck-2
      expect(ctx.sources).toHaveLength(1);
      expect(ctx.sources[0].contentId).toBe('ck-1');
    });
  });

  describe('empty/no results', () => {
    it('no results returns { hasResults: false, context: empty, sources: [] }', async () => {
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      const result = await pipeline.retrieve({
        query: 'obscure query',
        userRole: 'user',
        userId: 'user-1',
      });

      expect(result.isOk()).toBe(true);
      const ctx = result._unsafeUnwrap();
      expect(ctx.hasResults).toBe(false);
      expect(ctx.context).toBe('');
      expect(ctx.sources).toEqual([]);
    });

    it('empty accessible types returns empty result', async () => {
      // A role that has no entries in the access matrix
      // But user-memory and custom-knowledge are always added,
      // so we need all results post-filtered out
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      const result = await pipeline.retrieve({
        query: 'query',
        userRole: 'unknown_role',
        userId: 'user-1',
      });

      expect(result.isOk()).toBe(true);
      const ctx = result._unsafeUnwrap();
      expect(ctx.hasResults).toBe(false);
      expect(ctx.context).toBe('');
      expect(ctx.sources).toEqual([]);
    });
  });

  describe('confidence threshold', () => {
    it('confidence threshold passed to searchSimilar', async () => {
      embeddingService.searchSimilar.mockResolvedValue(ok([]));

      await pipeline.retrieve({
        query: 'high confidence query',
        userRole: 'user',
        userId: 'user-1',
        confidenceThreshold: 0.95,
      });

      const calledOptions = embeddingService.searchSimilar.mock.calls[0][0] as {
        confidenceThreshold: number;
      };
      expect(calledOptions.confidenceThreshold).toBe(0.95);
    });
  });

  describe('context formatting', () => {
    it('context string formatted as [contentType] title: (score: X.XX)', async () => {
      const searchResults: EmbeddingSearchResult[] = [
        {
          contentId: 'doc-1',
          contentType: 'ui-guide',
          score: 0.92,
          metadata: { title: 'Dashboard Guide' },
        },
        {
          contentId: 'doc-2',
          contentType: 'bot-functions',
          score: 0.88,
          metadata: { title: 'Bot Commands' },
        },
      ];
      embeddingService.searchSimilar.mockResolvedValue(ok(searchResults));

      const result = await pipeline.retrieve({
        query: 'how to use',
        userRole: 'admin',
        userId: 'admin-1',
      });

      expect(result.isOk()).toBe(true);
      const ctx = result._unsafeUnwrap();
      expect(ctx.context).toContain('[ui-guide] Dashboard Guide: (score: 0.92)');
      expect(ctx.context).toContain('[bot-functions] Bot Commands: (score: 0.88)');
      // Lines separated by double newline
      const lines = ctx.context.split('\n\n');
      expect(lines).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('returns err(RAG_SEARCH_FAILED) when searchSimilar fails', async () => {
      embeddingService.searchSimilar.mockResolvedValue(
        err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, new Error('search failed'))),
      );

      const result = await pipeline.retrieve({
        query: 'failing query',
        userRole: 'user',
        userId: 'user-1',
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RAG_SEARCH_FAILED);
    });
  });

  describe('context uses contentId when title is absent', () => {
    it('falls back to contentId when metadata.title is missing', async () => {
      const searchResults: EmbeddingSearchResult[] = [
        {
          contentId: 'doc-no-title',
          contentType: 'ui-guide',
          score: 0.75,
          metadata: null,
        },
      ];
      embeddingService.searchSimilar.mockResolvedValue(ok(searchResults));

      const result = await pipeline.retrieve({
        query: 'test query',
        userRole: 'user',
        userId: 'user-1',
      });

      expect(result.isOk()).toBe(true);
      const ctx = result._unsafeUnwrap();
      expect(ctx.context).toContain('[ui-guide] doc-no-title: (score: 0.75)');
    });
  });
});
