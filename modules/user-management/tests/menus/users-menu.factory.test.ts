import { describe, expect, it, vi } from 'vitest';
import { UsersMenuFactory } from '../../menus/users-menu.factory.js';
import type { UserProfile } from '../../types/index.js';

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

function callbackRowsFrom(markup: unknown): string[][] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.map((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

function createUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'admin',
    email: 'admin@example.com',
    language: 'en',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date('2026-05-23T00:00:00.000Z'),
    updatedAt: new Date('2026-05-23T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UsersMenuFactory', () => {
  it('should expose only constitution-approved role choices', () => {
    const i18n = { t: vi.fn((key: string) => key) };
    const keyboard = UsersMenuFactory.createRoleChange(createUserProfile(), i18n);

    const callbacks = callbackDataFrom(keyboard);

    expect(callbacks).toContain('users:role:user-1:GUEST');
    expect(callbacks).toContain('users:role:user-1:USER');
    expect(callbacks).toContain('users:role:user-1:ADMIN');
    expect(callbacks).toContain('users:role:user-1:SUPER_ADMIN');
    expect(callbacks).not.toContain('users:role:user-1:MODERATOR');
  });

  it('should render role choices in single-button rows for narrow bot menus', () => {
    const i18n = { t: vi.fn((key: string) => key) };
    const keyboard = UsersMenuFactory.createRoleChange(createUserProfile(), i18n);

    expect(callbackRowsFrom(keyboard)).toEqual([
      ['users:role:user-1:GUEST'],
      ['users:role:user-1:USER'],
      ['users:role:user-1:ADMIN'],
      ['users:role:user-1:SUPER_ADMIN'],
      ['users:view:user-1'],
    ]);
    expect(i18n.t).toHaveBeenCalledWith('user-management.users.button.role_guest');
  });

  it('should expose support actions from user detail screens', () => {
    const i18n = { t: vi.fn((key: string) => key) };
    const keyboard = UsersMenuFactory.createUserDetail(createUserProfile(), i18n);

    const callbacks = callbackDataFrom(keyboard);

    expect(callbacks).toContain('users:edit:user-1');
    expect(callbacks).toContain('users:activity:user-1');
    expect(callbacks).toContain('users:notifications:user-1');
    expect(callbacks).toContain('users:test-notification:user-1');
    expect(callbacks).toContain('users:block:user-1');
  });

  it('should render user detail actions in single-button rows for narrow bot menus', () => {
    const i18n = { t: vi.fn((key: string) => key) };
    const keyboard = UsersMenuFactory.createUserDetail(createUserProfile(), i18n);

    expect(callbackRowsFrom(keyboard)).toEqual([
      ['users:edit:user-1'],
      ['users:roles:user-1'],
      ['users:activity:user-1'],
      ['users:notifications:user-1'],
      ['users:test-notification:user-1'],
      ['users:block:user-1'],
      ['users:list'],
    ]);
  });

  it('should expose unblock instead of block for blocked users', () => {
    const i18n = { t: vi.fn((key: string) => key) };
    const keyboard = UsersMenuFactory.createUserDetail(
      createUserProfile({ status: 'BANNED' }),
      i18n,
    );

    const callbacks = callbackDataFrom(keyboard);

    expect(callbacks).toContain('users:unblock:user-1');
    expect(callbacks).not.toContain('users:block:user-1');
  });
});
