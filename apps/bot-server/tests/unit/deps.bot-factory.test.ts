import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/bot/bot.factory.js', () => ({
  createBot: vi.fn(() => ({
    api: { sendMessage: vi.fn().mockResolvedValue(undefined) },
  })),
}));

import { createBot } from '../../src/bot/bot.factory.js';
import { buildBotFactory } from '../../src/startup/deps.bot-factory.js';

function createDeps() {
  return {
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
    },
    eventBus: {
      subscribe: vi.fn(),
      getRedisClient: vi.fn().mockReturnValue(undefined),
      publish: vi.fn().mockResolvedValue(undefined),
    },
    sessionProvider: {
      getSession: vi.fn().mockResolvedValue({ isErr: () => true }),
    },
    settingsService: {
      getMaintenanceStatus: vi.fn().mockResolvedValue({ isOk: () => false }),
      getStatic: vi.fn().mockReturnValue({ isOk: () => true, value: { superAdminIds: [] } }),
    },
    sentryReporter: undefined,
    t: vi.fn((key: string, options?: Record<string, unknown>) => `${key}:${options?.['code']}`),
  };
}

describe('buildBotFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards i18n interpolation options to createBot dependencies', () => {
    const deps = createDeps();
    const createRuntimeBot = buildBotFactory(deps as never);

    createRuntimeBot('12345:testtoken', []);

    const botDeps = vi.mocked(createBot).mock.calls[0]?.[1];
    expect(botDeps?.t('bot-server.error_message', { code: 'ERR-1' })).toBe(
      'bot-server.error_message:ERR-1',
    );
    expect(deps.t).toHaveBeenCalledWith('bot-server.error_message', { code: 'ERR-1' });
  });

  it('preserves the production session role and status in actor context', async () => {
    const deps = createDeps();
    deps.sessionProvider.getSession.mockResolvedValue({
      isErr: () => false,
      value: {
        userId: 'user-123',
        role: 'ADMIN',
        status: 'BANNED',
      },
    });
    const createRuntimeBot = buildBotFactory(deps as never);

    createRuntimeBot('12345:testtoken', []);

    const botDeps = vi.mocked(createBot).mock.calls.at(-1)?.[1];
    await expect(botDeps?.getSessionUser(123)).resolves.toEqual({
      id: 'user-123',
      role: 'ADMIN',
      status: 'BANNED',
    });
  });

  it('returns null only when the session is not found', async () => {
    const deps = createDeps();
    deps.sessionProvider.getSession.mockResolvedValue({
      isErr: () => true,
      error: { code: 'session-manager.not_found' },
    });
    const createRuntimeBot = buildBotFactory(deps as never);

    createRuntimeBot('12345:testtoken', []);

    const botDeps = vi.mocked(createBot).mock.calls.at(-1)?.[1];
    await expect(botDeps?.getSessionUser(123)).resolves.toBeNull();
  });

  it('propagates session infrastructure failures to the auth boundary', async () => {
    const deps = createDeps();
    const sessionError = new Error('session unavailable');
    deps.sessionProvider.getSession.mockResolvedValue({
      isErr: () => true,
      error: sessionError,
    });
    const createRuntimeBot = buildBotFactory(deps as never);

    createRuntimeBot('12345:testtoken', []);

    const botDeps = vi.mocked(createBot).mock.calls.at(-1)?.[1];
    await expect(botDeps?.getSessionUser(123)).rejects.toBe(sessionError);
  });
});
