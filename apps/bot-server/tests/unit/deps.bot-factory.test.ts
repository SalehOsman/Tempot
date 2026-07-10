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
      getDynamic: vi.fn().mockResolvedValue({ isOk: () => true, value: 'private' }),
      getStatic: vi.fn().mockReturnValue({
        isOk: () => true,
        value: { superAdminIds: [], botAccessMode: 'private' },
      }),
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

  it('prefers dynamic bot access mode for bot middleware dependencies', async () => {
    const deps = createDeps();
    deps.settingsService.getDynamic.mockResolvedValue({ isOk: () => true, value: 'public' });
    const createRuntimeBot = buildBotFactory(deps as never);

    createRuntimeBot('12345:testtoken', []);

    const botDeps = vi.mocked(createBot).mock.calls.at(-1)?.[1];
    await expect(botDeps?.getAccessMode()).resolves.toBe('public');
    expect(deps.settingsService.getDynamic).toHaveBeenCalledWith('bot_access_mode');
  });

  it('falls back to static bot access mode when dynamic access mode is unavailable', async () => {
    const deps = createDeps();
    deps.settingsService.getDynamic.mockResolvedValue({ isOk: () => false });
    deps.settingsService.getStatic.mockReturnValue({
      isOk: () => true,
      value: { superAdminIds: [], botAccessMode: 'public' },
    });
    const createRuntimeBot = buildBotFactory(deps as never);

    createRuntimeBot('12345:testtoken', []);

    const botDeps = vi.mocked(createBot).mock.calls.at(-1)?.[1];
    await expect(botDeps?.getAccessMode()).resolves.toBe('public');
  });

  it('preserves the production session role, status, and language in actor context', async () => {
    const deps = createDeps();
    deps.sessionProvider.getSession.mockResolvedValue({
      isErr: () => false,
      value: {
        userId: 'user-123',
        role: 'ADMIN',
        status: 'BANNED',
        language: 'en',
      },
    });
    const createRuntimeBot = buildBotFactory(deps as never);

    createRuntimeBot('12345:testtoken', []);

    const botDeps = vi.mocked(createBot).mock.calls.at(-1)?.[1];
    await expect(botDeps?.getSessionUser(123)).resolves.toEqual({
      id: 'user-123',
      role: 'ADMIN',
      status: 'BANNED',
      language: 'en',
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

  it('localizes critical alerts before sending them to super administrators', async () => {
    const deps = createDeps();
    deps.settingsService.getStatic.mockReturnValue({
      isOk: () => true,
      value: { superAdminIds: [123] },
    });
    deps.t.mockReturnValue('localized critical alert');

    const createRuntimeBot = buildBotFactory(deps as never);
    const bot = createRuntimeBot('12345:testtoken', []);
    const subscription = deps.eventBus.subscribe.mock.calls.find(
      ([eventName]) => eventName === 'system.alert.critical',
    );
    const handler = subscription?.[1] as (payload: { message: string; error: string }) => void;

    handler({ message: '<cache & redis>', error: 'connection > timeout' });
    await vi.waitFor(() => {
      expect(bot.api.sendMessage).toHaveBeenCalled();
    });

    expect(deps.t).toHaveBeenCalledWith('bot-server.critical_alert', {
      message: '&lt;cache &amp; redis&gt;',
      error: 'connection &gt; timeout',
    });
    expect(bot.api.sendMessage).toHaveBeenCalledWith(123, 'localized critical alert', {
      parse_mode: 'HTML',
    });
  });
});
