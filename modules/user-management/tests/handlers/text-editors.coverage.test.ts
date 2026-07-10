import type { Context } from 'grammy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleEnum } from '@tempot/auth-core';
import { AppError, sessionContext } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { registerDeps } from '../../deps.context.js';
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

function createContext(): Context {
  return { reply: vi.fn().mockResolvedValue(undefined) } as unknown as Context;
}

function user(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'saleh',
    email: 'saleh@example.com',
    language: 'ar',
    role: RoleEnum.USER,
    createdAt: new Date('2026-06-17T00:00:00.000Z'),
    updatedAt: new Date('2026-06-17T00:00:00.000Z'),
    ...overrides,
  };
}

function registerTestDeps(): void {
  registerDeps({
    logger: createLogger(),
    i18n: {
      t: vi.fn(
        (key: string, options?: Record<string, unknown>) =>
          `${key}:${JSON.stringify(options ?? {})}`,
      ),
    },
    eventBus: { publish: vi.fn() },
    sessionProvider: { getSession: vi.fn() },
    settings: { get: vi.fn() },
    authorization: { guard: vi.fn(), enforce: vi.fn().mockResolvedValue(true) },
    config: {} as never,
  });
}

describe('basic text editors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTestDeps();
  });

  it('validates name input and persists valid names', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateUsername: vi.fn().mockResolvedValue(ok(undefined)),
    } as never);

    await handleEditName(ctx, user(), '');
    await handleEditName(ctx, user(), 'New Name');

    expect(ctx.reply).toHaveBeenNthCalledWith(1, 'user-management.validation.name.required:{}');
    expect(vi.mocked(getUserService)().updateUsername).toHaveBeenCalledWith('user-1', 'New Name');
  });

  it('validates email input and reports persistence errors', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateEmail: vi.fn().mockResolvedValue(err(new AppError('user-management.email_failed'))),
    } as never);

    await handleEditEmail(ctx, user(), 'not-an-email');
    await handleEditEmail(ctx, user(), 'new@example.com');

    expect(ctx.reply).toHaveBeenNthCalledWith(1, 'user-management.validation.email.invalid:{}');
    expect(ctx.reply).toHaveBeenNthCalledWith(2, 'user-management.profile.update_error:{}');
  });

  it('validates language and role updates', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateLanguage: vi.fn().mockResolvedValue(ok(undefined)),
      updateRole: vi.fn().mockResolvedValue(ok(undefined)),
    } as never);

    await handleEditLanguage(ctx, user(), 'fr');
    await handleEditLanguage(ctx, user(), 'EN');
    await handleEditRole(ctx, user(), 'guest');
    await handleEditRole(ctx, user(), 'ADMIN');

    expect(ctx.reply).toHaveBeenNthCalledWith(
      1,
      'user-management.validation.language.invalid:{"valid":"ar, en"}',
    );
    expect(vi.mocked(getUserService)().updateLanguage).toHaveBeenCalledWith('user-1', 'en');
    expect(ctx.reply).toHaveBeenNthCalledWith(
      3,
      'user-management.validation.role.invalid:{"valid":"USER, ADMIN, SUPER_ADMIN"}',
    );
    expect(vi.mocked(getUserService)().updateRole).toHaveBeenCalledWith('user-1', RoleEnum.ADMIN);
  });

  it('uses the newly selected language for the language update confirmation', async () => {
    const currentSession = {
      userId: '123456789',
      chatId: '456',
      role: RoleEnum.USER,
      status: 'ACTIVE' as const,
      language: 'ar',
      activeConversation: null,
      metadata: null,
      schemaVersion: 1,
      version: 1,
      createdAt: new Date('2026-06-17T00:00:00.000Z'),
      updatedAt: new Date('2026-06-17T00:00:00.000Z'),
    };
    const saveSession = vi.fn().mockResolvedValue(ok(undefined));
    registerDeps({
      logger: createLogger(),
      i18n: {
        t: vi.fn((key: string, options?: Record<string, unknown>) => {
          const locale = sessionContext.getStore()?.locale ?? 'none';
          return `${locale}:${key}:${JSON.stringify(options ?? {})}`;
        }),
      },
      eventBus: { publish: vi.fn() },
      sessionProvider: {
        getSession: vi.fn().mockResolvedValue(currentSession),
        saveSession,
      },
      settings: { get: vi.fn() },
      authorization: { guard: vi.fn(), enforce: vi.fn().mockResolvedValue(true) },
      config: {} as never,
    });
    const ctx = {
      reply: vi.fn().mockResolvedValue(undefined),
      from: { id: 123456789 },
      chat: { id: 456 },
    } as unknown as Context;
    vi.mocked(getUserService).mockReturnValue({
      updateLanguage: vi.fn().mockResolvedValue(ok(undefined)),
    } as never);

    await sessionContext.run({ userId: 'user-1', locale: 'ar' }, async () => {
      await handleEditLanguage(ctx, user(), 'EN');
    });

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('en:user-management.profile.updated'),
      { parse_mode: 'HTML' },
    );
    expect(saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '123456789',
        chatId: '456',
        language: 'en',
      }),
    );
  });
});

