import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { statsCommand } from '../commands/stats.command.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';

function createDeps(): ModuleDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn() },
    i18n: {
      t: (key: string, options?: Record<string, unknown>) =>
        key === 'audit-viewer.problems.item'
          ? `${options?.['action']}|${options?.['module']}|${options?.['traceId']}`
          : key,
    },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    auditLog: { findMany: vi.fn().mockResolvedValue([]) },
    config: createConfig('audit-viewer'),
  };
}

function createConfig(name: string): ModuleDeps['config'] {
  return {
    name,
    version: '0.1.0',
    requiredRole: 'ADMIN',
    isActive: true,
    isCore: false,
    commands: [],
    features: {
      hasDatabase: false,
      hasNotifications: false,
      hasAttachments: false,
      hasExport: false,
      hasAI: false,
      hasInputEngine: false,
      hasImport: false,
      hasSearch: false,
      hasDynamicCMS: false,
      hasRegional: false,
    },
    requires: { packages: [], optional: [] },
  };
}

describe('audit-viewer runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers stats command and callback handler', async () => {
    const bot = { command: vi.fn(), on: vi.fn() };
    await setup(bot as never, createDeps());
    expect(bot.command).toHaveBeenCalledWith('stats', statsCommand);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('shows operational statistics from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await statsCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('audit-viewer.view.title', expect.any(Object));
  });

  it('shows recent interaction problems from callback', async () => {
    const deps = createDeps();
    deps.auditLog.findMany = vi.fn().mockResolvedValue([
      {
        action: 'settings:open',
        module: 'settings-management',
        targetId: 'trace-1',
        status: 'FAILURE',
        timestamp: new Date('2026-05-22T01:00:00.000Z'),
        after: { callbackData: 'settings:open' },
      },
    ]);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'stats:problems', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('settings:open|settings-management|trace-1'),
      expect.any(Object),
    );
  });

  it('treats unchanged statistics page edits as successful no-op callbacks', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'stats:view', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockRejectedValue(new Error('Bad Request: message is not modified')),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();

    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
