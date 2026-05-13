import { describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../../index.js';

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
    config: {
      commands: [],
      features: { hasInputEngine: true },
    } as ModuleDeps['config'],
  };
}

describe('bot-management runtime registration', () => {
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
