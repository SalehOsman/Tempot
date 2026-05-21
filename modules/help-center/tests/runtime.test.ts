import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import setup, { type ModuleDeps } from '../index.js';
import { helpCommand } from '../commands/help.command.js';
import { handleCallbackQuery } from '../handlers/callback.handler.js';

function createDeps(): ModuleDeps {
  return {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
    eventBus: { publish: vi.fn().mockResolvedValue({ isOk: () => true }) },
    sessionProvider: { getSession: vi.fn() },
    i18n: { t: (key: string) => key },
    settings: { get: vi.fn().mockResolvedValue(undefined) },
    navigation: { getMainMenuItems: vi.fn().mockReturnValue([]) },
    config: createConfig('help-center'),
  };
}

function createConfig(name: string): ModuleDeps['config'] {
  return {
    name,
    version: '0.1.0',
    requiredRole: 'USER',
    isActive: true,
    isCore: false,
    commands: [],
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
  };
}

describe('help-center runtime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers help command and callback handler', async () => {
    const bot = { command: vi.fn(), on: vi.fn() };
    await setup(bot as never, createDeps());
    expect(bot.command).toHaveBeenCalledWith('help', helpCommand);
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', handleCallbackQuery);
  });

  it('shows contextual help from command', async () => {
    await setup({ command: vi.fn(), on: vi.fn() } as never, createDeps());
    const ctx = { reply: vi.fn() } as unknown as Context;
    await helpCommand(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('help-center.view.title', expect.any(Object));
  });
});
