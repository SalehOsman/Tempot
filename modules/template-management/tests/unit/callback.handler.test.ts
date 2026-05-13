import { describe, expect, it, vi } from 'vitest';
import type { Context } from 'grammy';
import type { ModuleDeps } from '../../index.js';
import { handleCallbackQuery } from '../../handlers/callback.handler.js';
import { registerDeps } from '../../deps.context.js';

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

function createContext(data: string): Context {
  return {
    callbackQuery: { data, message: { message_id: 10 } },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

describe('template-management callback handler', () => {
  it('passes unrelated callback namespaces to later module handlers', async () => {
    const ctx = createContext('menu:main');
    const next = vi.fn().mockResolvedValue(undefined);
    const callbackHandler = handleCallbackQuery as unknown as (
      inputCtx: Context,
      nextHandler: () => Promise<void>,
    ) => Promise<void>;

    await callbackHandler(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.answerCallbackQuery).not.toHaveBeenCalled();
  });

  it('opens the new template prompt from the create menu callback', async () => {
    registerDeps(createDeps());
    const ctx = createContext('tmpl:create');

    await handleCallbackQuery(ctx);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledTimes(1);
    expect(ctx.reply).toHaveBeenCalledWith('template-management.wizard.step_name');
  });

  it('opens the my templates surface from the main menu callback', async () => {
    registerDeps(createDeps());
    const ctx = createContext('tmpl:my');

    await handleCallbackQuery(ctx);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledTimes(1);
    expect(ctx.editMessageText).toHaveBeenCalledWith('template-management.menu.my_templates', {
      reply_markup: expect.objectContaining({
        inline_keyboard: expect.any(Array),
      }),
    });
  });
});
