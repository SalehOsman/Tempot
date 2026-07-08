import { describe, expect, it, vi } from 'vitest';
import type { Bot, Context } from 'grammy';
import { createMongoAbility } from '@casl/ability';
import {
  createConversation,
  type Conversation,
  type ConversationFlavor,
} from '@grammyjs/conversations';
import { createBot } from '../../src/bot/bot.factory.js';

type RuntimeConversationContext = Context & ConversationFlavor<Context>;
const runtimeEvents: string[] = [];

vi.mock('../../src/bot/middleware/rate-limiter.middleware.js', () => ({
  createRateLimiterMiddleware:
    () =>
    async (_ctx: Context, next: () => Promise<void>): Promise<void> =>
      next(),
}));

const deps = {
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
  getMaintenanceStatus: vi.fn().mockResolvedValue({
    enabled: false,
    isSuperAdmin: () => false,
  }),
  getSessionUser: vi.fn().mockResolvedValue({ id: '123', role: 'SUPER_ADMIN' }),
  getAccessMode: vi.fn().mockReturnValue('private'),
  abilityDefinitions: [() => createMongoAbility([{ action: 'manage', subject: 'all' }])],
  commandScopeMap: new Map<string, string>(),
  commandModuleMap: {},
  auditLog: vi.fn().mockResolvedValue(undefined),
  sentryReporter: undefined,
  t: (key: string) => key,
};

async function runtimeProbeConversation(
  conversation: Conversation<RuntimeConversationContext>,
  _ctx: RuntimeConversationContext,
): Promise<void> {
  await conversation.external(async () => {
    runtimeEvents.push('runtime.started');
  });
  const next = await conversation.waitFor('message:text');
  await conversation.external(async () => {
    runtimeEvents.push(`runtime.completed:${next.message.text ?? ''}`);
  });
}

async function runtimeCancelableConversation(
  conversation: Conversation<RuntimeConversationContext>,
  _ctx: RuntimeConversationContext,
): Promise<void> {
  await conversation.external(async () => {
    runtimeEvents.push('runtime.cancel.started');
  });
  const next = await conversation.waitFor(['message:text', 'callback_query:data']);
  await conversation.external(async () => {
    runtimeEvents.push(next.callbackQuery?.data ? 'runtime.cancelled' : 'runtime.cancel.missed');
  });
}

describe('conversation runtime integration', () => {
  it('enters, continues, and completes a registered conversation flow', async () => {
    runtimeEvents.length = 0;
    const baseBot = createBot('12345:testtoken', deps);
    const bot = baseBot as unknown as Bot<RuntimeConversationContext>;
    bot.botInfo = {
      id: 1,
      is_bot: true,
      first_name: 'RuntimeBot',
      username: 'runtime_bot',
    };

    bot.use(createConversation(runtimeProbeConversation, 'runtime-probe'));
    bot.command('runtime_flow', async (ctx) => {
      await ctx.conversation.enter('runtime-probe');
    });

    await bot.handleUpdate({
      update_id: 1,
      message: {
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 123, type: 'private' },
        from: { id: 123, is_bot: false, first_name: 'Runtime' },
        text: '/runtime_flow',
        entities: [{ offset: 0, length: 13, type: 'bot_command' }],
      },
    });

    await bot.handleUpdate({
      update_id: 2,
      message: {
        message_id: 2,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 123, type: 'private' },
        from: { id: 123, is_bot: false, first_name: 'Runtime' },
        text: 'done',
      },
    });

    expect(runtimeEvents).toEqual(['runtime.started', 'runtime.completed:done']);
  });

  it('accepts callback-driven cancellation updates inside the active runtime', async () => {
    runtimeEvents.length = 0;
    const baseBot = createBot('12345:testtoken', deps);
    const bot = baseBot as unknown as Bot<RuntimeConversationContext>;
    bot.botInfo = {
      id: 1,
      is_bot: true,
      first_name: 'RuntimeBot',
      username: 'runtime_bot',
    };

    bot.use(createConversation(runtimeCancelableConversation, 'runtime-cancel'));
    bot.command('runtime_cancel', async (ctx) => {
      await ctx.conversation.enter('runtime-cancel');
    });

    await bot.handleUpdate({
      update_id: 3,
      message: {
        message_id: 3,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 123, type: 'private' },
        from: { id: 123, is_bot: false, first_name: 'Runtime' },
        text: '/runtime_cancel',
        entities: [{ offset: 0, length: 15, type: 'bot_command' }],
      },
    });

    await bot.handleUpdate({
      update_id: 4,
      callback_query: {
        id: 'cancel-query',
        chat_instance: 'runtime-chat',
        from: { id: 123, is_bot: false, first_name: 'Runtime' },
        data: 'ie:runtime-cancel:0:__cancel__',
        message: {
          message_id: 4,
          date: Math.floor(Date.now() / 1000),
          chat: { id: 123, type: 'private' },
          text: 'cancel runtime',
        },
      },
    });

    expect(runtimeEvents).toEqual(['runtime.cancel.started', 'runtime.cancelled']);
  });
});
