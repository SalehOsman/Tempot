import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleCallbackQuery } from '../../handlers/callback.handler.js';
import { getUserService } from '../../services/user-service.context.js';
import type { UserProfile } from '../../types/index.js';

vi.mock('../../services/user-service.context.js', () => ({
  getUserService: vi.fn(),
}));

function createLogger() {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  };
  logger.child.mockReturnValue(logger);
  return logger;
}

function createContext(data: string): Context {
  return {
    callbackQuery: { data, message: { message_id: 10 } },
    from: { id: 123456789 },
    answerCallbackQuery: vi.fn(),
    editMessageText: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

interface InlineCallbackButton {
  readonly callback_data?: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
}

function callbackDataFrom(markup: unknown): string[] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.flatMap((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

function createUserProfile(role: UserProfile['role'] = 'ADMIN'): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'admin',
    email: 'admin@example.com',
    language: 'ar',
    role,
    createdAt: new Date('2026-05-23T00:00:00.000Z'),
    updatedAt: new Date('2026-05-23T00:00:00.000Z'),
  };
}

describe('handleCallbackQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish: vi.fn() },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      config: {} as never,
    });
  });

  it('passes non-user-management callback namespaces to downstream handlers', async () => {
    const ctx = createContext('ie:bot-management-registration:2:__cancel__');
    const next = vi.fn().mockResolvedValue(undefined);

    await handleCallbackQuery(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.answerCallbackQuery).not.toHaveBeenCalled();
    expect(getUserService).not.toHaveBeenCalled();
  });

  it('renders the user list without repeating the selected list callback', async () => {
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: createUserProfile(),
      }),
      searchUsers: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: [createUserProfile()],
      }),
    } as never);
    const ctx = createContext('users:list');

    await handleCallbackQuery(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledOnce();
    const [, options] = vi.mocked(ctx.editMessageText).mock.calls[0]!;
    const callbacks = callbackDataFrom(options.reply_markup);
    expect(callbacks).not.toContain('users:list');
    expect(callbacks).toContain('users:search');
    expect(callbacks).toContain('menu:main');
  });
});
