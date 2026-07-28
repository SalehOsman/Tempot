import type { Context } from 'grammy';
import { describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';
import type {
  IngestionSummary,
  KnowledgeOperationsProvider,
} from '../contracts/knowledge-operations.types.js';

function createDeps(provider: KnowledgeOperationsProvider): ModuleDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    i18n: {
      t: (key: string, options?: Record<string, unknown>) =>
        options ? `${key}:${JSON.stringify(options)}` : key,
    },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    knowledge: provider,
    config: moduleConfig(),
  };
}

function provider(): KnowledgeOperationsProvider {
  return {
    getReadiness: vi.fn(),
    listSourceProfiles: vi.fn(),
    addCustomProfile: vi.fn(),
    runDryRun: vi.fn(),
    requestWrite: vi.fn(),
    writeIndex: vi.fn().mockResolvedValue({ success: true, value: summary() }),
    confirmWrite: vi.fn(),
    requestFullReindex: vi.fn(),
    confirmFullReindex: vi.fn(),
    listJobs: vi.fn(),
    testQuery: vi.fn(),
    getProviderSettings: vi.fn(),
    setChatProvider: vi.fn(),
    setEmbeddingProvider: vi.fn(),
    setEmbeddingModel: vi.fn(),
  };
}

describe('knowledge-management one-step write', () => {
  it('writes the selected source without a separate confirmation step', async () => {
    const knowledge = provider();
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps(knowledge));
    const ctx = context('knowledge:write:product');

    await handleCallbackQuery(ctx);
    await flushPendingWork();

    expect(knowledge.writeIndex).toHaveBeenCalledWith('123', 'product');
    expect(knowledge.requestWrite).not.toHaveBeenCalled();
    expect(replies(ctx)).toEqual([
      'knowledge-management.view.write_completed:{"id":"job-1","profile":"product","processed":1,"skipped":0,"failed":0,"chunks":2}',
    ]);
  });
});

function context(callbackData: string): Context {
  return {
    callbackQuery: { data: callbackData, message: { message_id: 10 } },
    from: { id: 123 },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function summary(): IngestionSummary {
  return {
    jobId: 'job-1',
    profileId: 'product',
    mode: 'write',
    status: 'succeeded',
    processed: 1,
    skipped: 0,
    failed: 0,
    chunks: 2,
    hashesWritten: true,
  };
}

function moduleConfig(): ModuleDeps['config'] {
  return {
    name: 'knowledge-management',
    version: '0.1.0',
    requiredRole: 'SUPER_ADMIN',
    isActive: true,
    isCore: false,
    commands: [],
    features: {
      hasDatabase: true,
      hasNotifications: false,
      hasAttachments: false,
      hasExport: false,
      hasAI: true,
      hasInputEngine: false,
      hasImport: false,
      hasSearch: true,
      hasDynamicCMS: false,
      hasRegional: false,
    },
    requires: { packages: [], optional: [] },
  };
}

async function flushPendingWork(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function replies(ctx: Context): unknown[] {
  return (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0]);
}
