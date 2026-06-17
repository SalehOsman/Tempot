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
    authorization: {
      guard: vi.fn().mockReturnValue(vi.fn()),
      enforce: vi.fn().mockResolvedValue(true),
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

  it('does not enter template creation when authorization is denied', async () => {
    const deps = createDeps();
    vi.mocked(deps.authorization.enforce).mockResolvedValue(false);
    registerDeps(deps);
    const ctx = createContext('tmpl:create');

    await handleCallbackQuery(ctx);

    expect(deps.authorization.enforce).toHaveBeenCalledWith(ctx, {
      module: 'template-management',
      classification: 'protected',
      action: 'create',
      subject: 'template',
    });
    expect(ctx.reply).not.toHaveBeenCalled();
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

  it('renders public menu, browse, export, and rating callback surfaces', async () => {
    registerDeps(createDeps());

    const main = createContext('tmpl:menu');
    const browse = createContext('tmpl:browse');
    const exportOptions = createContext('tmpl:export:template-1');
    const ratingOptions = createContext('tmpl:rate:template-1');

    await handleCallbackQuery(main);
    await handleCallbackQuery(browse);
    await handleCallbackQuery(exportOptions);
    await handleCallbackQuery(ratingOptions);

    expect(main.editMessageText).toHaveBeenCalledWith('template-management.menu.title', {
      reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
    });
    expect(browse.editMessageText).toHaveBeenCalledWith('template-management.browse.title', {
      reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
    });
    expect(exportOptions.editMessageText).toHaveBeenCalledWith(
      'template-management.actions.export',
      { reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }) },
    );
    expect(ratingOptions.editMessageText).toHaveBeenCalledWith('template-management.rating.title', {
      reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
    });
  });

  it('acknowledges completed or unknown callback actions without editing messages', async () => {
    registerDeps(createDeps());
    const completedExport = createContext('tmpl:export:template-1:json');
    const completedRating = createContext('tmpl:rate:template-1:5');
    const unknown = createContext('tmpl:unknown');

    await handleCallbackQuery(completedExport);
    await handleCallbackQuery(completedRating);
    await handleCallbackQuery(unknown);

    expect(completedExport.answerCallbackQuery).toHaveBeenCalledWith({
      text: 'bot-server.callback_unchanged',
    });
    expect(completedRating.answerCallbackQuery).toHaveBeenCalledWith({
      text: 'bot-server.callback_unchanged',
    });
    expect(unknown.answerCallbackQuery).toHaveBeenCalledWith({
      text: 'bot-server.callback_unchanged',
    });
    expect(completedExport.editMessageText).not.toHaveBeenCalled();
    expect(completedRating.editMessageText).not.toHaveBeenCalled();
    expect(unknown.editMessageText).not.toHaveBeenCalled();
  });
});
