import { describe, expect, it } from 'vitest';
import { createBotDetailMenu, createBotListMenu } from '../../menus/bot-menu.factory.js';
import { formatBotDetailMessage, formatBotListMessage } from '../../menus/bot-detail.factory.js';
import { BotRuntimeMode } from '../../types/bot.types.js';
import { BotHealthStatus } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';
import type { ManagedBot } from '../../types/bot.types.js';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

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
    expect(callbacks).toContain('botmgmt:archive:bot-1');
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
