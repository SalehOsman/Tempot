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

    const result = await provider.runDryRun('1', 'product-help');

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
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
  };
}
