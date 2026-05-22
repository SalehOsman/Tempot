import { describe, expect, it, vi } from 'vitest';

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
});
