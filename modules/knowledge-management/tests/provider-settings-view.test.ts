import { describe, expect, it, vi } from 'vitest';
import { KnowledgeViewService } from '../services/knowledge-view.service.js';
import type {
  KnowledgeOperationResult,
  KnowledgeOperationsProvider,
  KnowledgeProviderSettingsSnapshot,
} from '../contracts/knowledge-operations.types.js';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

describe('KnowledgeViewService provider settings', () => {
  it('renders active provider settings from the operations provider', async () => {
    const service = new KnowledgeViewService(provider());

    await expect(service.renderProviderSettings(t, '123')).resolves.toBe(
      'knowledge-management.view.providers:{"chat":"gemini","chatReady":"knowledge-management.value.yes","embedding":"openai","embeddingReady":"knowledge-management.value.yes","model":"text-embedding-3-large"}',
    );
  });

  it('updates the active chat provider through the operations provider', async () => {
    const operations = provider();
    const service = new KnowledgeViewService(operations);

    await expect(service.renderSetChatProvider(t, '123', 'deepseek')).resolves.toBe(
      'knowledge-management.view.provider_updated:{"provider":"deepseek"}',
    );
    expect(operations.setChatProvider).toHaveBeenCalledWith('123', 'deepseek');
  });

  it('shows a reindex warning after changing the embedding provider', async () => {
    const operations = provider();
    const service = new KnowledgeViewService(operations);

    await expect(service.renderSetEmbeddingProvider(t, '123', 'gemini')).resolves.toBe(
      'knowledge-management.view.embedding_provider_updated:{"provider":"gemini"}',
    );
    expect(operations.setEmbeddingProvider).toHaveBeenCalledWith('123', 'gemini');
  });

  it('updates ollama as an embedding provider through the operations provider', async () => {
    const operations = provider();
    const service = new KnowledgeViewService(operations);

    await expect(service.renderSetEmbeddingProvider(t, '123', 'ollama')).resolves.toBe(
      'knowledge-management.view.embedding_provider_updated:{"provider":"ollama"}',
    );
    expect(operations.setEmbeddingProvider).toHaveBeenCalledWith('123', 'ollama');
  });
});

function provider(): KnowledgeOperationsProvider {
  return {
    getReadiness: vi.fn(),
    listSourceProfiles: vi.fn(),
    addCustomProfile: vi.fn(),
    runDryRun: vi.fn(),
    requestWrite: vi.fn(),
    writeIndex: vi.fn(),
    confirmWrite: vi.fn(),
    requestFullReindex: vi.fn(),
    confirmFullReindex: vi.fn(),
    listJobs: vi.fn(),
    testQuery: vi.fn(),
    getProviderSettings: vi.fn().mockResolvedValue(success(settings())),
    setChatProvider: vi.fn().mockResolvedValue(success(undefined)),
    setEmbeddingProvider: vi.fn().mockResolvedValue(success(undefined)),
    setEmbeddingModel: vi.fn().mockResolvedValue(success(undefined)),
  };
}

function settings(): KnowledgeProviderSettingsSnapshot {
  return {
    chatProvider: 'gemini',
    chatProviderConfigured: true,
    embeddingProvider: 'openai',
    embeddingProviderConfigured: true,
    embeddingModel: 'text-embedding-3-large',
  };
}

function success<T>(value: T): KnowledgeOperationResult<T> {
  return { success: true, value };
}
