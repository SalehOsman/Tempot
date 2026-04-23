/**
 * Test Module — tests/setup.test.ts
 *
 * Unit tests verifying that setup() registers all command handlers and
 * that the logger is called upon registration.
 *
 * TDD: these tests were written to define the expected contract of setup().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Bot, Context } from 'grammy';
import setup, { type ModuleDeps } from '../index.js';

// ---------------------------------------------------------------------------
// Shared test factory
// ---------------------------------------------------------------------------

function makeBot(): { command: ReturnType<typeof vi.fn> } & Pick<Bot<Context>, 'command'> {
  return { command: vi.fn() } as unknown as { command: ReturnType<typeof vi.fn> } & Pick<
    Bot<Context>,
    'command'
  >;
}

function makeLogger(): ModuleDeps['logger'] {
  const logger: ModuleDeps['logger'] = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  };
  (logger.child as ReturnType<typeof vi.fn>).mockReturnValue(logger);
  return logger;
}

function makeDeps(overrides: Partial<ModuleDeps> = {}): ModuleDeps {
  return {
    logger: makeLogger(),
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn().mockResolvedValue(null) },
    i18n: { t: vi.fn().mockImplementation((key: string) => key) },
    settings: { get: vi.fn().mockResolvedValue(null) },
    config: {
      name: 'test-module',
      version: '0.1.0',
      requiredRole: 'GUEST',
      isActive: true,
      isCore: false,
      commands: [
        { command: 'start', description: 'test-module.commands.start' },
        { command: 'ping', description: 'test-module.commands.ping' },
        { command: 'whoami', description: 'test-module.commands.whoami' },
        { command: 'dbtest', description: 'test-module.commands.dbtest' },
        { command: 'status', description: 'test-module.commands.status' },
        { command: 'settings', description: 'test-module.commands.settings' },
        { command: 'event', description: 'test-module.commands.event' },
        { command: 'session', description: 'test-module.commands.session' },
      ],
      features: {
        hasDatabase: false,
        hasNotifications: false,
        hasAttachments: false,
        hasExport: false,
        hasAI: false,
        hasInputEngine: false,
        hasImport: false,
        hasSearch: false,
        hasDynamicCMS: false,
        hasRegional: false,
      },
      requires: { packages: [], optional: [] },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('test-module setup', () => {
  let bot: ReturnType<typeof makeBot>;
  let deps: ModuleDeps;

  beforeEach(() => {
    bot = makeBot();
    deps = makeDeps();
  });

  it('registers exactly 8 command handlers on the bot', async () => {
    await setup(bot as unknown as Bot<Context>, deps);

    expect(bot.command).toHaveBeenCalledTimes(8);
  });

  it('registers handlers for all declared commands', async () => {
    await setup(bot as unknown as Bot<Context>, deps);

    const registeredCommands = (bot.command as ReturnType<typeof vi.fn>).mock.calls.map(
      (call: unknown[]) => call[0],
    );
    expect(registeredCommands).toEqual(
      expect.arrayContaining([
        'start',
        'ping',
        'whoami',
        'dbtest',
        'status',
        'settings',
        'event',
        'session',
      ]),
    );
  });

  it('logs registration with correct commandCount', async () => {
    await setup(bot as unknown as Bot<Context>, deps);

    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'test-module handlers registered', commandCount: 8 }),
    );
  });

  it('registers each handler as a function', async () => {
    await setup(bot as unknown as Bot<Context>, deps);

    const calls = (bot.command as ReturnType<typeof vi.fn>).mock.calls as [string, unknown][];
    for (const [, handler] of calls) {
      expect(typeof handler).toBe('function');
    }
  });
});
