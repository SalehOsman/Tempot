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

function createUserProfile(): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'admin',
    email: 'admin@example.com',
    language: 'en',
    role: 'USER',
    createdAt: new Date('2026-05-23T00:00:00.000Z'),
    updatedAt: new Date('2026-05-23T00:00:00.000Z'),
  };
}

describe('UsersMenuFactory', () => {
  it('should expose only constitution-approved role choices', () => {
    const i18n = { t: vi.fn((key: string) => key) };
    const keyboard = UsersMenuFactory.createRoleChange(createUserProfile(), i18n);

    const callbacks = callbackDataFrom(keyboard);

    expect(callbacks).toContain('users:role:user-1:USER');
    expect(callbacks).toContain('users:role:user-1:ADMIN');
    expect(callbacks).toContain('users:role:user-1:SUPER_ADMIN');
    expect(callbacks).not.toContain('users:role:user-1:MODERATOR');
  });

  it('should expose support actions from user detail screens', () => {
    const i18n = { t: vi.fn((key: string) => key) };
    const keyboard = UsersMenuFactory.createUserDetail(createUserProfile(), i18n);

    const callbacks = callbackDataFrom(keyboard);

    expect(callbacks).toContain('users:edit:user-1');
    expect(callbacks).toContain('users:activity:user-1');
    expect(callbacks).toContain('users:notifications:user-1');
    expect(callbacks).toContain('users:test-notification:user-1');
  });
});
