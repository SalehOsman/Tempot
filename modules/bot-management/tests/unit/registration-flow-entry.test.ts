import { describe, expect, it, vi } from 'vitest';
import type { Context } from 'grammy';
import { newBotCommand } from '../../commands/new-bot.command.js';
import { handleCallbackQuery } from '../../handlers/callback.handler.js';

const { enforceMock } = vi.hoisted(() => ({
  enforceMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../deps.context.js', () => ({
  getAuthorization: () => ({
    enforce: enforceMock,
  }),
  getI18n: () => ({
    t: (key: string) => key,
  }),
}));

function createFlowContext(): Context {
  return {
    from: { id: 123 },
    chat: { id: 123 },
    conversation: {
      enter: vi.fn().mockResolvedValue(undefined),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    callbackQuery: { data: 'botmgmt:create' },
  } as unknown as Context;
}

describe('bot registration flow entry points', () => {
  it('starts the shared conversation from /new_bot', async () => {
    const ctx = createFlowContext();

    await newBotCommand(ctx);

    const conversation = ctx as Context & {
      conversation: { enter: ReturnType<typeof vi.fn> };
    };
    expect(conversation.conversation.enter).toHaveBeenCalledWith('bot-management-registration');
  });

  it('starts the same shared conversation from the inline create action', async () => {
    const ctx = createFlowContext();

    await handleCallbackQuery(ctx);

    const conversation = ctx as Context & {
      conversation: { enter: ReturnType<typeof vi.fn> };
    };
    expect(conversation.conversation.enter).toHaveBeenCalledWith('bot-management-registration');
  });
});
