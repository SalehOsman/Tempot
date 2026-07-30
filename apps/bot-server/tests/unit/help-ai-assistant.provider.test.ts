import { ok, err } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '@tempot/shared';
import {
  createHelpAiAssistantProvider,
  type HelpRagRetriever,
} from '../../src/startup/help-ai-assistant.provider.js';

type CapturedRetrieveOptions = Parameters<HelpRagRetriever['retrieve']>[0];

const originalEmbeddingProvider = process.env.AI_EMBEDDING_PROVIDER;
const originalConfidenceThreshold = process.env.TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD;

describe('help AI assistant provider', () => {
  beforeEach(() => {
    delete process.env.AI_EMBEDDING_PROVIDER;
    delete process.env.TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD;
  });

  afterEach(() => {
    restoreEnvValue('AI_EMBEDDING_PROVIDER', originalEmbeddingProvider);
    restoreEnvValue('TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD', originalConfidenceThreshold);
  });

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

  it('builds a useful answer from multiple grounded snippets', async () => {
    const provider = createHelpAiAssistantProvider({
      retrieve: async () =>
        ok({
          hasResults: true,
          context: '',
          sources: [
            source({
              contentId: 'docs:backup:overview',
              score: 0.41,
              filePath: 'docs/product/ar/user-guide/backup-management.md',
              text: 'إدارة النسخ الاحتياطي من صلاحيات المدير العام فقط.',
            }),
            source({
              contentId: 'docs:backup:steps',
              score: 0.39,
              filePath: 'docs/product/ar/user-guide/backup-management.md',
              text: 'لإنشاء نسخة احتياطية افتح القائمة الرئيسية ثم افتح قائمة النسخ الاحتياطي ثم اضغط إنشاء نسخة احتياطية وانتظر رسالة اكتمال العملية.',
            }),
          ],
        }),
    });

    const result = await provider.ask({
      question: 'كيف يمكن عمل نسخة احتياطية؟',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'ar-EG',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.answer).toContain('إدارة النسخ الاحتياطي');
    expect(result.value.answer).toContain('لإنشاء نسخة احتياطية');
  });

  it('prefers Arabic snippets from file paths when stored language metadata is stale', async () => {
    const provider = createHelpAiAssistantProvider({
      retrieve: async () =>
        ok({
          hasResults: true,
          context: '',
          sources: [
            source({
              contentId: 'docs:backup:en',
              score: 0.42,
              filePath: 'docs/product/en/user-guide/backup-management.md',
              text: 'Create a backup from the Backups menu.',
            }),
            source({
              contentId: 'docs:backup:ar',
              score: 0.39,
              filePath: 'docs/product/ar/user-guide/backup-management.md',
              text: 'افتح قائمة النسخ الاحتياطي ثم اضغط إنشاء نسخة احتياطية.',
            }),
          ],
        }),
    });

    const result = await provider.ask({
      question: 'كيف يمكن عمل نسخة احتياطية؟',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'ar-EG',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.answer.startsWith('افتح قائمة النسخ الاحتياطي')).toBe(true);
  });

  it('returns no-context for weak cross-language matches', async () => {
    const provider = createHelpAiAssistantProvider({
      retrieve: async () =>
        ok({
          hasResults: true,
          context: '',
          sources: [
            source({
              contentId: 'docs:managed-bots',
              score: 0.38,
              filePath: 'docs/architecture/telegram-managed-bots-assessment.md',
              text: 'Telegram documents Managed Bots as a capability for manager bots.',
            }),
          ],
        }),
    });

    const result = await provider.ask({
      question: 'كيف يمكن إدارة المساعدة الذكية؟',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'ar-EG',
    });

    expect(result).toEqual({
      success: true,
      value: { state: 'no-context', answer: '', citations: [], confidence: 0 },
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

  it('uses an Ollama-friendly retrieval threshold for local embeddings', async () => {
    process.env.AI_EMBEDDING_PROVIDER = 'ollama';
    let capturedOptions: CapturedRetrieveOptions | undefined;
    const provider = createHelpAiAssistantProvider({
      retrieve: async (options) => {
        capturedOptions = options;
        return ok({ hasResults: false, context: '', sources: [] });
      },
    });

    await provider.ask({
      question: 'How do backups work?',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'en',
    });

    expect(capturedOptions?.confidenceThreshold).toBe(0.35);
  });

  it('allows the help retrieval threshold to be configured from the environment', async () => {
    process.env.AI_EMBEDDING_PROVIDER = 'ollama';
    process.env.TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD = '0.42';
    let capturedOptions: CapturedRetrieveOptions | undefined;
    const provider = createHelpAiAssistantProvider({
      retrieve: async (options) => {
        capturedOptions = options;
        return ok({ hasResults: false, context: '', sources: [] });
      },
    });

    await provider.ask({
      question: 'How do backups work?',
      userId: '123',
      chatId: '456',
      role: 'SUPER_ADMIN',
      locale: 'en',
    });

    expect(capturedOptions?.confidenceThreshold).toBe(0.42);
  });
});

interface TestSourceInput {
  readonly contentId: string;
  readonly score: number;
  readonly filePath: string;
  readonly text: string;
}

function source(input: TestSourceInput) {
  return {
    contentId: input.contentId,
    contentType: 'developer-docs',
    score: input.score,
    metadata: { filePath: input.filePath, text: input.text },
  };
}

function restoreEnvValue(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}
