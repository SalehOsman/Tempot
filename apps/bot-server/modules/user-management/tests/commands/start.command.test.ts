import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startCommand } from '../../commands/start.command.js';
import { UserService } from '../../services/user.service.js';
import { MainMenuFactory } from '../../menus/main-menu.factory.js';
import { Context } from 'grammy';

// Mock UserService
vi.mock('../../services/user.service.js', () => ({
  UserService: {
    getByTelegramId: vi.fn(),
  },
}));

// Mock MainMenuFactory
vi.mock('../../menus/main-menu.factory.js', () => ({
  MainMenuFactory: {
    create: vi.fn(),
  },
}));

describe('startCommand', () => {
  let mockCtx: Context;

  beforeEach(() => {
    mockCtx = {
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    vi.clearAllMocks();
  });

  it('should reply with error if user is not identified', async () => {
    mockCtx = {
      from: undefined,
      reply: vi.fn(),
    } as unknown as Context;

    await startCommand(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ Error: Could not identify user');
  });

  it('should reply with registration message if user does not exist', async () => {
    vi.mocked(UserService.getByTelegramId).mockResolvedValue({
      isErr: () => true,
      value: undefined,
    } as never);

    await startCommand(mockCtx);

    expect(UserService.getByTelegramId).toHaveBeenCalledWith('123456789');
    expect(mockCtx.reply).toHaveBeenCalledWith(
      '👋 مرحباً بك في Tempot\n\n⚠️ يرجى التسجيل أولاً باستخدام /register',
    );
  });

  it('should reply with welcome message and menu if user exists', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      language: 'ar',
      role: 'USER',
      telegramId: '123456789',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(UserService.getByTelegramId).mockResolvedValue({
      isErr: () => false,
      value: mockUser,
    } as never);

    const mockKeyboard = {
      text: vi.fn(),
      row: vi.fn(),
    };

    vi.mocked(MainMenuFactory.create).mockReturnValue(mockKeyboard as never);

    await startCommand(mockCtx);

    expect(UserService.getByTelegramId).toHaveBeenCalledWith('123456789');
    expect(MainMenuFactory.create).toHaveBeenCalledWith(mockUser);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('👋 مرحباً testuser!'),
      expect.objectContaining({
        parse_mode: 'HTML',
        reply_markup: mockKeyboard,
      }),
    );
  });

  it('should reply with error message on exception', async () => {
    vi.mocked(UserService.getByTelegramId).mockRejectedValue(new Error('Database error'));

    await startCommand(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      '❌ حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
    );
  });
});
