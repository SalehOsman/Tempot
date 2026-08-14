import { InlineKeyboard } from 'grammy';
import { createInlineKeyboard, type TempotInlineKeyboard } from '@tempot/ux-helpers';
import type { ManagedBot } from '../types/bot.types.js';

export function createBotListMenu(input: {
  t: (key: string, options?: Record<string, unknown>) => string;
  bots: ManagedBot[];
  page: number;
  totalPages: number;
}): InlineKeyboard {
  const { t, bots, page, totalPages } = input;
  const keyboard = createInlineKeyboard();

  for (const bot of bots) {
    addButton(
      keyboard,
      t('bot-management.menu.bot_entry', { name: bot.displayName }),
      `botmgmt:view:${bot.id}`,
    );
    keyboard.row();
  }

  if (totalPages > 1) {
    if (page > 0) {
      addButton(keyboard, t('bot-management.menu.previous'), `botmgmt:list:${page - 1}`);
    }
    if (page < totalPages - 1) {
      addButton(keyboard, t('bot-management.menu.next'), `botmgmt:list:${page + 1}`);
    }
    keyboard.row();
  }

  addButton(keyboard, t('bot-management.menu.create'), 'botmgmt:create');
  addButton(keyboard, t('bot-management.menu.refresh'), `botmgmt:list:${page}`);
  return keyboard.toGrammyKeyboard();
}

export function createBotDetailMenu(
  t: (key: string, options?: Record<string, unknown>) => string,
  bot: ManagedBot,
): InlineKeyboard {
  const keyboard = createInlineKeyboard();

  addButton(keyboard, t('bot-management.menu.lifecycle'), `botmgmt:lifecycle:${bot.id}`);
  addButton(keyboard, t('bot-management.menu.settings'), `botmgmt:settings:${bot.id}`);
  keyboard.row();
  addButton(keyboard, t('bot-management.menu.modules'), `botmgmt:modules:${bot.id}`);
  keyboard.row();
  addButton(keyboard, t('bot-management.menu.back'), 'botmgmt:list:0');

  return keyboard.toGrammyKeyboard();
}

function addButton(
  keyboard: TempotInlineKeyboard,
  label: string,
  callbackData: string,
): TempotInlineKeyboard {
  const result = keyboard.button({ label, callbackData });
  if (result.isErr()) throw result.error;
  return result.value;
}
