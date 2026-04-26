import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTextInput, setUserState } from '../../handlers/text.handler.js';
import { UserService } from '../../services/user.service.js';
import { Context } from 'grammy';

// Mock UserService
vi.mock('../../services/user.service.js', () => ({
  UserService: {
    getByTelegramId: vi.fn(),
    updateUsername: vi.fn(),
    updateEmail: vi.fn(),
    updateLanguage: vi.fn(),
  },
}));

describe('handleTextInput', () => {
  let mockCtx: Context;

  beforeEach(() => {
    mockCtx = {
      message: {
        text: 'test input',
      },
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    vi.clearAllMocks();
    // Clear user states
    setUserState('123456789', null);
  });

  it('should reply with error if message is invalid', async () => {
    mockCtx = {
      message: undefined,
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ Error: Invalid message');
  });

  it('should reply with error if user is not identified', async () => {
    mockCtx = {
      message: {
        text: 'test input',
      },
      from: undefined,
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ Error: Could not identify user');
  });

  it('should reply with error if no active state', async () => {
    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      '❌ لا يوجد إجراء نشط. يرجى استخدام الأزرار للتنقل.',
    );
  });

  it('should reply with error if state is expired', async () => {
    setUserState('123456789', 'edit_name');
    // Wait 6 minutes
    await new Promise((resolve) => setTimeout(resolve, 6 * 60 * 1000));

    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('⏱️ انتهت صلاحية الإجراء. يرجى المحاولة مرة أخرى.');
  });

  it('should update name successfully', async () => {
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

    vi.mocked(UserService.updateUsername).mockResolvedValue({
      isErr: () => false,
      value: undefined,
    } as never);

    setUserState('123456789', 'edit_name');

    await handleTextInput(mockCtx);

    expect(UserService.updateUsername).toHaveBeenCalledWith('1', 'test input');
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('✅ تم تحديث الاسم بنجاح!'));
  });

  it('should reject empty name', async () => {
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

    setUserState('123456789', 'edit_name');
    mockCtx = {
      message: {
        text: '',
      },
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ الاسم لا يمكن أن يكون فارغاً');
  });

  it('should reject name that is too long', async () => {
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

    setUserState('123456789', 'edit_name');
    mockCtx = {
      message: {
        text: 'a'.repeat(51),
      },
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ الاسم طويل جداً (حد أقصى 50 حرف)');
  });

  it('should update email successfully', async () => {
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

    vi.mocked(UserService.updateEmail).mockResolvedValue({
      isErr: () => false,
      value: undefined,
    } as never);

    setUserState('123456789', 'edit_email');
    mockCtx = {
      message: {
        text: 'newemail@example.com',
      },
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(UserService.updateEmail).toHaveBeenCalledWith('1', 'newemail@example.com');
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('✅ تم تحديث البريد الإلكتروني بنجاح!'),
    );
  });

  it('should reject invalid email', async () => {
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

    setUserState('123456789', 'edit_email');
    mockCtx = {
      message: {
        text: 'invalid-email',
      },
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ البريد الإلكتروني غير صالح');
  });

  it('should update language successfully', async () => {
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

    vi.mocked(UserService.updateLanguage).mockResolvedValue({
      isErr: () => false,
      value: undefined,
    } as never);

    setUserState('123456789', 'edit_language');
    mockCtx = {
      message: {
        text: 'en',
      },
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(UserService.updateLanguage).toHaveBeenCalledWith('1', 'en');
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('✅ تم تحديث اللغة بنجاح!'));
  });

  it('should reject invalid language', async () => {
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

    setUserState('123456789', 'edit_language');
    mockCtx = {
      message: {
        text: 'fr',
      },
      from: {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith('❌ اللغة غير صالحة. اللغات المتاحة: ar, en');
  });
});
