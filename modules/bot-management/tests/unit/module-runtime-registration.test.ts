import { describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../../index.js';
import { botsCommand } from '../../commands/bots.command.js';
import { newBotCommand } from '../../commands/new-bot.command.js';

type TestDeps = ModuleDeps & {
  authorization: {
    guard: ReturnType<typeof vi.fn>;
    enforce: ReturnType<typeof vi.fn>;
  };
};

function createDeps(): TestDeps {
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
      guard: vi.fn().mockReturnValueOnce(vi.fn()).mockReturnValueOnce(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    config: {
      commands: [],
      features: { hasInputEngine: true },
    } as ModuleDeps['config'],
  } as TestDeps;
}

describe('bot-management runtime registration', () => {
  it('registers bot commands behind their explicit authorization policies', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
      use: vi.fn(),
    };
    const deps = createDeps();

    await setup(bot as never, deps);

    expect(deps.authorization.guard).toHaveBeenNthCalledWith(1, {
      module: 'bot-management',
      classification: 'protected',
      action: 'read',
      subject: 'bot',
    });
    expect(deps.authorization.guard).toHaveBeenNthCalledWith(2, {
      module: 'bot-management',
      classification: 'protected',
      action: 'create',
      subject: 'bot',
    });
    expect(bot.command).toHaveBeenNthCalledWith(
      1,
      'bots',
      deps.authorization.guard.mock.results[0]?.value,
      botsCommand,
    );
    expect(bot.command).toHaveBeenNthCalledWith(
      2,
      'new_bot',
      deps.authorization.guard.mock.results[1]?.value,
      newBotCommand,
    );
  });

  it('registers callback handling without restoring the removed text-state handler', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
      use: vi.fn(),
    };

    await setup(bot as never, createDeps());

    expect(bot.on).toHaveBeenCalledTimes(1);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', expect.any(Function));
    expect(bot.on).not.toHaveBeenCalledWith('message:text', expect.any(Function));
  });

  it('registers both registration and lifecycle reason conversations', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
      use: vi.fn(),
    };

    await setup(bot as never, createDeps());

    expect(bot.use).toHaveBeenCalledTimes(2);
  });

  it('registers conversations before commands and callback handlers that enter them', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
      use: vi.fn(),
    };

    await setup(bot as never, createDeps());

    expect(bot.use.mock.invocationCallOrder[1]).toBeLessThan(
      bot.command.mock.invocationCallOrder[0],
    );
    expect(bot.use.mock.invocationCallOrder[1]).toBeLessThan(bot.on.mock.invocationCallOrder[0]);
  });
});
