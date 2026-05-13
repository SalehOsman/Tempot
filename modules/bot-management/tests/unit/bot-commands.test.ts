import { describe, expect, it } from 'vitest';
import { createBotDetailMenu, createBotListMenu } from '../../menus/bot-menu.factory.js';
import { formatBotDetailMessage, formatBotListMessage } from '../../menus/bot-detail.factory.js';
import { BotRuntimeMode } from '../../types/bot.types.js';
import { BotHealthStatus } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';
import type { ManagedBot } from '../../types/bot.types.js';

const t = (key: string, options?: Record<string, unknown>) => uxLabel(key, options);

const uxLabel = (key: string, options?: Record<string, unknown>) => {
  if (key === 'bot-management.menu.bot_entry') {
    return `🤖 ${String(options?.name ?? '')}`;
  }
  if (options) return `${key}:${JSON.stringify(options)}`;

  const labels: Record<string, string> = {
    'bot-management.menu.previous': '⬅️ Previous',
    'bot-management.menu.next': '➡️ Next',
    'bot-management.menu.create': '➕ New bot',
    'bot-management.menu.refresh': '🔄 Refresh',
    'bot-management.menu.lifecycle': '🔁 Lifecycle',
    'bot-management.menu.settings': '⚙️ Settings',
    'bot-management.menu.modules': '📦 Modules',
    'bot-management.menu.back': '↩️ Back',
  };

  return labels[key] ?? key;
};

const bot: ManagedBot = {
  id: 'bot-1',
  displayName: 'Support Bot',
  telegramUsername: 'support_bot',
  tokenFingerprint: 'fingerprint',
  tokenRedacted: '123456:...abcd',
  ownerId: 'admin-1',
  runtimeMode: BotRuntimeMode.POLLING,
  status: BotLifecycleStatus.DRAFT,
  defaultLocale: 'ar-EG',
  defaultCountry: 'EG',
  timezone: 'Africa/Cairo',
  healthStatus: BotHealthStatus.UNKNOWN,
  createdAt: new Date('2026-05-12T00:00:00.000Z'),
  updatedAt: new Date('2026-05-12T00:00:00.000Z'),
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
};

describe('bot-management menus', () => {
  it('creates a list menu with create and refresh actions', () => {
    const menu = createBotListMenu({ t, bots: [bot], page: 0, totalPages: 1 });
    const callbacks = menu.inline_keyboard.flat().map((button) => button.callback_data);

    expect(callbacks).toContain('botmgmt:view:bot-1');
    expect(callbacks).toContain('botmgmt:create');
    expect(callbacks).toContain('botmgmt:list:0');
  });

  it('creates a detail menu with production management sections', () => {
    const menu = createBotDetailMenu(t, bot);
    const callbacks = menu.inline_keyboard.flat().map((button) => button.callback_data);

    expect(callbacks).toContain('botmgmt:lifecycle:bot-1');
    expect(callbacks).toContain('botmgmt:settings:bot-1');
    expect(callbacks).toContain('botmgmt:modules:bot-1');
    expect(callbacks).not.toContain('botmgmt:archive:bot-1');
  });

  it('uses icon-prefixed operational labels and mobile-friendly bot menu rows', () => {
    const listMenu = createBotListMenu({ t: uxLabel, bots: [], page: 0, totalPages: 1 });
    const detailMenu = createBotDetailMenu(uxLabel, bot);

    expect(listMenu.inline_keyboard.map((row) => row.map((button) => button.text))).toEqual([
      ['➕ New bot', '🔄 Refresh'],
    ]);
    expect(detailMenu.inline_keyboard.map((row) => row.map((button) => button.text))).toEqual([
      ['🔁 Lifecycle', '⚙️ Settings'],
      ['📦 Modules'],
      ['↩️ Back'],
    ]);
  });

  it('formats list and detail messages without raw credential data', () => {
    const listMessage = formatBotListMessage(t, {
      bots: [bot],
      totalCount: 1,
      page: 0,
      pageSize: 5,
    });
    const detailMessage = formatBotDetailMessage(t, bot);

    expect(listMessage).toContain('Support Bot');
    expect(detailMessage).toContain('123456:...abcd');
    expect(detailMessage).not.toContain('fingerprint');
  });
});
