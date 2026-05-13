import { InlineKeyboard } from 'grammy';
import type { ManagedBot } from '../types/bot.types.js';

export function createBotListMenu(input: {
  t: (key: string, options?: Record<string, unknown>) => string;
  bots: ManagedBot[];
  page: number;
  totalPages: number;
}): InlineKeyboard {
  const { t, bots, page, totalPages } = input;
  const keyboard = new InlineKeyboard();

  for (const bot of bots) {
    keyboard.text(bot.displayName, `botmgmt:view:${bot.id}`).row();
  }

  if (totalPages > 1) {
    if (page > 0) keyboard.text(t('bot-management.menu.previous'), `botmgmt:list:${page - 1}`);
    if (page < totalPages - 1)
      keyboard.text(t('bot-management.menu.next'), `botmgmt:list:${page + 1}`);
    keyboard.row();
  }

  keyboard.text(t('bot-management.menu.create'), 'botmgmt:create');
  keyboard.text(t('bot-management.menu.refresh'), `botmgmt:list:${page}`);
  return keyboard;
}

export function createBotDetailMenu(
  t: (key: string, options?: Record<string, unknown>) => string,
  bot: ManagedBot,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('bot-management.menu.lifecycle'), `botmgmt:lifecycle:${bot.id}`)
    .text(t('bot-management.menu.settings'), `botmgmt:settings:${bot.id}`)
    .row()
    .text(t('bot-management.menu.modules'), `botmgmt:modules:${bot.id}`)
    .row()
    .text(t('bot-management.menu.back'), 'botmgmt:list:0');
}
