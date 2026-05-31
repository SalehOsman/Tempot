import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { messagesCommand } from '../commands/messages.command.js';
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
    config: createConfig('content-management'),
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
      hasNotifications: false,
      hasAttachments: false,
      hasExport: false,
      hasAI: false,
      hasInputEngine: false,
      hasImport: false,
      hasSearch: false,
      hasDynamicCMS: true,
      hasRegional: false,
    },
    requires: { packages: [], optional: [] },
  };
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

describe('content-management runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers messages command and callback handler', async () => {
    const bot = { command: vi.fn(), on: vi.fn() };
    await setup(bot as never, createDeps());
    expect(bot.command).toHaveBeenCalledWith('messages', messagesCommand);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('shows message center from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await messagesCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('content-management.view.title', expect.any(Object));
  });

  it('renders templates as a leaf page without repeating the selected callback action', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'messages:templates', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    const callbacks = callbackDataFrom(options.reply_markup);
    expect(callbacks).toContain('messages:view');
    expect(callbacks).not.toContain('messages:templates');
  });

  it('treats unchanged message page edits as successful no-op callbacks', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'messages:view', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockRejectedValue(new Error('Bad Request: message is not modified')),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();

    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
