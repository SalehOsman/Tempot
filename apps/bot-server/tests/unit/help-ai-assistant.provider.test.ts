import { ok, err } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { AppError } from '@tempot/shared';
import { createHelpAiAssistantProvider } from '../../src/startup/help-ai-assistant.provider.js';

describe('help AI assistant provider', () => {
  it('returns a grounded answer with citations when RAG has context', async () => {
    const provider = createHelpAiAssistantProvider({
      retrieve: async () =>
        ok({
          hasResults: true,
          context: '[developer-docs] Backup Guide:\nUse Backup Management to request a backup.',
          sources: [
            {
              contentId: 'docs:backup:0',
              contentType: 'developer-docs',
              score: 0.91,
              metadata: { filePath: 'docs/product/en/guides/backup.md' },
            },
          ],
        }),
    });

    const result = await provider.ask({
      question: 'How do I request a backup?',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'en',
    });

    expect(result).toEqual({
      success: true,
      value: {
        state: 'answered',
        answer: 'Use Backup Management to request a backup.',
        citations: [{ blockId: 'docs:backup:0', sourceId: 'docs/product/en/guides/backup.md' }],
        confidence: 0.91,
      },
    });
  });

  it('returns no-context when RAG has no authorized results', async () => {
    const provider = createHelpAiAssistantProvider({
      retrieve: async () => ok({ hasResults: false, context: '', sources: [] }),
    });

    const result = await provider.ask({
      question: 'unknown',
      userId: '123',
      chatId: '456',
      role: 'USER',
      locale: 'en',
    });

    expect(result).toEqual({
      success: true,
      value: { state: 'no-context', answer: '', citations: [], confidence: 0 },
    });
  });

  it('returns degraded when RAG retrieval fails', async () => {
    const provider = createHelpAiAssistantProvider({
      retrieve: async () => err(new AppError('ai-core.rag_search_failed')),
    });

    const result = await provider.ask({
      question: 'backup',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'en',
    });

    expect(result).toEqual({ success: false, error: { code: 'ai-core.rag_search_failed' } });
  });

  it('classifies provider quota failures as a human-actionable error', async () => {
    const quotaError = new Error('You exceeded your current quota for embed_content');
    const providerError = new AppError('ai-core.provider.unavailable', quotaError);
    const provider = createHelpAiAssistantProvider({
      retrieve: async () => err(new AppError('ai-core.rag.search_failed', providerError)),
    });

    const result = await provider.ask({
      question: 'backup',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'en',
    });

    expect(result).toEqual({
      success: false,
      error: { code: 'ai-core.provider.quota_exceeded' },
    });
  });
});
