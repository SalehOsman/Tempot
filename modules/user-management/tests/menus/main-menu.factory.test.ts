import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { MainMenuFactory } from '../../menus/main-menu.factory.js';
import type { UserProfile } from '../../types/index.js';
import type { ModuleNavigationItem } from '@tempot/module-registry';

interface InlineCallbackButton {
  readonly callback_data?: string;
}

interface InlineKeyboardMarkupLike {
  readonly inline_keyboard: ReadonlyArray<ReadonlyArray<InlineCallbackButton>>;
}

interface NavigationEntryInput {
  readonly id: string;
  readonly callbackData: string;
  readonly row: number;
  readonly order: number;
}

function callbackRowsFrom(markup: unknown): string[][] {
  const keyboard = markup as InlineKeyboardMarkupLike;
  return keyboard.inline_keyboard.map((row) =>
    row.flatMap((button) => (button.callback_data ? [button.callback_data] : [])),
  );
}

function createUserProfile(): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'admin',
    language: 'ar',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date('2026-07-23T00:00:00.000Z'),
    updatedAt: new Date('2026-07-23T00:00:00.000Z'),
  };
}

function createNavigationEntries(): ModuleNavigationItem[] {
  return [
    createNavigationEntry({ id: 'profile', callbackData: 'profile:view', row: 0, order: 10 }),
    createNavigationEntry({ id: 'settings', callbackData: 'settings:view', row: 0, order: 20 }),
    createNavigationEntry({
      id: 'notifications',
      callbackData: 'notifications:view',
      row: 1,
      order: 10,
    }),
    createNavigationEntry({ id: 'messages', callbackData: 'messages:view', row: 1, order: 20 }),
    createNavigationEntry({ id: 'membership', callbackData: 'membership:list', row: 2, order: 10 }),
    createNavigationEntry({ id: 'users', callbackData: 'users:list', row: 2, order: 20 }),
    createNavigationEntry({ id: 'stats', callbackData: 'stats:view', row: 2, order: 30 }),
  ];
}

function createNavigationEntry(input: NavigationEntryInput): ModuleNavigationItem {
  return {
    id: input.id,
    labelKey: `test.menu.${input.id}`,
    callbackData: input.callbackData,
    requiredRole: 'USER',
    row: input.row,
    order: input.order,
  };
}

describe('MainMenuFactory', () => {
  it('should render start menu actions in single-button rows for narrow Telegram clients', () => {
    const keyboard = MainMenuFactory.create(
      createUserProfile(),
      { t: vi.fn((key) => key) },
      createNavigationEntries(),
    );

    expect(callbackRowsFrom(keyboard)).toEqual([
      ['profile:view'],
      ['settings:view'],
      ['notifications:view'],
      ['messages:view'],
      ['membership:list'],
      ['users:list'],
      ['stats:view'],
    ]);
  });

  it('should keep the Arabic welcome name placeholder on its own line', () => {
    const localePath = join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      'locales',
      'ar.json',
    );
    const locale = JSON.parse(readFileSync(localePath, 'utf8')) as {
      'user-management': { menu: { welcome: string } };
    };

    expect(locale['user-management'].menu.welcome).toContain('\n<b>{{name}}</b>\n');
  });
});
