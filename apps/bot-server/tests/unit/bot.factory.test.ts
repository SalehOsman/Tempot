import { afterEach, describe, expect, it, vi } from 'vitest';
import { Bot } from 'grammy';
import { createBot } from '../../src/bot/bot.factory.js';

const deps = {
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
  eventBus: {
    publish: vi.fn().mockResolvedValue({ isOk: () => true }),
  },
  getMaintenanceStatus: vi.fn().mockResolvedValue({
    enabled: false,
    isSuperAdmin: () => false,
  }),
  getSessionUser: vi.fn().mockResolvedValue({ id: '123', role: 'SUPER_ADMIN' }),
  abilityDefinitions: [],
  commandScopeMap: new Map<string, string>(),
  commandModuleMap: {},
  auditLog: vi.fn().mockResolvedValue(undefined),
  sentryReporter: undefined,
  getAccessMode: vi.fn().mockReturnValue('private'),
  t: (key: string) => key,
};

describe('createBot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the conversation runtime before module handlers are loaded', () => {
    const useSpy = vi.spyOn(Bot.prototype, 'use');

    createBot('12345:testtoken', deps);

    expect(useSpy).toHaveBeenCalledTimes(10);
  });
});
