import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  createProviderRegistry: vi.fn(),
  wrapLanguageModel: vi.fn(),
  google: { chat: vi.fn() },
  openai: { chat: vi.fn() },
}));

vi.mock('ai', () => ({
  experimental_createProviderRegistry: mocks.createProviderRegistry,
  wrapLanguageModel: mocks.wrapLanguageModel,
}));

vi.mock('@ai-sdk/google', () => ({
  google: mocks.google,
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: mocks.openai,
}));

import {
  createAIProviderRegistry,
  getModelId,
  getWrappedModel,
} from '../../src/provider/ai-provider.factory.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import type { AIConfig } from '../../src/ai-core.types.js';
import { DEFAULT_AI_CONFIG } from '../../src/ai-core.types.js';

describe('AIProviderFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAIProviderRegistry', () => {
    it('returns ok(registry) with valid config', () => {
      const mockRegistry = { languageModel: vi.fn() };
      mocks.createProviderRegistry.mockReturnValue(mockRegistry);

      const result = createAIProviderRegistry(DEFAULT_AI_CONFIG);
      expect(result.isOk()).toBe(true);
      expect(mocks.createProviderRegistry).toHaveBeenCalledWith({
        google: mocks.google,
        openai: mocks.openai,
      });
    });

    it('returns err(DISABLED) when config.enabled is false', () => {
      const config: AIConfig = { ...DEFAULT_AI_CONFIG, enabled: false };
      const result = createAIProviderRegistry(config);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.DISABLED);
    });

    it('returns err(PROVIDER_AUTH_FAILED) when provider throws', () => {
      mocks.createProviderRegistry.mockImplementation(() => {
        throw new Error('Auth failed');
      });
      const result = createAIProviderRegistry(DEFAULT_AI_CONFIG);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.PROVIDER_AUTH_FAILED);
    });
  });

  describe('getModelId', () => {
    it('returns google:gemini-2.0-flash for gemini chat', () => {
      expect(getModelId(DEFAULT_AI_CONFIG, 'chat')).toBe('google:gemini-2.0-flash');
    });

    it('returns openai:gpt-4o for openai chat', () => {
      const config: AIConfig = { ...DEFAULT_AI_CONFIG, provider: 'openai' };
      expect(getModelId(config, 'chat')).toBe('openai:gpt-4o');
    });

    it('returns google:{embeddingModel} for embedding (always google)', () => {
      expect(getModelId(DEFAULT_AI_CONFIG, 'embedding')).toBe('google:gemini-embedding-2-preview');
    });
  });

  describe('getWrappedModel', () => {
    it('applies middleware chain in order', () => {
      const baseModel = { modelId: 'test' };
      const wrappedModel1 = { modelId: 'wrapped1' };
      const wrappedModel2 = { modelId: 'wrapped2' };
      const mockRegistry = { languageModel: vi.fn().mockReturnValue(baseModel) };

      mocks.wrapLanguageModel.mockReturnValueOnce(wrappedModel1).mockReturnValueOnce(wrappedModel2);

      const mw1 = { wrapGenerate: vi.fn() };
      const mw2 = { wrapGenerate: vi.fn() };

      const result = getWrappedModel(
        mockRegistry as unknown as Parameters<typeof getWrappedModel>[0],
        'google:gemini-2.0-flash',
        [mw1, mw2],
      );

      expect(mockRegistry.languageModel).toHaveBeenCalledWith('google:gemini-2.0-flash');
      expect(mocks.wrapLanguageModel).toHaveBeenCalledTimes(2);
      expect(mocks.wrapLanguageModel).toHaveBeenNthCalledWith(1, {
        model: baseModel,
        middleware: mw1,
      });
      expect(mocks.wrapLanguageModel).toHaveBeenNthCalledWith(2, {
        model: wrappedModel1,
        middleware: mw2,
      });
      expect(result).toBe(wrappedModel2);
    });
  });
});
