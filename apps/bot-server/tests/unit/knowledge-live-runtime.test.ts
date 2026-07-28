import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { liveKnowledgeDeps } from '../../src/startup/knowledge-live-runtime.js';

describe('liveKnowledgeDeps', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses OPENAI_API_KEY when the embedding provider is openai', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    process.env.AI_EMBEDDING_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const deps = liveKnowledgeDeps({
      logger: createLogger(),
      eventBus: { publish: vi.fn() },
    } as never);

    await expect(deps.providerConfigured()).resolves.toBe(true);
  });

  it('uses dynamic embedding provider settings before env provider defaults', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    process.env.AI_EMBEDDING_PROVIDER = 'gemini';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const deps = liveKnowledgeDeps({
      logger: createLogger(),
      eventBus: { publish: vi.fn() },
      settings: {
        get: vi.fn(async (key: string) => (key === 'ai_embedding_provider' ? 'openai' : null)),
        set: vi.fn(),
      },
    } as never);

    await expect(deps.providerConfigured()).resolves.toBe(true);
  });
});

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}
