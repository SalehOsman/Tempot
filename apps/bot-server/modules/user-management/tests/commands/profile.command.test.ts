import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileCommand } from '../../commands/profile.command.js';
import { UserService } from '../../services/user.service.js';
import { ProfileMenuFactory } from '../../menus/profile-menu.factory.js';
import { Context } from 'grammy';

// Mock UserService
vi.mock('../../services/user.service.js', () => ({
  UserService: {
    getByTelegramId: vi.fn(),
  },
}));

// Mock ProfileMenuFactory
vi.mock('../../menus/profile-menu.factory.js', () => ({
  ProfileMenuFactory: {
    createView: vi.fn(),
  },
}));

describe('profileCommand', () => {
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

    await profileCommand(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ Error: Could not identify user');
  });

  it('should reply with error if user profile does not exist', async () => {
    vi.mocked(UserService.getByTelegramId).mockResolvedValue({
      isErr: () => true,
      value: undefined,
    } as never);

    await profileCommand(mockCtx);

    expect(UserService.getByTelegramId).toHaveBeenCalledWith('123456789');
    expect(mockCtx.reply).toHaveBeenCalledWith('❌ الملف الشخصي غير موجود');
  });

  it('should reply with profile message and menu if user exists', async () => {
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

    vi.mocked(ProfileMenuFactory.createView).mockReturnValue(mockKeyboard as never);

    await profileCommand(mockCtx);

    expect(UserService.getByTelegramId).toHaveBeenCalledWith('123456789');
    expect(ProfileMenuFactory.createView).toHaveBeenCalledWith(mockUser);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('👤 ملفك الشخصي'),
      expect.objectContaining({
        parse_mode: 'HTML',
        reply_markup: mockKeyboard,
      }),
    );
  });

  it('should reply with error message on exception', async () => {
    vi.mocked(UserService.getByTelegramId).mockRejectedValue(new Error('Database error'));

    await profileCommand(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      '❌ حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
    );
  });
});
