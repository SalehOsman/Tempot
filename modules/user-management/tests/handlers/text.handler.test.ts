import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDeps } from '../../deps.context.js';
import { handleTextInput } from '../../handlers/text.handler.js';
import { handleEditName } from '../../handlers/text.editors.js';
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
});
