import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AIConfig, EmbeddingInput, EmbeddingSearchOptions } from '../../src/ai-core.types.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';

// --- Mock: ai module ---
const mockEmbed = vi.fn();
vi.mock('ai', () => ({
  embed: (...args: unknown[]) => mockEmbed(...args),
}));

// --- Mock: @tempot/database ---
// We need to mock both DrizzleVectorRepository and embeddings.
// DrizzleVectorRepository must be a real class that EmbeddingService can extend.
const mockCreate = vi.fn();
const mockEmbeddingsTable = {
  contentId: Symbol('contentId'),
  contentType: Symbol('contentType'),
  vector: Symbol('vector'),
  metadata: Symbol('metadata'),
};

vi.mock('@tempot/database', () => {
  class MockDrizzleVectorRepository {
    protected db: unknown;
    constructor(db: unknown) {
      this.db = db;
    }
    create = mockCreate;
  }
  return {
    DrizzleVectorRepository: MockDrizzleVectorRepository,
    embeddings: mockEmbeddingsTable,
    DB_CONFIG: { VECTOR_DIMENSIONS: 3072 },
  };
});

// --- Mock: drizzle-orm ---
const mockSql = Object.assign(
  vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    type: 'sql',
    strings: Array.from(strings),
    values,
  })),
  {
    raw: vi.fn((value: string) => ({ type: 'sql.raw', value })),
  },
);
vi.mock('drizzle-orm', () => ({
  and: vi.fn((...conditions: unknown[]) => ({ type: 'and', conditions })),
  inArray: vi.fn((col: unknown, vals: unknown[]) => ({ type: 'inArray', col, vals })),
  sql: mockSql,
}));

// --- Test config ---
const testConfig: AIConfig = {
  enabled: true,
  provider: 'gemini',
  embeddingModel: 'gemini-embedding-2-preview',
  embeddingDimensions: 3072,
  confidenceThreshold: 0.7,
  generationTimeoutMs: 30_000,
  embeddingTimeoutMs: 10_000,
};

// --- Mock: ResilienceService ---
function createMockResilience() {
  return {
    executeEmbedding: vi.fn(),
    executeGeneration: vi.fn(),
    isCircuitOpen: vi.fn().mockReturnValue(false),
  };
}

// --- Mock: Provider registry ---
function createMockRegistry() {
  return {
    languageModel: vi.fn().mockReturnValue('mock-model'),
  };
}

// --- Mock: db with chainable query builder ---
function createMockDb() {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  const deleteChain = {
    where: vi.fn().mockResolvedValue(undefined),
  };
  return {
    select: vi.fn(() => chain),
    delete: vi.fn(() => deleteChain),
    insert: vi.fn(),
    chain,
    deleteChain,
  };
}

