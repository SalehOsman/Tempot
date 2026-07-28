import type { Context } from 'grammy';
import { describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';
import type {
  IngestionSummary,
  KnowledgeOperationResult,
  KnowledgeOperationsProvider,
} from '../contracts/knowledge-operations.types.js';

type TestDeps = ModuleDeps & {
  authorization: {
    guard: ReturnType<typeof vi.fn>;
    enforce: ReturnType<typeof vi.fn>;
  };
};

function createDeps(): TestDeps {
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
    config: {
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
    },
  } as TestDeps;
}

function createContext(callbackData: string): Context {
  return {
    callbackQuery: { data: callbackData, message: { message_id: 10 } },
    from: { id: 123 },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function deferredProvider() {
  const control = {
    resolveWriteIndex: (): void => undefined,
    provider: baseProvider(),
  };
  control.provider.writeIndex = vi.fn(() => writePromise(control));
  return control;
}

function baseProvider(): KnowledgeOperationsProvider {
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
  };
}

function writePromise(control: ReturnType<typeof deferredProvider>) {
  return new Promise<KnowledgeOperationResult<IngestionSummary>>((resolve) => {
    control.resolveWriteIndex = () =>
      resolve({ success: false, error: { code: 'knowledge-management.write.failed' } });
  });
}

describe('knowledge-management background operations', () => {
  it('returns after showing loading for one-step write indexing', async () => {
    const deps = createDeps();
    const control = deferredProvider();
    deps.knowledge = control.provider;
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createContext('knowledge:write:product');

    const operation = handleCallbackQuery(ctx);
    await flushPendingWork();

    expect(firstEdit(ctx)).toBe('knowledge-management.view.write_waiting');
    await expect(Promise.race([operation.then(() => 'done'), immediate()])).resolves.toBe('done');
    control.resolveWriteIndex();
  });

  it('sends completion as a separate message', async () => {
    const deps = createDeps();
    deps.knowledge = { ...baseProvider(), writeIndex: vi.fn().mockResolvedValue(success()) };
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createContext('knowledge:write:product');

    await handleCallbackQuery(ctx);
    await flushPendingWork();

    expect(allEdits(ctx)).toEqual(['knowledge-management.view.write_waiting']);
    expect(allReplies(ctx)).toEqual([
      'knowledge-management.view.write_completed:{"id":"job-1","profile":"product","processed":1,"skipped":0,"failed":0,"chunks":2}',
    ]);
  });
});

function success(): KnowledgeOperationResult<IngestionSummary> {
  return {
    success: true,
    value: {
      jobId: 'job-1',
      profileId: 'product',
      mode: 'write',
      status: 'succeeded',
      processed: 1,
      skipped: 0,
      failed: 0,
      chunks: 2,
      hashesWritten: true,
    },
  };
}

async function flushPendingWork(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function immediate(): Promise<string> {
  await Promise.resolve();
  return 'pending';
}

function firstEdit(ctx: Context): unknown {
  return allEdits(ctx)[0];
}

function allEdits(ctx: Context): unknown[] {
  return (ctx.editMessageText as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0]);
}

function allReplies(ctx: Context): unknown[] {
  return (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0]);
}
