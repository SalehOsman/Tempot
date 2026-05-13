import { describe, expect, it } from 'vitest';
import { createLifecycleMenu } from '../../menus/lifecycle-menu.factory.js';
import { BotHealthStatus, BotRuntimeMode, type ManagedBot } from '../../types/bot.types.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';

const t = (key: string) => key;

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

    expect(labels[0]).toBe('bot-management.actions.activate');
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
});
