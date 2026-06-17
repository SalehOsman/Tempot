import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleDeps } from '../../index.js';

function createDeps(): ModuleDeps {
  return {
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
    sessionProvider: {
      getSession: vi.fn().mockResolvedValue(undefined),
    },
    i18n: {
      t: (key: string) => key,
    },
    settings: {
      get: vi.fn().mockResolvedValue(undefined),
    },
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
      refreshAndEnforce: vi.fn().mockResolvedValue(true),
    },
    config: {
      commands: [],
      features: { hasInputEngine: true },
    } as ModuleDeps['config'],
  };
}

describe('bot-management service contexts', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects BotService access before initialization', async () => {
    const { getBotService } = await import('../../services/bot-service.context.js');

    expect(() => getBotService()).toThrow('bot-management: BotService not initialized.');
  });

  it('initializes BotService from registered module dependencies', async () => {
    const deps = createDeps();
    const { registerDeps } = await import('../../deps.context.js');
    const { BotService } = await import('../../services/bot.service.js');
    const { getBotService, initBotService } = await import('../../services/bot-service.context.js');

    registerDeps(deps);
    initBotService();

    expect(getBotService()).toBeInstanceOf(BotService);
  });

  it('rejects LifecycleService access before initialization', async () => {
    const { getLifecycleService } = await import('../../services/lifecycle-service.context.js');

    expect(() => getLifecycleService()).toThrow(
      'bot-management: LifecycleService not initialized.',
    );
  });

  it('initializes LifecycleService from registered module dependencies', async () => {
    const deps = createDeps();
    const { registerDeps } = await import('../../deps.context.js');
    const { LifecycleService } = await import('../../services/lifecycle.service.js');
    const { getLifecycleService, initLifecycleService } =
      await import('../../services/lifecycle-service.context.js');

    registerDeps(deps);
    initLifecycleService();

    expect(getLifecycleService()).toBeInstanceOf(LifecycleService);
  });
});
