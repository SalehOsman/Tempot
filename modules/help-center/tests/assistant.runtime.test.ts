import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { helpCommand } from '../commands/help.command.js';
import { askCommand } from '../commands/ask.command.js';
import { handleTextMessage } from '../handlers/text-message.handler.js';

type TestDeps = ModuleDeps & {
  aiAssistant?: { ask: ReturnType<typeof vi.fn> };
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
    sessionProvider: { getSession: vi.fn(), saveSession: vi.fn() },
    i18n: {
      t: (key: string, options?: Record<string, unknown>) =>
        options ? `${key}:${JSON.stringify(options)}` : key,
    },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    aiAssistant: {
      ask: vi.fn().mockResolvedValue({
        success: true,
        value: {
          state: 'answered',
          answer: 'Use /start to open the main menu.',
          citations: [{ blockId: 'docs-1', sourceId: 'docs/product/en/guides/help.md' }],
          confidence: 0.91,
        },
      }),
    },
    navigation: { getMainMenuItems: vi.fn().mockReturnValue([]) },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    config: {
      name: 'help-center',
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
        hasAI: true,
        hasInputEngine: false,
        hasImport: false,
        hasSearch: false,
        hasDynamicCMS: false,
        hasRegional: false,
      },
      requires: { packages: [], optional: [] },
    },
  } as TestDeps;
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

describe('help-center AI assistant runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the AI assistant entry from the help menu', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await helpCommand(ctx);
    const reply = ctx.reply as ReturnType<typeof vi.fn>;
    const options = reply.mock.calls[0]?.[1] as { reply_markup?: unknown };
    expect(callbackDataFrom(options.reply_markup)).toContain('help:assistant');
  });

  it('answers a documentation question through the injected AI assistant', async () => {
    const deps = createDeps();
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createAskContext('/ask how do I open the main menu?');

    await askCommand(ctx);

    expect(deps.aiAssistant?.ask).toHaveBeenCalledWith({
      chatId: '456',
      locale: 'ar-EG',
      question: 'how do I open the main menu?',
      role: 'USER',
      userId: '123',
    });
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('help-center.assistant.answer'),
      expect.any(Object),
    );
  });

  it.each([
    ['ask/ how do I rebuild docker?', 'how do I rebuild docker?'],
    ['ask how do I rebuild docker?', 'how do I rebuild docker?'],
    ['/\u0627\u0633\u0623\u0644 \u0643\u064a\u0641?', '\u0643\u064a\u0641?'],
    ['\u0627\u0633\u0627\u0644 \u0643\u064a\u0641?', '\u0643\u064a\u0641?'],
  ])('answers smart ask input: %s', async (text, question) => {
    const deps = createDeps();
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createAskContext(text);

    await handleTextMessage(ctx, vi.fn());

    expect(deps.aiAssistant?.ask).toHaveBeenCalledWith(expect.objectContaining({ question }));
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('help-center.assistant.answer'),
      expect.any(Object),
    );
  });

  it('answers the next plain text message after question mode is enabled', async () => {
    const deps = createDeps();
    const session = sessionRecord({ helpCenterAwaitingQuestion: true });
    deps.sessionProvider = {
      getSession: vi.fn().mockResolvedValue(session),
      saveSession: vi.fn().mockResolvedValue(undefined),
    };
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createAskContext('\u0643\u064a\u0641?');

    await handleTextMessage(ctx, vi.fn());

    expect(deps.aiAssistant?.ask).toHaveBeenCalledWith(
      expect.objectContaining({ question: '\u0643\u064a\u0641?' }),
    );
    expect(deps.sessionProvider.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ helpCenterAwaitingQuestion: false }),
      }),
    );
  });

  it('renders a degraded answer when the AI assistant is unavailable', async () => {
    const deps = createDeps();
    deps.aiAssistant = undefined;
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = createAskContext('/ask backup runbook');

    await askCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('help-center.assistant.degraded'),
      expect.any(Object),
    );
  });
});

function createAskContext(text: string): Context {
  return {
    from: { id: 123 },
    chat: { id: 456 },
    message: { text },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function sessionRecord(metadata: Record<string, unknown>): Record<string, unknown> {
  return {
    userId: '123',
    chatId: '456',
    role: 'USER',
    status: 'ACTIVE',
    language: 'ar-EG',
    activeConversation: null,
    metadata,
    schemaVersion: 1,
    version: 1,
    createdAt: new Date('2026-07-29T00:00:00.000Z'),
    updatedAt: new Date('2026-07-29T00:00:00.000Z'),
  };
}
