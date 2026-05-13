import { describe, expect, it } from 'vitest';
import { createLifecycleMenu } from '../../menus/lifecycle-menu.factory.js';
import { BotHealthStatus, BotRuntimeMode, type ManagedBot } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';

const t = (key: string) => uxLabel(key);
const uxLabel = (key: string) =>
  ({
    'bot-management.actions.configure': '⚙️ Configure',
    'bot-management.actions.activate': '▶️ Activate',
    'bot-management.actions.pause': '⏸️ Pause',
    'bot-management.actions.resume': '▶️ Resume',
    'bot-management.actions.maintenance': '⚙️ Maintenance',
    'bot-management.actions.archive': '🗄️ Archive',
    'bot-management.actions.confirm_archive': '🗄️ Confirm archive',
    'bot-management.menu.back': '↩️ Back',
  })[key] ?? key;

function createBot(status: BotLifecycleStatus): ManagedBot {
  return {
    id: 'bot-1',
    displayName: 'Support Bot',
    telegramUsername: 'support_bot',
    tokenFingerprint: 'fingerprint',
    tokenRedacted: '1234567...abcd',
    ownerId: 'admin-1',
    runtimeMode: BotRuntimeMode.POLLING,
    status,
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
}

function callbacks(bot: ManagedBot): Array<string | undefined> {
  return createLifecycleMenu(t, bot)
    .inline_keyboard.flat()
    .map((button) => button.callback_data);
}

describe('createLifecycleMenu', () => {
  it('shows configured-state transitions plus back navigation', () => {
    expect(callbacks(createBot(BotLifecycleStatus.CONFIGURED))).toEqual([
      'botmgmt:lifecycle-transition:bot-1:ACTIVE',
      'botmgmt:lifecycle-archive-confirm:bot-1',
      'botmgmt:view:bot-1',
    ]);
  });

  it('labels configured-to-active as activation rather than resume', () => {
    const labels = createLifecycleMenu(t, createBot(BotLifecycleStatus.CONFIGURED))
      .inline_keyboard.flat()
      .map((button) => button.text);

    expect(labels[0]).toBe('▶️ Activate');
  });

  it('shows active-state pause, maintenance, archive, and back actions', () => {
    expect(callbacks(createBot(BotLifecycleStatus.ACTIVE))).toEqual([
      'botmgmt:lifecycle-reason:bot-1:PAUSED',
      'botmgmt:lifecycle-reason:bot-1:MAINTENANCE',
      'botmgmt:lifecycle-archive-confirm:bot-1',
      'botmgmt:view:bot-1',
    ]);
  });

  it('keeps archived bots navigable without exposing new lifecycle actions', () => {
    expect(callbacks(createBot(BotLifecycleStatus.ARCHIVED))).toEqual(['botmgmt:view:bot-1']);
  });

  it('uses operational icons and readable lifecycle rows on mobile', () => {
    const menu = createLifecycleMenu(uxLabel, createBot(BotLifecycleStatus.ACTIVE));

    expect(menu.inline_keyboard.map((row) => row.map((button) => button.text))).toEqual([
      ['⏸️ Pause', '⚙️ Maintenance'],
      ['🗄️ Archive'],
      ['↩️ Back'],
    ]);
  });

  it('keeps archive confirmation compact and explicit', async () => {
    const { createArchiveConfirmationMenu } = await import('../../menus/lifecycle-menu.factory.js');
    const menu = createArchiveConfirmationMenu(uxLabel, 'bot-1');

    expect(menu.inline_keyboard.map((row) => row.map((button) => button.text))).toEqual([
      ['🗄️ Confirm archive'],
      ['↩️ Back'],
    ]);
  });
});
