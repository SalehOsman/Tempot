import type { AiResponse, JevClient } from '@tembot/ai-core';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { err, ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';
import { AiGatewayService } from '../src/application/ai-gateway-service.js';
import type { DeepSeekProvider } from '../src/application/providers/deepseek-provider.js';
import type { GeminiProvider } from '../src/application/providers/gemini-provider.js';
import { AiGatewayError } from '../src/domain/types.js';

describe('AiGatewayService Specification', () => {
  const createMockDb = () => {
    return {
      insert: () => ({
        values: () => ({
          catch: () => {},
        }),
      }),
    } as unknown as PgDatabase<Record<string, never>>;
  };

  const sampleAiResponse: AiResponse = {
    text: 'Synthetic response',
    model: 'gemini-2.5-flash',
    provider: 'gemini',
    tokenUsage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      estimatedCostUsd: 0.00001,
    },
    durationMs: 45,
  };

  it('evaluates System One decisions via JevClient', async () => {
    const mockDb = createMockDb();
    const mockJevClient = {
      evaluateDecision: vi.fn().mockResolvedValue(
        ok({
          decision: { action: 'open_support' },
          confidence: 0.96,
          isHighConfidence: true,
          category: 'support',
          durationMs: 8,
        }),
      ),
    } as unknown as JevClient;

    const mockGemini = {} as GeminiProvider;
    const mockDeepSeek = {} as DeepSeekProvider;

    const gateway = new AiGatewayService({
      db: mockDb,
      jevClient: mockJevClient,
      geminiProvider: mockGemini,
      deepseekProvider: mockDeepSeek,
    });

    const result = await gateway.evaluateDecision({ message: 'Need help' });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.confidence).toBe(0.96);
      expect(result.value.isHighConfidence).toBe(true);
    }
  });

  it('generates System Two response with automatic fallback to DeepSeek when Gemini fails', async () => {
    const mockDb = createMockDb();
    const mockJevClient = {} as JevClient;

    const mockGemini = {
      generate: vi
        .fn()
        .mockResolvedValue(err(new AiGatewayError('RATE_LIMITED', 'Gemini exhausted', 429))),
    } as unknown as GeminiProvider;

    const mockDeepSeek = {
      generate: vi.fn().mockResolvedValue(
        ok({
          ...sampleAiResponse,
          provider: 'deepseek',
          model: 'deepseek-v3',
        }),
      ),
    } as unknown as DeepSeekProvider;

    const gateway = new AiGatewayService({
      db: mockDb,
      jevClient: mockJevClient,
      geminiProvider: mockGemini,
      deepseekProvider: mockDeepSeek,
    });

    const result = await gateway.generateResponse({
      tenantId: '00000000-0000-0000-0000-000000000000',
      actorId: 'user_1',
      prompt: { userMessage: 'Explain quantum computing' },
      preferredTier: 'fast',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.provider).toBe('deepseek');
    }

    expect(mockGemini.generate).toHaveBeenCalledTimes(1);
    expect(mockDeepSeek.generate).toHaveBeenCalledTimes(1);
  });
});
