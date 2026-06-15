import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { helpCommand } from '../commands/help.command.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';

type TestDeps = ModuleDeps & {
  authorization: {
    guard: ReturnType<typeof vi.fn>;
    enforce: ReturnType<typeof vi.fn>;
  };
};

interface InlineCallbackButton {
  readonly callback_data?: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
}

function createDeps(): TestDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn() },
    i18n: {
      t: (key: string, options?: Record<string, unknown>) =>
        options ? `${key}:${JSON.stringify(options)}` : key,
    },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    navigation: { getMainMenuItems: vi.fn().mockReturnValue([]) },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    config: createConfig('help-center'),
  } as TestDeps;
}

function createConfig(name: string): ModuleDeps['config'] {
  return {
    name,
    version: '0.1.0',
    requiredRole: 'USER',
    isActive: true,
    isCore: false,
    commands: [{ command: 'help', description: 'help-center.commands.help' }],
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

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

describe('help-center runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers help command and callback handler', async () => {
    const bot = { command: vi.fn(), on: vi.fn() };
    const deps = createDeps();
    await setup(bot as never, deps);
    expect(deps.authorization.guard).toHaveBeenCalledWith({
      module: 'help-center',
      classification: 'protected',
      action: 'read',
      subject: 'help',
    });
    expect(bot.command).toHaveBeenCalledWith(
      'help',
      deps.authorization.guard.mock.results[0]?.value,
      helpCommand,
    );
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('shows contextual help from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await helpCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('help-center.view.title', expect.any(Object));
  });

  it('renders commands as a leaf page without repeating the selected callback action', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'help:commands', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    const callbacks = callbackDataFrom(options.reply_markup);
    expect(callbacks).toContain('help:view');
    expect(callbacks).not.toContain('help:commands');
  });

  it('renders actionable help from available commands and navigation entries', async () => {
    const deps = createDeps();
    deps.navigation = {
      getMainMenuItems: vi.fn().mockReturnValue([
        {
          id: 'settings',
          labelKey: 'settings-management.menu.button',
          callbackData: 'settings:view',
          requiredRole: 'USER',
          row: 0,
          order: 20,
        },
        {
          id: 'stats',
          labelKey: 'audit-viewer.menu.button',
          callbackData: 'stats:view',
          requiredRole: 'ADMIN',
          row: 2,
          order: 20,
        },
      ]),
    };
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      from: { id: 123 },
      chat: { id: 456 },
      callbackQuery: { data: 'help:commands', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const renderedText = editMessageText.mock.calls[0]?.[0] as string;
    expect(deps.navigation.getMainMenuItems).toHaveBeenCalledWith('USER');
    expect(renderedText).toContain('help-center.view.command_item');
    expect(renderedText).toContain('/help');
    expect(renderedText).toContain('help-center.view.menu_item');
    expect(renderedText).toContain('settings-management.menu.button');
    expect(renderedText).toContain('settings:view');
  });

  it('renders actionable support context with user and chat identifiers', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      from: { id: 123 },
      chat: { id: 456 },
      callbackQuery: { data: 'help:support', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const renderedText = editMessageText.mock.calls[0]?.[0] as string;
    expect(renderedText).toContain('help-center.view.support_context');
    expect(renderedText).toContain('"userId":"123"');
    expect(renderedText).toContain('"chatId":"456"');
    expect(renderedText).toContain('help-center.view.support_steps');
  });

  it('treats unchanged help page edits as successful no-op callbacks', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'help:view', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
      editMessageText: vi.fn().mockRejectedValue(new Error('Bad Request: message is not modified')),
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as Context;

    await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();

    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
