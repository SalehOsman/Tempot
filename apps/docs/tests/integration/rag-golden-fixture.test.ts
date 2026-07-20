import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import { chunkMarkdown } from '@tempot/ai-core';
import type { ContentIngestionService, IngestOptions } from '@tempot/ai-core';
import { ingestFile } from '../../scripts/ingest-docs.js';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(TEST_DIR, '../fixtures/rag-golden/en/guides/tempot-rag-golden.md');
const DOC_FILE_PATH = 'en/guides/tempot-rag-golden.md';

describe('RAG golden documentation fixture', () => {
  it('chunks a known documentation fixture with exact corpus metadata', async () => {
    const markdown = await readFile(FIXTURE_PATH, 'utf-8');

    expect(markdown).toContain('TEMPOT_RAG_GOLDEN_ALPHA');
    expect(markdown).toContain('/golden-smoke');

    const chunkResult = chunkMarkdown(markdown, { filePath: DOC_FILE_PATH });

    expect(chunkResult.isOk()).toBe(true);
    if (chunkResult.isErr()) return;

    expect(chunkResult.value).toHaveLength(3);
    expect(chunkResult.value.map((chunk) => chunk.metadata.section)).toEqual([
      'System Identity',
      'Deployment Contract',
      'Operator Smoke Question',
    ]);
    expect(chunkResult.value.map((chunk) => chunk.metadata.corpusSegment)).toEqual([
      'localized-product',
      'localized-product',
      'localized-product',
    ]);
    expect(chunkResult.value.map((chunk) => chunk.metadata.sourcePriority)).toEqual([70, 70, 70]);
    expect(chunkResult.value.map((chunk) => chunk.metadata.sourceOfTruth)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('ingests a known documentation fixture with stable content IDs and metadata', async () => {
    const markdown = await readFile(FIXTURE_PATH, 'utf-8');
    const capturedOptions: IngestOptions[] = [];
    const ingestionService = {
      ingest: async (options: IngestOptions) => {
        capturedOptions.push(options);
        return ok(1);
      },
    } as Pick<ContentIngestionService, 'ingest'> as ContentIngestionService;

    const ingestResult = await ingestFile(DOC_FILE_PATH, markdown, { ingestionService });

    expect(ingestResult.isOk()).toBe(true);
    if (ingestResult.isErr()) return;

    expect(ingestResult.value).toBe(3);
    expect(capturedOptions).toHaveLength(3);
    expect(capturedOptions.map((option) => option.contentId)).toEqual([
      'docs:en/guides/tempot-rag-golden.md:0',
      'docs:en/guides/tempot-rag-golden.md:1',
      'docs:en/guides/tempot-rag-golden.md:2',
    ]);
    expect(capturedOptions[0]).toMatchObject({
      contentType: 'developer-docs',
      source: 'auto',
      metadata: {
        filePath: DOC_FILE_PATH,
        language: 'en',
        section: 'System Identity',
        chunkIndex: 0,
        totalChunks: 3,
        corpusSegment: 'localized-product',
        sourcePriority: 70,
        sourceOfTruth: false,
      },
    });
    expect(capturedOptions[2]?.content).toContain('golden smoke is healthy');
  });
});
