import { InlineKeyboard } from 'grammy';
import { UserProfile } from '../types/index.js';
import type { ModuleI18n } from '../types/module-deps.types.js';

export class UsersMenuFactory {
  static createList(i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text(i18n.t('user-management.users.button.search'), 'users:search')
      .text(i18n.t('user-management.users.button.list'), 'users:list')
      .row()
      .text(i18n.t('user-management.menu.back'), 'menu:main');

    return keyboard;
  }

  static createSearchResults(users: UserProfile[], i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    users.forEach((user, index) => {
      keyboard.text(
        i18n.t('user-management.users.button.user', {
          name: user.username || user.telegramId,
        }),
        `users:view:${user.id}`,
      );

      if (index % 2 === 1) {
        keyboard.row();
      }
    });

    keyboard.row().text(i18n.t('user-management.menu.back'), 'users:list');

    return keyboard;
  }

  static createRoleChange(user: UserProfile, i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text(i18n.t('user-management.users.button.role_user'), `users:role:${user.id}:USER`)
      .text(
        i18n.t('user-management.users.button.role_moderator'),
        `users:role:${user.id}:MODERATOR`,
      )
      .row()
      .text(i18n.t('user-management.users.button.role_admin'), `users:role:${user.id}:ADMIN`)
      .text(
        i18n.t('user-management.users.button.role_super_admin'),
        `users:role:${user.id}:SUPER_ADMIN`,
      )
      .row()
      .text(i18n.t('user-management.menu.back'), `users:view:${user.id}`);

    return keyboard;
  }

  static createConfirm(action: string, i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text(i18n.t('user-management.common.yes'), `${action}:confirm`)
      .text(i18n.t('user-management.common.no'), `${action}:cancel`);

    return keyboard;
  }
}
