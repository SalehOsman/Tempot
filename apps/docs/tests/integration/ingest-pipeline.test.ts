import { describe, it, expect, vi } from 'vitest';
import { ok } from 'neverthrow';
import { chunkMarkdown, ContentIngestionService } from '@tempot/ai-core';
import type { ContentIngestionDeps, ChunkingConfig } from '@tempot/ai-core';
import { ingestFile } from '../../scripts/ingest-docs.js';
import type { IngestFileDeps } from '../../scripts/ingest-docs.js';

/** Build a mock EmbeddingService with embedAndStore + deleteByContentId */
function createMockEmbeddingService() {
  return {
    embedAndStore: vi.fn().mockResolvedValue(ok('embed-id')),
    deleteByContentId: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

/** Build ContentIngestionService with mock EmbeddingService */
function createIngestionService(mockEmbedding: ReturnType<typeof createMockEmbeddingService>) {
  const config: ChunkingConfig = {
    chunkSizeTokens: 500,
    overlapTokens: 50,
    maxDocumentBytes: 10_485_760,
  };
  const deps: ContentIngestionDeps = {
    chunkingConfig: config,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    eventBus: {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
    },
  };
  return new ContentIngestionService(
    mockEmbedding as unknown as ConstructorParameters<typeof ContentIngestionService>[0],
    deps,
  );
}

describe('Ingest Pipeline Integration', () => {
  it('chunkMarkdown produces chunks from real markdown', () => {
    const markdown = [
      '---',
      'title: Test Doc',
      '---',
      '',
      '## Introduction',
      '',
      'This is the introduction section with some content.',
      '',
      '## Details',
      '',
      'Here are the details of the document.',
    ].join('\n');

    const result = chunkMarkdown(markdown, { filePath: 'en/test.md' });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBeGreaterThanOrEqual(1);
      expect(result.value[0].metadata).toHaveProperty('filePath', 'en/test.md');
      expect(result.value[0].metadata).toHaveProperty('language', 'en');
    }
  });

  it('ingestFile calls ContentIngestionService.ingest for each chunk', async () => {
    const mockEmbed = createMockEmbeddingService();
    const service = createIngestionService(mockEmbed);
    const deps: IngestFileDeps = { ingestionService: service };

    const markdown = [
      '---',
      'title: Integration Test',
      '---',
      '',
      '## Section One',
      '',
      'Content of section one.',
      '',
      '## Section Two',
      '',
      'Content of section two.',
    ].join('\n');

    const result = await ingestFile('en/integration.md', markdown, deps);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeGreaterThanOrEqual(1);
    }
    // Should have called deleteByContentId (re-indexing) and embedAndStore
    expect(mockEmbed.deleteByContentId).toHaveBeenCalled();
    expect(mockEmbed.embedAndStore).toHaveBeenCalled();
  });

  it('end-to-end: chunks are stored with correct contentId pattern', async () => {
    const mockEmbed = createMockEmbeddingService();
    const service = createIngestionService(mockEmbed);
    const deps: IngestFileDeps = { ingestionService: service };

    const markdown = '## Only Section\n\nSome content here.';
    await ingestFile('ar/guide.md', markdown, deps);

    // Verify deleteByContentId was called with docs: prefix
    const deleteCall = mockEmbed.deleteByContentId.mock.calls[0];
    expect(deleteCall[0] as string).toMatch(/^docs:ar\/guide\.md:\d+$/);

    // Verify embedAndStore received correct content
    const storeCall = mockEmbed.embedAndStore.mock.calls[0];
    const input = storeCall[0] as { contentId: string; contentType: string; content: string };
    expect(input.contentId).toMatch(/^docs:ar\/guide\.md:\d+$/);
    expect(input.contentType).toBe('developer-docs');
  });

  it('returns ok(0) for empty content with no sections', async () => {
    const mockEmbed = createMockEmbeddingService();
    const service = createIngestionService(mockEmbed);
    const deps: IngestFileDeps = { ingestionService: service };

    // Only frontmatter, no body content
    const markdown = '---\ntitle: Empty\n---\n';
    const result = await ingestFile('en/empty.md', markdown, deps);
    expect(result.isOk()).toBe(true);
  });

  it('handles Arabic content and preserves language metadata', async () => {
    const mockEmbed = createMockEmbeddingService();
    const service = createIngestionService(mockEmbed);
    const deps: IngestFileDeps = { ingestionService: service };

    const arabic = [
      '---',
      'title: دليل البداية',
      '---',
      '',
      '## المقدمة',
      '',
      'هذا هو المحتوى العربي للتوثيق.',
    ].join('\n');

    const result = await ingestFile('ar/getting-started.md', arabic, deps);
    expect(result.isOk()).toBe(true);
    expect(mockEmbed.embedAndStore).toHaveBeenCalled();

    // Verify Arabic language metadata propagated
    const storeCall = mockEmbed.embedAndStore.mock.calls[0];
    const input = storeCall[0] as { metadata?: Record<string, unknown> };
    expect(input.metadata).toHaveProperty('language', 'ar');
  });
});
