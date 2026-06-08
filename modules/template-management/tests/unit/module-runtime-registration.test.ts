import { describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../../index.js';
import { importTemplateCommand } from '../../commands/import-template.command.js';
import { newTemplateCommand } from '../../commands/new-template.command.js';
import { templatesCommand } from '../../commands/templates.command.js';

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

describe('template-management runtime registration', () => {
  it('registers each command behind its explicit authorization policy', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
    };
    const deps = createDeps();

    await setup(bot as never, deps);

    expect(deps.authorization.guard).toHaveBeenNthCalledWith(1, {
      module: 'template-management',
      classification: 'public',
      action: 'read',
      subject: 'template',
    });
    expect(deps.authorization.guard).toHaveBeenNthCalledWith(2, {
      module: 'template-management',
      classification: 'protected',
      action: 'create',
      subject: 'template',
    });
    expect(deps.authorization.guard).toHaveBeenNthCalledWith(3, {
      module: 'template-management',
      classification: 'protected',
      action: 'manage',
      subject: 'template',
    });
    expect(bot.command).toHaveBeenNthCalledWith(
      1,
      'templates',
      deps.authorization.guard.mock.results[0]?.value,
      templatesCommand,
    );
    expect(bot.command).toHaveBeenNthCalledWith(
      2,
      'new_template',
      deps.authorization.guard.mock.results[1]?.value,
      newTemplateCommand,
    );
    expect(bot.command).toHaveBeenNthCalledWith(
      3,
      'import_template',
      deps.authorization.guard.mock.results[2]?.value,
      importTemplateCommand,
    );
  });

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
