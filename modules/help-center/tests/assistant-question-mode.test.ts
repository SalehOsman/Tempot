import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';

type TestDeps = ModuleDeps & {
  authorization: {
    guard: ReturnType<typeof vi.fn>;
    enforce: ReturnType<typeof vi.fn>;
  };
};

describe('help-center question mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens a persistent assistant session when users press the smart assistant button', async () => {
    const deps = createDeps();
    deps.sessionProvider = {
      getSession: vi.fn().mockResolvedValue(sessionRecord()),
      saveSession: vi.fn().mockResolvedValue(undefined),
    };
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);

    await handleCallbackQuery(callbackContext());

    expect(deps.sessionProvider.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ helpCenterAssistantSession: true }),
      }),
    );
  });

  it('closes the persistent assistant session from the close button', async () => {
    const deps = createDeps();
    deps.sessionProvider = {
      getSession: vi.fn().mockResolvedValue(sessionRecord({ helpCenterAssistantSession: true })),
      saveSession: vi.fn().mockResolvedValue(undefined),
    };
    await setup({ command: vi.fn(), on: vi.fn() } as never, deps);
    const ctx = callbackContext('help:assistant:close');

    await handleCallbackQuery(ctx);

    expect(deps.sessionProvider.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ helpCenterAssistantSession: false }),
      }),
    );
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'help-center.assistant.closed',
      expect.any(Object),
    );
  });
});

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
      commands: [],
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

function callbackContext(data = 'help:assistant'): Context {
  return {
    from: { id: 123 },
    chat: { id: 456 },
    callbackQuery: { data, message: { message_id: 10 } },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

function sessionRecord(metadata: Record<string, unknown> = {}): Record<string, unknown> {
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
