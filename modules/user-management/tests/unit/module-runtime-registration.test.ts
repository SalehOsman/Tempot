import { describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../../index.js';
import { profileCommand } from '../../commands/profile.command.js';
import { startCommand } from '../../commands/start.command.js';
import { usersCommand } from '../../commands/users.command.js';

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
      guard: vi
        .fn()
        .mockReturnValueOnce(vi.fn())
        .mockReturnValueOnce(vi.fn())
        .mockReturnValueOnce(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
    },
    config: {
      commands: [],
    } as ModuleDeps['config'],
  } as TestDeps;
}

describe('user-management runtime registration', () => {
  it('registers user commands behind their explicit authorization policies', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
    };
    const deps = createDeps();

    await setup(bot as never, deps);

    expect(deps.authorization.guard).toHaveBeenNthCalledWith(1, {
      module: 'user-management',
      classification: 'bootstrap',
      action: 'read',
      subject: 'bootstrap',
    });
    expect(deps.authorization.guard).toHaveBeenNthCalledWith(2, {
      module: 'user-management',
      classification: 'protected',
      action: 'read',
      subject: 'profile',
    });
    expect(deps.authorization.guard).toHaveBeenNthCalledWith(3, {
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'users',
    });
    expect(bot.command).toHaveBeenNthCalledWith(
      1,
      'start',
      deps.authorization.guard.mock.results[0]?.value,
      startCommand,
    );
    expect(bot.command).toHaveBeenNthCalledWith(
      2,
      'profile',
      deps.authorization.guard.mock.results[1]?.value,
      profileCommand,
    );
    expect(bot.command).toHaveBeenNthCalledWith(
      3,
      'users',
      deps.authorization.guard.mock.results[2]?.value,
      usersCommand,
    );
  });
});
