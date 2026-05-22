import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { notificationsCommand } from '../commands/notifications.command.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';

function createDeps(): ModuleDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn() },
    i18n: { t: (key: string) => key },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    config: createConfig('notification-center'),
  };
}

function createConfig(name: string): ModuleDeps['config'] {
  return {
    name,
    version: '0.1.0',
    requiredRole: 'USER',
    isActive: true,
    isCore: false,
    commands: [],
    features: {
      hasDatabase: false,
      hasNotifications: true,
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

describe('notification-center runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers notifications command and callback handler', async () => {
    const bot = { command: vi.fn(), on: vi.fn() };
    await setup(bot as never, createDeps());
    expect(bot.command).toHaveBeenCalledWith('notifications', notificationsCommand);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('shows notification inbox from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await notificationsCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('notification-center.view.title', expect.any(Object));
  });

  it('publishes a test notification request', async () => {
    const deps = createDeps();
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:test', message: { message_id: 10 } },
      from: { id: 123 },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;
    await handleCallbackQuery(ctx);
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'notification-center.notification.test_requested',
      { telegramId: '123' },
    );
  });

  it('treats unchanged notification page edits as successful no-op callbacks', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'notifications:preferences', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockRejectedValue(new Error('Bad Request: message is not modified')),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();

    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
