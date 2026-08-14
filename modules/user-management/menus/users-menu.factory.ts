import { InlineKeyboard } from 'grammy';
import type { UserProfile } from '../types/index.js';
import type { ModuleI18n } from '../types/module-deps.types.js';

export class UsersMenuFactory {
  static createList(users: readonly UserProfile[], i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    users.forEach((user) => {
      keyboard
        .text(
          i18n.t('user-management.users.button.user', {
            name: user.username || user.telegramId,
          }),
          `users:view:${user.id}`,
        )
        .row();
    });

    keyboard
      .text(i18n.t('user-management.users.button.search'), 'users:search')
      .row()
      .text(i18n.t('user-management.menu.back'), 'menu:main');

    return keyboard;
  }

  static createSearchResults(users: readonly UserProfile[], i18n: ModuleI18n): InlineKeyboard {
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
      .text(i18n.t('user-management.users.button.role_guest'), `users:role:${user.id}:GUEST`)
      .row()
      .text(i18n.t('user-management.users.button.role_user'), `users:role:${user.id}:USER`)
      .row()
      .text(i18n.t('user-management.users.button.role_admin'), `users:role:${user.id}:ADMIN`)
      .row()
      .text(
        i18n.t('user-management.users.button.role_super_admin'),
        `users:role:${user.id}:SUPER_ADMIN`,
      )
      .row()
      .text(i18n.t('user-management.menu.back'), `users:view:${user.id}`);

    return keyboard;
  }

  static createRoleConfirm(userId: string, role: string, i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.common.yes'), `users:role-confirm:${userId}:${role}`)
      .text(i18n.t('user-management.common.no'), `users:role-cancel:${userId}`);
  }

  static createUserDetail(user: UserProfile, i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text(i18n.t('user-management.profile.button.edit'), `users:edit:${user.id}`)
      .row()
      .text(i18n.t('user-management.users.role.change'), `users:roles:${user.id}`)
      .row()
      .text(i18n.t('user-management.users.button.activity'), `users:activity:${user.id}`)
      .row()
      .text(i18n.t('user-management.users.button.notifications'), `users:notifications:${user.id}`)
      .row()
      .text(
        i18n.t('user-management.users.button.test_notification'),
        `users:test-notification:${user.id}`,
      )
      .row();

    if (user.status === 'BANNED') {
      keyboard
        .text(i18n.t('user-management.users.button.unblock'), `users:unblock:${user.id}`)
        .row();
    } else {
      keyboard.text(i18n.t('user-management.users.button.block'), `users:block:${user.id}`).row();
    }

    keyboard.text(i18n.t('user-management.menu.back'), 'users:list');

    return keyboard;
  }

  static createUserEdit(userId: string, i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.profile.button.name'), `users:edit:${userId}:name`)
      .text(i18n.t('user-management.profile.button.email'), `users:edit:${userId}:email`)
      .row()
      .text(i18n.t('user-management.profile.button.language'), `users:edit:${userId}:language`)
      .row()
      .text(
        i18n.t('user-management.profile.button.national_id'),
        `users:edit:${userId}:national_id`,
      )
      .row()
      .text(i18n.t('user-management.profile.button.mobile'), `users:edit:${userId}:mobile`)
      .row()
      .text(i18n.t('user-management.profile.button.birth_date'), `users:edit:${userId}:birth_date`)
      .row()
      .text(i18n.t('user-management.profile.button.gender'), `users:edit:${userId}:gender`)
      .row()
      .text(
        i18n.t('user-management.profile.button.governorate'),
        `users:edit:${userId}:governorate`,
      )
      .row()
      .text(
        i18n.t('user-management.profile.button.country_code'),
        `users:edit:${userId}:country_code`,
      )
      .row()
      .text(i18n.t('user-management.menu.back'), `users:view:${userId}`);
  }

  static createConfirm(action: string, i18n: ModuleI18n): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text(i18n.t('user-management.common.yes'), `${action}:confirm`)
      .text(i18n.t('user-management.common.no'), `${action}:cancel`);

    return keyboard;
  }

  static createBlockConfirm(userId: string, i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.users.button.confirm_block'), `users:block-confirm:${userId}`)
      .text(i18n.t('user-management.common.cancel'), `users:block-cancel:${userId}`);
  }

  static createUnblockConfirm(userId: string, i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(
        i18n.t('user-management.users.button.confirm_unblock'),
        `users:unblock-confirm:${userId}`,
      )
      .text(i18n.t('user-management.common.cancel'), `users:unblock-cancel:${userId}`);
  }
}
