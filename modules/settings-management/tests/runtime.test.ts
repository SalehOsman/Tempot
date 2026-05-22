import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { settingsCommand } from '../commands/settings.command.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';

interface InlineCallbackButton {
  readonly callback_data?: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
}

function createDeps(): ModuleDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn() },
    i18n: { t: (key: string) => key },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    config: createConfig('settings-management'),
  };
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
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

describe('settings-management runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers settings command and callback handler', async () => {
    const bot = { command: vi.fn(), on: vi.fn() };
    await setup(bot as never, createDeps());
    expect(bot.command).toHaveBeenCalledWith('settings', settingsCommand);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('shows settings overview from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await settingsCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('settings-management.view.title', expect.any(Object));
  });

  it('handles settings view callbacks and passes unrelated callbacks', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const next = vi.fn();
    const ctx = {
      callbackQuery: { data: 'settings:view', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
    } as unknown as Context;
    await handleCallbackQuery(ctx, next);
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'settings-management.view.title',
      expect.any(Object),
    );
    await handleCallbackQuery(
      { callbackQuery: { data: 'other:view' } } as unknown as Context,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('treats unchanged settings page edits as successful no-op callbacks', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'settings:regional', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockRejectedValue(new Error('Bad Request: message is not modified')),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();

    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('renders a regional submenu instead of the general settings menu', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'settings:regional', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    const callbacks = callbackDataFrom(options.reply_markup);
    expect(callbacks).toContain('settings:regional:language');
    expect(callbacks).toContain('settings:regional:timezone');
    expect(callbacks).not.toContain('settings:regional');
  });
});
