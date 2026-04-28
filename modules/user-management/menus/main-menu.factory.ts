import { InlineKeyboard } from 'grammy';
import { UserProfile } from '../types/index.js';
import type { ModuleI18n } from '../types/module-deps.types.js';

export class MainMenuFactory {
  static create(user: UserProfile, i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text(i18n.t('user-management.menu.button.profile'), 'profile:view')
      .text(i18n.t('user-management.menu.button.settings'), 'settings:view')
      .row();

    keyboard
      .text(i18n.t('user-management.menu.button.notifications'), 'notifications:view')
      .text(i18n.t('user-management.menu.button.messages'), 'messages:view')
      .row();

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      keyboard
        .text(i18n.t('user-management.menu.button.users'), 'users:list')
        .text(i18n.t('user-management.menu.button.stats'), 'stats:view')
        .row();
    }

    keyboard.text(i18n.t('user-management.menu.button.help'), 'help:view');

    return keyboard;
  }
}
