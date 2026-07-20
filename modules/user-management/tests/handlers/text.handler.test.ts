import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleTextInput } from '../../handlers/text.handler.js';
import {
  handleEditEmail,
  handleEditLanguage,
  handleEditName,
  handleEditRole,
} from '../../handlers/text.editors.js';
import {
  handleEditBirthDate,
  handleEditCountryCode,
  handleEditGender,
  handleEditGovernorate,
  handleEditMobile,
  handleEditNationalId,
} from '../../handlers/text-egyptian.editors.js';
import { clearUserInputState, getUserInputState } from '../../handlers/user-state.service.js';
import { getUserService } from '../../services/user-service.context.js';

vi.mock('../../services/user-service.context.js', () => ({
  getUserService: vi.fn(),
}));

vi.mock('../../handlers/user-state.service.js', () => ({
  getUserInputState: vi.fn(),
  clearUserInputState: vi.fn(),
}));

vi.mock('../../handlers/text.editors.js', () => ({
  handleEditName: vi.fn(),
  handleEditEmail: vi.fn(),
  handleEditLanguage: vi.fn(),
  handleEditRole: vi.fn(),
}));

vi.mock('../../handlers/text-egyptian.editors.js', () => ({
  handleEditNationalId: vi.fn(),
  handleEditMobile: vi.fn(),
  handleEditBirthDate: vi.fn(),
  handleEditGender: vi.fn(),
  handleEditGovernorate: vi.fn(),
  handleEditCountryCode: vi.fn(),
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

function createContext(text = 'test input', from: Context['from'] = { id: 123456789 }) {
  return {
    message: text === '' ? { text: '' } : { text },
    from,
    chat: { id: 987654321 },
    reply: vi.fn(),
  } as unknown as Context;
}

describe('handleTextInput', () => {
  const enforce = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    enforce.mockResolvedValue(true);
    registerDeps({
      logger: createLogger(),
      i18n: { t: vi.fn((key: string) => key) },
      eventBus: { publish: vi.fn() },
      sessionProvider: { getSession: vi.fn() },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce },
      config: {} as never,
    });
  });

  it('should ignore invalid messages', async () => {
    const ctx = {
      message: undefined,
      from: { id: 123456789 },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(ctx);

    expect(ctx.reply).not.toHaveBeenCalled();
    expect(getUserInputState).not.toHaveBeenCalled();
  });

  it('should ignore messages when no pending state exists', async () => {
    vi.mocked(getUserInputState).mockResolvedValue(null);
    const ctx = createContext();

    await handleTextInput(ctx);

    expect(ctx.reply).not.toHaveBeenCalled();
    expect(getUserInputState).toHaveBeenCalledWith('123456789', '987654321');
  });

  it('should ignore commands and messages without Telegram users', async () => {
    const commandCtx = createContext('/start');
    const noUserCtx = {
      message: { text: 'hello' },
      chat: { id: 987654321 },
      reply: vi.fn(),
    } as unknown as Context;

    await handleTextInput(commandCtx);
    await handleTextInput(noUserCtx);

    expect(getUserInputState).not.toHaveBeenCalled();
    expect(commandCtx.reply).not.toHaveBeenCalled();
    expect(noUserCtx.reply).not.toHaveBeenCalled();
  });

  it('should reply with profile not found when user lookup fails', async () => {
    vi.mocked(getUserInputState).mockResolvedValue({ action: 'edit_name', timestamp: Date.now() });
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => true,
      }),
    } as never);
    const ctx = createContext();

    await handleTextInput(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('user-management.profile.not_found');
    expect(clearUserInputState).not.toHaveBeenCalled();
  });

  it('should dispatch edit action and clear pending state', async () => {
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
    vi.mocked(getUserInputState).mockResolvedValue({ action: 'edit_name', timestamp: Date.now() });
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: mockUser,
      }),
    } as never);
    const ctx = createContext('New Name');

    await handleTextInput(ctx);

    expect(handleEditName).toHaveBeenCalledWith(ctx, mockUser, 'New Name');
    expect(clearUserInputState).toHaveBeenCalledWith('123456789', '987654321');
  });

  it('enforces profile update authorization before dispatching non-role edits', async () => {
    vi.mocked(getUserInputState).mockResolvedValue({ action: 'edit_email', timestamp: Date.now() });
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          language: 'ar',
          role: 'USER',
          telegramId: '123456789',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    } as never);
    const ctx = createContext('new@example.com');

    await handleTextInput(ctx);

    expect(enforce).toHaveBeenCalledWith(ctx, {
      module: 'user-management',
      classification: 'protected',
      action: 'update',
      subject: 'profile',
    });
    expect(handleEditEmail).toHaveBeenCalled();
  });

  it.each([
    ['edit_language', handleEditLanguage],
    ['edit_national_id', handleEditNationalId],
    ['edit_mobile', handleEditMobile],
    ['edit_birth_date', handleEditBirthDate],
    ['edit_gender', handleEditGender],
    ['edit_governorate', handleEditGovernorate],
    ['edit_country_code', handleEditCountryCode],
  ] as const)('dispatches %s pending input actions', async (action, handler) => {
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
    vi.mocked(getUserInputState).mockResolvedValue({ action, timestamp: Date.now() });
    vi.mocked(getUserService).mockReturnValue({
      getByTelegramId: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: mockUser,
      }),
    } as never);
    const ctx = createContext('New Value');

    await handleTextInput(ctx);

    expect(handler).toHaveBeenCalledWith(ctx, mockUser, 'New Value');
    expect(clearUserInputState).toHaveBeenCalledWith('123456789', '987654321');
  });

  it('does not edit roles or clear state when management authorization is denied', async () => {
    vi.mocked(getUserInputState).mockResolvedValue({
      action: 'edit_role',
      timestamp: Date.now(),
    });
    enforce.mockResolvedValue(false);
    const ctx = createContext('ADMIN');

    await handleTextInput(ctx);

    expect(enforce).toHaveBeenCalledWith(ctx, {
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'roles',
    });
    expect(getUserService).not.toHaveBeenCalled();
    expect(handleEditRole).not.toHaveBeenCalled();
    expect(clearUserInputState).not.toHaveBeenCalled();
  });
});
