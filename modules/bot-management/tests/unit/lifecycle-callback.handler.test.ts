import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context } from 'grammy';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BotHealthStatus, BotRuntimeMode, type ManagedBot } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';

const { getDetailMock, transitionMock } = vi.hoisted(() => ({
  getDetailMock: vi.fn(),
  transitionMock: vi.fn(),
}));

vi.mock('../../deps.context.js', () => ({
  getI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../services/bot-service.context.js', () => ({
  getBotService: () => ({
    getDetail: getDetailMock,
  }),
}));

vi.mock('../../services/lifecycle-service.context.js', () => ({
  getLifecycleService: () => ({
    transition: transitionMock,
  }),
}));

vi.mock('../../menus/bot-detail.factory.js', () => ({
  formatBotDetailMessage: () => 'bot detail',
  formatBotListMessage: () => 'bot list',
}));

vi.mock('../../menus/bot-menu.factory.js', () => ({
  createBotDetailMenu: () => ({ inline_keyboard: [['detail-menu']] }),
  createBotListMenu: () => ({ inline_keyboard: [['list-menu']] }),
}));

vi.mock('../../menus/lifecycle-menu.factory.js', () => ({
  createLifecycleMenu: () => ({ inline_keyboard: [['lifecycle-menu']] }),
  createArchiveConfirmationMenu: () => ({ inline_keyboard: [['archive-confirm-menu']] }),
}));

import { handleCallbackQuery } from '../../handlers/callback.handler.js';

function createBot(status: BotLifecycleStatus): ManagedBot {
  return {
    id: 'bot-1',
    displayName: 'Support Bot',
    telegramUsername: 'support_bot',
    tokenFingerprint: 'fingerprint',
    tokenRedacted: '1234567...abcd',
    ownerId: 'admin-1',
    runtimeMode: BotRuntimeMode.POLLING,
    status,
    defaultLocale: 'ar-EG',
    defaultCountry: 'EG',
    timezone: 'Africa/Cairo',
    healthStatus: BotHealthStatus.UNKNOWN,
    createdAt: new Date('2026-05-12T00:00:00.000Z'),
    updatedAt: new Date('2026-05-12T00:00:00.000Z'),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };
}

function createContext(data: string): Context {
  return {
    from: { id: 123 },
    callbackQuery: { data },
    conversation: {
      enter: vi.fn().mockResolvedValue(undefined),
    },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

describe('handleCallbackQuery lifecycle controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lifecycle controls from the lifecycle callback', async () => {
    const ctx = createContext('botmgmt:lifecycle:bot-1');
    getDetailMock.mockResolvedValue(ok(createBot(BotLifecycleStatus.CONFIGURED)));

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith('bot detail', {
      reply_markup: { inline_keyboard: [['lifecycle-menu']] },
    });
  });

  it('executes direct valid transitions through LifecycleService and redraws detail', async () => {
    const ctx = createContext('botmgmt:lifecycle-transition:bot-1:ACTIVE');
    transitionMock.mockResolvedValue(ok(createBot(BotLifecycleStatus.ACTIVE)));

    await handleCallbackQuery(ctx);

    expect(transitionMock).toHaveBeenCalledWith({
      botId: 'bot-1',
      toStatus: BotLifecycleStatus.ACTIVE,
      actorId: '123',
    });
    expect(ctx.editMessageText).toHaveBeenCalledWith('bot detail', {
      reply_markup: { inline_keyboard: [['detail-menu']] },
    });
  });

  it('reports stale or invalid direct transitions without false success', async () => {
    const ctx = createContext('botmgmt:lifecycle-transition:bot-1:ACTIVE');
    transitionMock.mockResolvedValue(err(new AppError('bot-management.invalid_transition')));

    await handleCallbackQuery(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('bot-management.error.invalid_transition');
    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });

  it('reports missing bots when lifecycle controls cannot load', async () => {
    const ctx = createContext('botmgmt:lifecycle:bot-404');
    getDetailMock.mockResolvedValue(err(new AppError('bot-management.not_found')));

    await handleCallbackQuery(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('bot-management.error.not_found');
    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });

  it('starts the shared reason flow for governed lifecycle transitions', async () => {
    const ctx = createContext('botmgmt:lifecycle-reason:bot-1:PAUSED');

    await handleCallbackQuery(ctx);

    const conversation = ctx as Context & {
      conversation: { enter: ReturnType<typeof vi.fn> };
    };
    expect(conversation.conversation.enter).toHaveBeenCalledWith(
      'bot-management-lifecycle-reason',
      {
        botId: 'bot-1',
        toStatus: BotLifecycleStatus.PAUSED,
      },
    );
  });

  it('renders archive confirmation before the governed archive flow starts', async () => {
    const ctx = createContext('botmgmt:lifecycle-archive-confirm:bot-1');

    await handleCallbackQuery(ctx);

    const conversation = ctx as Context & {
      conversation: { enter: ReturnType<typeof vi.fn> };
    };
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'bot-management.lifecycle.archive_confirmation',
      {
        reply_markup: { inline_keyboard: [['archive-confirm-menu']] },
      },
    );
    expect(conversation.conversation.enter).not.toHaveBeenCalled();
  });

  it('routes legacy archive callbacks into the confirmation surface', async () => {
    const ctx = createContext('botmgmt:archive:bot-1');

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      'bot-management.lifecycle.archive_confirmation',
      {
        reply_markup: { inline_keyboard: [['archive-confirm-menu']] },
      },
    );
  });

  it('starts the governed archive flow only after archive confirmation is approved', async () => {
    const ctx = createContext('botmgmt:lifecycle-archive-start:bot-1');

    await handleCallbackQuery(ctx);

    const conversation = ctx as Context & {
      conversation: { enter: ReturnType<typeof vi.fn> };
    };
    expect(conversation.conversation.enter).toHaveBeenCalledWith(
      'bot-management-lifecycle-reason',
      {
        botId: 'bot-1',
        toStatus: BotLifecycleStatus.ARCHIVED,
      },
    );
  });
});
