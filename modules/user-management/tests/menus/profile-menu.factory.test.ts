import { describe, expect, it, vi } from 'vitest';
import { RoleEnum } from '@tempot/auth-core';
import { ProfileMenuFactory } from '../../menus/profile-menu.factory.js';
import type { ModuleI18n } from '../../types/module-deps.types.js';
import type { UserProfile } from '../../types/index.js';

function createI18n(): ModuleI18n {
  return {
    t: vi.fn((key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    ),
  };
}

function createUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'Saleh Osman',
    email: 'saleh@example.com',
    language: 'ar',
    role: RoleEnum.ADMIN,
    createdAt: new Date('2026-05-01T10:00:00.000Z'),
    updatedAt: new Date('2026-05-31T10:00:00.000Z'),
    nationalId: '28009010100332',
    mobileNumber: '01222228985',
    birthDate: new Date('1980-09-01T00:00:00.000Z'),
    gender: 'male',
    governorate: 'Cairo',
    countryCode: '20+',
    ...overrides,
  };
}

function formatArabicNumber(value: number): string {
  return new Intl.NumberFormat('ar-EG').format(value);
}

describe('ProfileMenuFactory.createStats', () => {
  it('should not show role editing to regular members', () => {
    const i18n = createI18n();

    const result = ProfileMenuFactory.createEdit(createUser({ role: RoleEnum.USER }), i18n);

    expect(callbackDataFrom(result)).not.toContain('profile:edit:role');
    expect(callbackDataFrom(result)).toContain('profile:edit:language');
  });

  it('should show role editing only to users with management roles', () => {
    const i18n = createI18n();

    const result = ProfileMenuFactory.createEdit(createUser({ role: RoleEnum.ADMIN }), i18n);

    expect(callbackDataFrom(result)).toContain('profile:edit:role');
  });

  it('renders professional profile indicators from actual user data', () => {
    const i18n = createI18n();

    const result = ProfileMenuFactory.createStats(createUser(), i18n);

    expect(result.message).toContain('user-management.profile.stats_message');
    expect(result.message).toContain(`"completionPercent":"${formatArabicNumber(100)}%"`);
    expect(result.message).toContain(`"completedFields":"${formatArabicNumber(10)}"`);
    expect(result.message).toContain(`"totalFields":"${formatArabicNumber(10)}"`);
    expect(result.message).toContain('user-management.profile.status.complete');
    expect(result.message).toContain('user-management.profile.status.verified');
    expect(result.message).toContain('user-management.role.ADMIN');
    expect(result.message).toContain('user-management.language.ar');
    expect(result.message).not.toContain('N/A');
  });

  it('does not present missing activity metrics as real zero values', () => {
    const i18n = createI18n();

    ProfileMenuFactory.createStats(createUser({ messageCount: undefined }), i18n);

    expect(i18n.t).toHaveBeenCalledWith('user-management.profile.activity_unavailable');
    expect(i18n.t).not.toHaveBeenCalledWith('user-management.profile.metric_unavailable');
  });

  it('renders activity metrics only when actual values are available', () => {
    const i18n = createI18n();

    const result = ProfileMenuFactory.createStats(
      createUser({
        messageCount: 0,
        completedTasks: 3,
        activeTime: '2 hours',
        rating: '4.8/5',
      }),
      i18n,
    );

    expect(result.message).toContain('user-management.profile.activity_summary');
    expect(result.message).not.toContain('user-management.profile.activity_unavailable');
  });
});

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
