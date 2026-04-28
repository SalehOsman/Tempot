import { InlineKeyboard } from 'grammy';
import type { UserProfile } from '../types/index.js';
import type { ModuleI18n } from '../types/module-deps.types.js';

export class ProfileMenuFactory {
  static createView(_user: UserProfile, i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.profile.button.edit'), 'profile:edit')
      .row()
      .text(i18n.t('user-management.profile.button.stats'), 'profile:stats')
      .row()
      .text(i18n.t('user-management.menu.back'), 'menu:main');
  }

  static createEdit(i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.profile.button.name'), 'profile:edit:name')
      .text(i18n.t('user-management.profile.button.email'), 'profile:edit:email')
      .row()
      .text(i18n.t('user-management.profile.button.language'), 'profile:edit:language')
      .text(i18n.t('user-management.profile.button.role'), 'profile:edit:role')
      .row()
      .text(i18n.t('user-management.profile.button.personal'), 'profile:edit:personal')
      .row()
      .text(i18n.t('user-management.menu.back'), 'profile:view');
  }

  static createEditPersonal(i18n: ModuleI18n): InlineKeyboard {
    return new InlineKeyboard()
      .text(i18n.t('user-management.profile.button.national_id'), 'profile:edit:national_id')
      .row()
      .text(i18n.t('user-management.profile.button.mobile'), 'profile:edit:mobile')
      .row()
      .text(i18n.t('user-management.profile.button.birth_date'), 'profile:edit:birth_date')
      .row()
      .text(i18n.t('user-management.profile.button.gender'), 'profile:edit:gender')
      .row()
      .text(i18n.t('user-management.profile.button.governorate'), 'profile:edit:governorate')
      .row()
      .text(i18n.t('user-management.profile.button.country_code'), 'profile:edit:country_code')
      .row()
      .text(i18n.t('user-management.menu.back'), 'profile:edit');
  }

  static createStats(
    user: UserProfile,
    i18n: ModuleI18n,
  ): { keyboard: InlineKeyboard; message: string } {
    const keyboard = new InlineKeyboard().text(i18n.t('user-management.menu.back'), 'profile:view');

    const message = i18n.t('user-management.profile.stats_message', {
      createdAt: user.createdAt.toLocaleDateString('ar-EG'),
      messageCount: user.messageCount ?? 0,
      completedTasks: user.completedTasks?.toLocaleString('ar-EG') ?? '0',
      activeTime: user.activeTime ?? i18n.t('user-management.profile.zero_active_time'),
      rating: user.rating ?? 'N/A',
    });

    return { keyboard, message };
  }
}
