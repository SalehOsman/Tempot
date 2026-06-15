import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { notificationsCommand } from '../commands/notifications.command.js';
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
    settings: {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
    },
    auditLog: { findMany: vi.fn().mockResolvedValue([]) },
    interactionEvents: { findMany: vi.fn().mockResolvedValue([]) },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    config: createConfig('notification-center'),
  } as TestDeps;
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
    const deps = createDeps();
    await setup(bot as never, deps);
    expect(deps.authorization.guard).toHaveBeenCalledWith({
      module: 'notification-center',
      classification: 'protected',
      action: 'read',
      subject: 'notifications',
    });
    expect(bot.command).toHaveBeenCalledWith(
      'notifications',
      deps.authorization.guard.mock.results[0]?.value,
      notificationsCommand,
    );
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('shows notification inbox from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await notificationsCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('notification-center.view.title', expect.any(Object));
    const reply = ctx.reply as ReturnType<typeof vi.fn>;
    const options = reply.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toEqual([
      'notifications:test',
      'notifications:preferences',
      'notifications:activity',
      'menu:main',
    ]);
  });

  it('renders preferences as a leaf surface without repeating the selected callback', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'notifications:preferences', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toEqual(['notifications:view', 'menu:main']);
  });

  it('renders notification preferences as an honest unavailable snapshot', async () => {
    const deps = createDeps();
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:preferences', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(deps.settings.get).toHaveBeenCalledWith('notifications_enabled');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'notification-center.view.preferences_unavailable',
      expect.any(Object),
    );
    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    const callbacks = callbackDataFrom(options.reply_markup);
    expect(callbacks).not.toContain('notifications:toggle');
    expect(callbacks).not.toContain('notifications:quiet-hours');
  });

  it('renders a real disable action when notifications are enabled', async () => {
    const deps = createDeps();
    deps.settings.get = vi.fn().mockResolvedValue(true);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:preferences', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'notification-center.view.preferences_enabled',
      expect.any(Object),
    );
    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toContain('notifications:toggle');
  });

  it('toggles notification preferences and renders the updated state', async () => {
    const deps = createDeps();
    deps.settings.get = vi.fn().mockResolvedValue(true);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:toggle', message: { message_id: 10 } },
      from: { id: 123 },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(deps.settings.set).toHaveBeenCalledWith('notifications_enabled', false, '123');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'notification-center.view.preferences_disabled',
      expect.any(Object),
    );
  });

  it('does not mutate notification preferences when authorization is denied', async () => {
    const deps = createDeps();
    deps.authorization.enforce.mockResolvedValue(false);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:toggle', message: { message_id: 10 } },
      from: { id: 123 },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(deps.authorization.enforce).toHaveBeenCalledWith(ctx, {
      module: 'notification-center',
      classification: 'protected',
      action: 'update',
      subject: 'notifications',
    });
    expect(deps.settings.get).not.toHaveBeenCalled();
    expect(deps.settings.set).not.toHaveBeenCalled();
  });

  it('renders an explicit empty state when notification activity is unavailable', async () => {
    const deps = createDeps();
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:activity', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(deps.interactionEvents.findMany).toHaveBeenCalledWith(expect.any(Object));
    expect(deps.auditLog.findMany).toHaveBeenCalledWith(expect.any(Object));
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'notification-center.view.activity_empty',
      expect.any(Object),
    );
  });

  it('renders recent notification activity from interaction records', async () => {
    const deps = createDeps();
    deps.interactionEvents.findMany = vi.fn().mockResolvedValue([
      {
        callbackData: 'notifications:test',
        status: 'success',
        occurredAt: new Date('2026-05-28T01:00:00.000Z'),
      },
    ]);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:activity', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const renderedText = editMessageText.mock.calls[0]?.[0] as string;
    expect(renderedText).toContain('notification-center.view.activity_items');
    expect(renderedText).toContain('notification-center.view.activity_labels.action.test');
    expect(renderedText).toContain('notification-center.view.activity_labels.status.succeeded');
    expect(renderedText).toContain('28/05/2026 01:00');
    expect(renderedText).not.toContain('notifications:test');
    expect(renderedText).not.toContain('2026-05-28T01:00:00.000Z');
  });

  it('summarizes notification activity without internal lifecycle noise', async () => {
    const deps = createDeps();
    deps.interactionEvents.findMany = vi.fn().mockResolvedValue([
      {
        callbackData: 'notifications:activity',
        status: 'received',
        occurredAt: new Date('2026-05-29T23:59:00.000Z'),
        traceId: 'activity-1',
      },
      {
        callbackData: 'notifications:activity',
        status: 'completed',
        occurredAt: new Date('2026-05-29T23:58:00.000Z'),
        traceId: 'activity-1',
      },
      {
        callbackData: 'notifications:view',
        status: 'succeeded',
        occurredAt: new Date('2026-05-29T23:57:00.000Z'),
        traceId: 'view-1',
      },
      {
        callbackData: 'notifications:view',
        status: 'succeeded',
        occurredAt: new Date('2026-05-29T23:56:00.000Z'),
        traceId: 'view-1',
      },
      {
        callbackData: 'notifications:test',
        status: 'completed',
        occurredAt: new Date('2026-05-29T23:55:00.000Z'),
        traceId: 'test-1',
      },
    ]);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:activity', message: { message_id: 10 } },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const renderedText = editMessageText.mock.calls[0]?.[0] as string;
    expect(deps.interactionEvents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 40 }),
    );
    expect(renderedText).not.toContain('notification-center.view.activity_labels.action.activity');
    expect(renderedText).not.toContain('notification-center.view.activity_labels.status.received');
    expect(renderedText).toContain('29/05/2026 23:57');
    expect(renderedText).toContain('29/05/2026 23:55');
    expect(renderedText).toContain('notification-center.view.activity_labels.action.test');
    expect(
      renderedText.match(/notification-center\.view\.activity_labels\.action\.view/g),
    ).toHaveLength(1);
  });

  it('renders test results with a repeat action and root navigation', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = {
      callbackQuery: { data: 'notifications:test', message: { message_id: 10 } },
      from: { id: 123 },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    const options = editMessageText.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toEqual([
      'notifications:test',
      'notifications:view',
      'menu:main',
    ]);
  });

  it('publishes and delivers a visible test notification request', async () => {
    const deps = createDeps();
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:test', message: { message_id: 10 } },
      from: { id: 123 },
      chat: { id: 456 },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;
    await handleCallbackQuery(ctx);
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'notification-center.notification.test_requested',
      expect.objectContaining({
        chatId: '456',
        reference: expect.stringMatching(/^NTF-/),
        requestedAt: expect.any(String),
        telegramId: '123',
      }),
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('notification-center.test.delivery_message'),
      expect.any(Object),
    );
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('notification-center.view.test_result'),
      expect.any(Object),
    );
  });

  it('blocks test delivery when notification delivery is disabled', async () => {
    const deps = createDeps();
    deps.settings.get = vi.fn().mockResolvedValue(false);
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:test', message: { message_id: 10 } },
      from: { id: 123 },
      chat: { id: 456 },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    await handleCallbackQuery(ctx);

    expect(deps.eventBus.publish).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'notification-center.view.test_disabled',
      expect.any(Object),
    );
  });

  it('renders a unique test result when test notification is repeated', async () => {
    vi.useFakeTimers();
    const deps = createDeps();
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = {
      callbackQuery: { data: 'notifications:test', message: { message_id: 10 } },
      from: { id: 123 },
      chat: { id: 456 },
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      reply: vi.fn(),
    } as unknown as Context;

    vi.setSystemTime(new Date('2026-05-28T01:00:00.000Z'));
    await handleCallbackQuery(ctx);
    vi.setSystemTime(new Date('2026-05-28T01:00:01.000Z'));
    await handleCallbackQuery(ctx);

    const editMessageText = ctx.editMessageText as ReturnType<typeof vi.fn>;
    expect(editMessageText.mock.calls[0]?.[0]).not.toBe(editMessageText.mock.calls[1]?.[0]);
    vi.useRealTimers();
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