describe('EmbeddingService', () => {
  let service: InstanceType<
    (typeof import('../../src/embedding/embedding.service.js'))['EmbeddingService']
  >;
  let resilience: ReturnType<typeof createMockResilience>;
  let registry: ReturnType<typeof createMockRegistry>;
  let db: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    vi.clearAllMocks();
    resilience = createMockResilience();
    registry = createMockRegistry();
    db = createMockDb();

    // Dynamic import to get the class after mocks are set up
    const { EmbeddingService } = await import('../../src/embedding/embedding.service.js');

    // By default, resilience passes through the fn
    resilience.executeEmbedding.mockImplementation(async (fn: () => Promise<unknown>) => {
      try {
        const result = await fn();
        return ok(result);
      } catch (e) {
        return err(new AppError(AI_ERRORS.EMBEDDING_FAILED, e));
      }
    });

    // By default, embed returns a fixed vector
    mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });

    // By default, create returns a stored embedding
    mockCreate.mockResolvedValue(
      ok({
        id: 'emb-123',
        contentId: 'doc-1',
        contentType: 'ui-guide',
        vector: [0.1, 0.2, 0.3],
        metadata: null,
      }),
    );

    service = new EmbeddingService(db as never, {
      config: testConfig,
      resilience: resilience as never,
      registry,
    });
  });

  describe('embedAndStore', () => {
    it('stores embedding and returns ID', async () => {
      const input: EmbeddingInput = {
        contentId: 'doc-1',
        contentType: 'ui-guide',
        content: 'How to use the dashboard',
        metadata: { title: 'Dashboard Guide' },
      };

      const result = await service.embedAndStore(input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('emb-123');

      // Verify embed was called via resilience
      expect(resilience.executeEmbedding).toHaveBeenCalledOnce();

      // Verify create was called with correct data
      expect(mockCreate).toHaveBeenCalledWith({
        contentId: 'doc-1',
        contentType: 'ui-guide',
        vector: [0.1, 0.2, 0.3],
        metadata: { title: 'Dashboard Guide' },
      });
    });

    it('returns err(EMBEDDING_FAILED) on generation failure', async () => {
      resilience.executeEmbedding.mockResolvedValue(
        err(new AppError(AI_ERRORS.EMBEDDING_FAILED, new Error('provider down'))),
      );

      const input: EmbeddingInput = {
        contentId: 'doc-2',
        contentType: 'bot-functions',
        content: 'Some content',
      };

      const result = await service.embedAndStore(input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.EMBEDDING_FAILED);

      // create should not be called when embedding fails
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('searchSimilar', () => {
    it('filters by contentType', async () => {
      const searchResults = [
        {
          contentId: 'doc-1',
          contentType: 'ui-guide',
          score: 0.85,
          metadata: null,
        },
      ];
      db.chain.limit.mockResolvedValue(searchResults);

      const options: EmbeddingSearchOptions = {
        query: 'how to use dashboard',
        contentTypes: ['ui-guide'],
        limit: 5,
      };

      const result = await service.searchSimilar(options);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(searchResults);

      // Verify the query chain was built
      expect(db.select).toHaveBeenCalled();
      expect(db.chain.from).toHaveBeenCalled();
      expect(db.chain.where).toHaveBeenCalled();
      expect(db.chain.orderBy).toHaveBeenCalled();
      expect(db.chain.limit).toHaveBeenCalledWith(5);
    });

    it('applies confidence threshold', async () => {
      db.chain.limit.mockResolvedValue([]);

      const options: EmbeddingSearchOptions = {
        query: 'search text',
        contentTypes: ['ui-guide'],
        confidenceThreshold: 0.9,
      };

      const result = await service.searchSimilar(options);

      expect(result.isOk()).toBe(true);
      // The query was built with the custom threshold
      expect(db.chain.where).toHaveBeenCalled();
    });

    it('returns empty for no results', async () => {
      db.chain.limit.mockResolvedValue([]);

      const options: EmbeddingSearchOptions = {
        query: 'something obscure',
        contentTypes: ['developer-docs'],
      };

      const result = await service.searchSimilar(options);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('returns err(RAG_SEARCH_FAILED) when embedding generation fails', async () => {
      resilience.executeEmbedding.mockResolvedValue(
        err(new AppError(AI_ERRORS.EMBEDDING_FAILED, new Error('provider down'))),
      );

      const options: EmbeddingSearchOptions = {
        query: 'search query',
        contentTypes: ['ui-guide'],
      };

      const result = await service.searchSimilar(options);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RAG_SEARCH_FAILED);
    });
  });

  describe('deleteByContentId', () => {
    it('deletes all embeddings for content', async () => {
      const result = await service.deleteByContentId('doc-1');

      expect(result.isOk()).toBe(true);
      expect(db.delete).toHaveBeenCalled();
      expect(db.deleteChain.where).toHaveBeenCalled();
    });

    it('returns err on delete failure', async () => {
      db.deleteChain.where.mockRejectedValue(new Error('DB connection lost'));

      const result = await service.deleteByContentId('doc-1');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.EMBEDDING_FAILED);
    });
  });

  describe('content formatting', () => {
    it('document formatting uses title: {title} | text: {content} prefix', async () => {
      const input: EmbeddingInput = {
        contentId: 'doc-1',
        contentType: 'ui-guide',
        content: 'Dashboard content here',
        metadata: { title: 'My Dashboard' },
      };

      await service.embedAndStore(input);

      // The embed function should receive formatted content via the resilience callback
      expect(resilience.executeEmbedding).toHaveBeenCalledOnce();

      // Extract the fn passed to executeEmbedding and verify the formatted content
      const embeddingFn = resilience.executeEmbedding.mock.calls[0][0] as () => Promise<unknown>;

      // Reset mockEmbed to capture the call when we invoke the fn
      mockEmbed.mockClear();
      mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
      await embeddingFn();

      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'title: My Dashboard | text: Dashboard content here',
        }),
      );
    });

    it('query formatting uses task: search result | query: {text} prefix', async () => {
      db.chain.limit.mockResolvedValue([]);

      const options: EmbeddingSearchOptions = {
        query: 'find dashboard',
        contentTypes: ['ui-guide'],
      };

      await service.searchSimilar(options);

      expect(resilience.executeEmbedding).toHaveBeenCalledOnce();

      // Extract and invoke the fn to check the formatted query
      const embeddingFn = resilience.executeEmbedding.mock.calls[0][0] as () => Promise<unknown>;
      mockEmbed.mockClear();
      mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
      await embeddingFn();

      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'task: search result | query: find dashboard',
        }),
      );
    });

    it('uses contentId as title when metadata.title is absent', async () => {
      const input: EmbeddingInput = {
        contentId: 'doc-no-title',
        contentType: 'bot-functions',
        content: 'Some bot function docs',
      };

      await service.embedAndStore(input);

      const embeddingFn = resilience.executeEmbedding.mock.calls[0][0] as () => Promise<unknown>;
      mockEmbed.mockClear();
      mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
      await embeddingFn();

      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'title: doc-no-title | text: Some bot function docs',
        }),
      );
    });
  });
});
