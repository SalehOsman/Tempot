import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { createKnowledgeOperationsProvider } from '../../src/startup/knowledge-operations.provider.js';

describe('knowledge operations provider', () => {
  it('reports readiness from injected runtime checks', async () => {
    const provider = createKnowledgeOperationsProvider(createDeps());

    const result = await provider.getReadiness('1');

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.embeddingsCount).toBe(3);
    expect(result.value.vectorReady).toBe(true);
    expect(result.value.mountedProfiles).toBeGreaterThan(0);
  });

  it('runs dry-run without storing embeddings', async () => {
    const deps = createDeps();
    const provider = createKnowledgeOperationsProvider(deps);

    const result = await provider.runDryRun('1', 'product');

    expect(result.success).toBe(true);
    expect(deps.ingestContent).not.toHaveBeenCalled();
    if (!result.success) return;
    expect(result.value.hashesWritten).toBe(false);
    expect(result.value.chunks).toBeGreaterThan(0);
  });

  it('rejects unknown source profiles', async () => {
    const provider = createKnowledgeOperationsProvider(createDeps());

    const result = await provider.runDryRun('1', '../.env');

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('knowledge.profile_not_allowed');
  });

  it('exposes product, operations, architecture, analysis, and full project profiles', async () => {
    const provider = createKnowledgeOperationsProvider(createDeps());

    const result = await provider.listSourceProfiles('1');

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.map((item) => item.id)).toEqual([
      'product',
      'operations',
      'architecture',
      'analysis',
      'full-project',
    ]);
  });

  it('stores custom profiles only for safe relative mounted roots', async () => {
    const deps = createDeps();
    const provider = createKnowledgeOperationsProvider(deps);

    const accepted = await provider.addCustomProfile('1', {
      name: 'Finance Docs',
      root: 'docs/finance',
      description: 'Finance module docs',
    });
    const rejected = await provider.addCustomProfile('1', {
      name: 'Secrets',
      root: '../.env',
      description: 'invalid',
    });

    expect(accepted.success).toBe(true);
    expect(rejected.success).toBe(false);
    expect(deps.saveCustomProfiles).toHaveBeenCalledTimes(1);
  });

  it('runs one-step write and records the ingestion job', async () => {
    const deps = createDeps();
    const provider = createKnowledgeOperationsProvider(deps);

    const result = await provider.writeIndex('1', 'product');
    const jobs = await provider.listJobs('1', 1);

    expect(result.success).toBe(true);
    expect(deps.ingestContent).toHaveBeenCalled();
    expect(jobs.success).toBe(true);
  });

  it('returns a safe failure reason when write ingestion fails', async () => {
    const deps = createDeps();
    deps.ingestContent.mockRejectedValue(new Error('ai-core.embedding.failed'));
    const provider = createKnowledgeOperationsProvider(deps);

    const result = await provider.writeIndex('1', 'product');

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('knowledge.ingestion_failed');
    expect(result.error.reason).toBe('embedding_failed');
    expect(deps.logger.warn).toHaveBeenCalled();
  });

  it('maps content chunk failures to embedding provider failures', async () => {
    const deps = createDeps();
    deps.ingestContent.mockRejectedValue(new Error('ai-core.content.chunk_failed'));
    const provider = createKnowledgeOperationsProvider(deps);

    const result = await provider.writeIndex('1', 'product');

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.reason).toBe('embedding_failed');
  });
});

function createDeps() {
  return {
    aiEnabled: () => true,
    providerConfigured: () => true,
    databaseConfigured: () => true,
    vectorReady: vi.fn().mockResolvedValue(true),
    countEmbeddings: vi.fn().mockResolvedValue(3),
    pathExists: vi.fn().mockResolvedValue(true),
    discoverMarkdownFiles: vi.fn().mockResolvedValue(['getting-started.md']),
    readTextFile: vi.fn().mockResolvedValue('## Start\n\nUse /ask for help.'),
    chunkMarkdown: vi.fn().mockResolvedValue(
      ok([
        {
          text: 'Use /ask for help.',
          chunkIndex: 0,
          totalChunks: 1,
          metadata: { filePath: 'docs/product/getting-started.md' },
        },
      ]),
    ),
    ingestContent: vi.fn().mockResolvedValue(undefined),
    loadCustomProfiles: vi.fn().mockResolvedValue([]),
    saveCustomProfiles: vi.fn().mockResolvedValue(undefined),
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
  };
}
