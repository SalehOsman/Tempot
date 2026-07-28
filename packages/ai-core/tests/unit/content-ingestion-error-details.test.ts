import { describe, expect, it, vi } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import { ContentIngestionService } from '../../src/content/content-ingestion.service.js';
import type { AILogger, AIEventBus } from '../../src/ai-core.contracts.js';

describe('ContentIngestionService error details', () => {
  it('preserves embedding provider details on strict chunk failures', async () => {
    const embeddingFailure = new AppError(
      AI_ERRORS.EMBEDDING_FAILED,
      new Error('Quota exceeded for metric: embed_content_free_tier_requests'),
    );
    const embeddingService = {
      embedAndStore: vi.fn().mockResolvedValue(err(embeddingFailure)),
      deleteByContentId: vi.fn().mockResolvedValue(ok(undefined)),
    };
    const service = new ContentIngestionService(embeddingService as never, {
      chunkingConfig: { chunkSizeTokens: 500, overlapTokens: 50, maxDocumentBytes: 10_485_760 },
      logger: createLogger(),
      eventBus: createEventBus(),
    });

    const result = await service.ingest({
      contentId: 'doc-quota',
      contentType: 'developer-docs',
      content: 'content that fails while embedding',
      strict: true,
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe(AI_ERRORS.CONTENT_CHUNK_FAILED);
    expect(result.error.details).toEqual(
      expect.objectContaining({
        error: AI_ERRORS.EMBEDDING_FAILED,
        cause: embeddingFailure,
      }),
    );
  });
});

function createLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createEventBus(): AIEventBus {
  return {
    publish: vi.fn().mockResolvedValue(ok(undefined)),
    subscribe: vi.fn(),
  };
}