describe('Egyptian profile text editors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTestDeps();
  });

  it('validates and persists national IDs with extracted data feedback', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateNationalId: vi.fn().mockResolvedValue(
        ok({
          extracted: true,
          data: {
            gender: 'male',
            birthDate: new Date(1980, 8, 1),
            governorate: 'eg.governorates.cairo',
          },
        }),
      ),
    } as never);

    await handleEditNationalId(ctx, user(), '123');
    await handleEditNationalId(ctx, user(), '28009010100332');

    expect(ctx.reply).toHaveBeenNthCalledWith(
      1,
      'user-management.validation.national_id.invalid:{}',
    );
    expect(vi.mocked(getUserService)().updateNationalId).toHaveBeenCalledWith(
      'user-1',
      '28009010100332',
      undefined,
    );
  });

  it('persists national IDs without extracted data when the service reports no extraction', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateNationalId: vi.fn().mockResolvedValue(ok({ extracted: false })),
    } as never);

    await handleEditNationalId(ctx, user({ countryCode: '+966' }), '28009010100332');

    expect(ctx.reply).toHaveBeenCalledWith('user-management.profile.national_id_saved_only:{}', {
      parse_mode: 'HTML',
    });
  });

  it('validates and persists mobile numbers', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateMobileNumber: vi.fn().mockResolvedValue(ok(undefined)),
    } as never);

    await handleEditMobile(ctx, user(), '123');
    await handleEditMobile(ctx, user(), '+20 0100-123-4567');

    expect(ctx.reply).toHaveBeenNthCalledWith(1, 'user-management.validation.mobile.invalid:{}');
    expect(vi.mocked(getUserService)().updateMobileNumber).toHaveBeenCalledWith(
      'user-1',
      '+2001001234567',
    );
  });

  it('validates and persists birth dates', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateBirthDate: vi.fn().mockResolvedValue(ok(undefined)),
    } as never);

    await handleEditBirthDate(ctx, user(), 'bad-date');
    await handleEditBirthDate(ctx, user(), '2020-01-01');
    await handleEditBirthDate(ctx, user(), '01/01/1990');

    expect(ctx.reply).toHaveBeenNthCalledWith(
      1,
      'user-management.validation.birth_date.invalid:{}',
    );
    expect(ctx.reply).toHaveBeenNthCalledWith(
      2,
      'user-management.validation.birth_date.out_of_range:{}',
    );
    expect(vi.mocked(getUserService)().updateBirthDate).toHaveBeenCalledOnce();
  });

  it('validates and persists gender, governorate, and country code updates', async () => {
    const ctx = createContext();
    vi.mocked(getUserService).mockReturnValue({
      updateGender: vi.fn().mockResolvedValue(ok(undefined)),
      updateGovernorate: vi.fn().mockResolvedValue(ok(undefined)),
      updateCountryCode: vi.fn().mockResolvedValue(ok(undefined)),
    } as never);

    await handleEditGender(ctx, user(), 'unknown');
    await handleEditGender(ctx, user(), 'female');
    await handleEditGovernorate(ctx, user(), 'x');
    await handleEditGovernorate(ctx, user(), 'Cairo');
    await handleEditCountryCode(ctx, user(), '+abc');
    await handleEditCountryCode(ctx, user(), '20');

    expect(ctx.reply).toHaveBeenNthCalledWith(1, 'user-management.validation.gender.invalid:{}');
    expect(vi.mocked(getUserService)().updateGender).toHaveBeenCalledWith('user-1', 'female');
    expect(ctx.reply).toHaveBeenNthCalledWith(
      3,
      'user-management.validation.governorate.invalid:{}',
    );
    expect(vi.mocked(getUserService)().updateGovernorate).toHaveBeenCalledWith('user-1', 'Cairo');
    expect(ctx.reply).toHaveBeenNthCalledWith(
      5,
      'user-management.validation.country_code.invalid:{}',
    );
    expect(vi.mocked(getUserService)().updateCountryCode).toHaveBeenCalledWith('user-1', '+20');
  });
});
