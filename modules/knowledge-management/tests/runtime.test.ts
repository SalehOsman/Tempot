import type { Context } from 'grammy';
import { describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { knowledgeCommand } from '../commands/knowledge.command.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';
import type {
  IngestionSummary,
  KnowledgeOperationResult,
  KnowledgeOperationsProvider,
  WriteConfirmation,
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

async function flushPendingWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function deferredProvider(): {
  readonly provider: KnowledgeOperationsProvider;
  readonly resolveWriteRequest: () => void;
  readonly resolveConfirmWrite: () => void;
} {
  const control = {
    resolveWriteRequest: (): void => undefined,
    resolveConfirmWrite: (): void => undefined,
    provider: {
      getReadiness: vi.fn(),
      listSourceProfiles: vi.fn(),
      runDryRun: vi.fn(),
      requestFullReindex: vi.fn(),
      confirmFullReindex: vi.fn(),
      listJobs: vi.fn(),
      testQuery: vi.fn(),
      requestWrite: vi.fn(
        () =>
          new Promise<KnowledgeOperationResult<WriteConfirmation>>((resolve) => {
            control.resolveWriteRequest = () =>
              resolve({
                success: false,
                error: { code: 'knowledge-management.write.blocked' },
              });
          }),
      ),
      confirmWrite: vi.fn(
        () =>
          new Promise<KnowledgeOperationResult<IngestionSummary>>((resolve) => {
            control.resolveConfirmWrite = () =>
              resolve({
                success: false,
                error: { code: 'knowledge-management.write.failed' },
              });
          }),
      ),
    },
  };
  return control;
}

describe('knowledge-management runtime', () => {
  it('registers command and callback handler', async () => {
    const deps = createDeps();
    const bot = { command: vi.fn(), on: vi.fn() };

    await setup(bot as never, deps);

    expect(bot.command).toHaveBeenCalledWith(
      'knowledge',
      deps.authorization.guard.mock.results[0]?.value,
      knowledgeCommand,
    );
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('renders unavailable status without raw provider errors', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'knowledge:status', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    expect(editMessageText.mock.calls[0]?.[0]).toBe('knowledge-management.view.unavailable');
  });

  it('renders a loading state before preparing a write request', async () => {
    const deps = createDeps();
    const control = deferredProvider();
    deps.knowledge = control.provider;
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createContext('knowledge:write');

    const operation = handleCallbackQuery(ctx);
    await flushPendingWork();

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    expect(editMessageText.mock.calls[0]?.[0]).toBe('knowledge-management.view.write_waiting');
    control.resolveWriteRequest();
    await operation;
  });

  it('renders a loading state before confirming index writes', async () => {
    const deps = createDeps();
    const control = deferredProvider();
    deps.knowledge = control.provider;
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createContext('knowledge:confirm_write:token-1');

    const operation = handleCallbackQuery(ctx);
    await flushPendingWork();

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    expect(editMessageText.mock.calls[0]?.[0]).toBe('knowledge-management.view.write_waiting');
    control.resolveConfirmWrite();
    await operation;
  });
});
