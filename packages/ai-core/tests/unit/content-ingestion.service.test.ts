import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { ChunkingConfig } from '../../src/ai-core.types.js';
import type { AILogger, AIEventBus } from '../../src/ai-core.contracts.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';

// --- Mock: logger ---
function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

// --- Mock: event bus ---
function createMockEventBus(): AIEventBus {
  return {
    publish: vi.fn().mockResolvedValue(ok(undefined)),
    subscribe: vi.fn(),
  };
}

// --- Mock: EmbeddingService ---
function createMockEmbeddingService() {
  return {
    embedAndStore: vi.fn().mockResolvedValue(ok('emb-id-1')),
    deleteByContentId: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

// --- Test chunking config ---
const testChunkingConfig: ChunkingConfig = {
  chunkSizeTokens: 500,
  overlapTokens: 50,
  maxDocumentBytes: 10_485_760, // 10 MB
};

describe('ContentIngestionService', () => {
  let service: InstanceType<
    (typeof import('../../src/content/content-ingestion.service.js'))['ContentIngestionService']
  >;
  let embeddingService: ReturnType<typeof createMockEmbeddingService>;
  let logger: AILogger;
  let eventBus: AIEventBus;

  beforeEach(async () => {
    vi.clearAllMocks();
    embeddingService = createMockEmbeddingService();
    logger = createMockLogger();
    eventBus = createMockEventBus();

    const { ContentIngestionService } =
      await import('../../src/content/content-ingestion.service.js');
    service = new ContentIngestionService(embeddingService as never, {
      chunkingConfig: testChunkingConfig,
      logger,
      eventBus,
    });
  });

  describe('ingest', () => {
    it('stores chunks and returns count', async () => {
      const result = await service.ingest({
        contentId: 'doc-1',
        contentType: 'ui-guide',
        content: 'Hello world this is a short document.',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeGreaterThanOrEqual(1);

      // embedAndStore should have been called for each chunk
      expect(embeddingService.embedAndStore).toHaveBeenCalled();
    });

    it('returns err(CONTENT_SIZE_EXCEEDED) for oversized content', async () => {
      // Create content larger than maxDocumentBytes (10 MB)
      const oversizedContent = 'x'.repeat(10_485_761);

      const result = await service.ingest({
        contentId: 'doc-big',
        contentType: 'developer-docs',
        content: oversizedContent,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.CONTENT_SIZE_EXCEEDED);

      // Should not attempt to embed oversized content
      expect(embeddingService.embedAndStore).not.toHaveBeenCalled();
    });

    it('re-indexing deletes old embeddings before storing new', async () => {
      await service.ingest({
        contentId: 'doc-reindex',
        contentType: 'custom-knowledge',
        content: 'Updated content for re-indexing.',
      });

      // deleteByContentId should be called before embedAndStore
      expect(embeddingService.deleteByContentId).toHaveBeenCalledWith('doc-reindex');

      const deleteCallOrder = embeddingService.deleteByContentId.mock.invocationCallOrder[0];
      const storeCallOrder = embeddingService.embedAndStore.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(storeCallOrder);
    });

    it('failed chunk is skipped (best-effort, not fatal)', async () => {
      // Create content large enough for multiple chunks
      const longContent = 'word '.repeat(1000);

      // First call fails, subsequent calls succeed
      embeddingService.embedAndStore
        .mockResolvedValueOnce(err(new AppError(AI_ERRORS.EMBEDDING_FAILED, 'chunk failed')))
        .mockResolvedValue(ok('emb-id-success'));

      const result = await service.ingest({
        contentId: 'doc-partial',
        contentType: 'bot-functions',
        content: longContent,
      });

      // Should still succeed even though first chunk failed
      expect(result.isOk()).toBe(true);

      // Count should reflect only stored chunks (not the failed one)
      const storedCount = result._unsafeUnwrap();
      const totalCalls = embeddingService.embedAndStore.mock.calls.length;
      expect(storedCount).toBe(totalCalls - 1);

      // Logger should warn about the failed chunk
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AI_ERRORS.CONTENT_CHUNK_FAILED,
          contentId: 'doc-partial',
        }),
      );
    });

    it('emits ai-core.content.indexed event after ingestion', async () => {
      await service.ingest({
        contentId: 'doc-event',
        contentType: 'db-schema',
        content: 'Some schema content.',
        source: 'manual',
      });

      expect(eventBus.publish).toHaveBeenCalledWith(
        'ai-core.content.indexed',
        expect.objectContaining({
          contentId: 'doc-event',
          contentType: 'db-schema',
          source: 'manual',
        }),
      );
    });
  });

  describe('sanitizePII', () => {
    it('replaces phone numbers with [PHONE]', () => {
      const input = 'Call me at +201234567890 or 01098765432.';
      const result = service.sanitizePII(input);

      expect(result).toContain('[PHONE]');
      expect(result).not.toMatch(/\+?\d{10,15}/);
    });

    it('replaces emails with [EMAIL]', () => {
      const input = 'Email me at john.doe@example.com for details.';
      const result = service.sanitizePII(input);

      expect(result).toContain('[EMAIL]');
      expect(result).not.toContain('john.doe@example.com');
    });

    it('replaces 14-digit national IDs with [NATIONAL_ID]', () => {
      const input = 'National ID: 29901011234567 is valid.';
      const result = service.sanitizePII(input);

      expect(result).toContain('[NATIONAL_ID]');
      expect(result).not.toContain('29901011234567');
    });
  });

  describe('chunkContent', () => {
    it('splits text with overlap (character-based with word boundary)', () => {
      // chunkSizeTokens=500 → 2000 chars; overlapTokens=50 → 200 chars overlap
      // Create text larger than one chunk (>2000 chars)
      const longText = 'hello world '.repeat(200); // ~2400 chars

      const chunks = service.chunkContent(longText, { source: 'test' });

      expect(chunks.length).toBeGreaterThan(1);

      // Verify overlap: end of first chunk should overlap with start of second
      const firstChunkEnd = chunks[0].text.slice(-200);
      const secondChunkStart = chunks[1].text.slice(0, 200);

      // There should be some shared text between chunks
      expect(secondChunkStart).toContain(firstChunkEnd.slice(-100));

      // totalChunks should be set correctly
      for (const chunk of chunks) {
        expect(chunk.totalChunks).toBe(chunks.length);
      }

      // chunkIndex should be sequential
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].chunkIndex).toBe(i);
      }
    });

    it('returns single chunk for small content', () => {
      const shortText = 'This is a short document.';
      const chunks = service.chunkContent(shortText, {});

      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe(shortText);
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[0].totalChunks).toBe(1);
    });
  });
});
