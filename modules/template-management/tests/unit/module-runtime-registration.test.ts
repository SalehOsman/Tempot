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
    } as ModuleDeps['config'],
  };
}

describe('template-management runtime registration', () => {
  it('does not register a generic text handler that can swallow later module commands', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
    };

    await setup(bot as never, createDeps());

    expect(bot.on).toHaveBeenCalledTimes(1);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', expect.any(Function));
    expect(bot.on).not.toHaveBeenCalledWith('message:text', expect.any(Function));
  });
});
