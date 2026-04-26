import { InlineKeyboard } from 'grammy';
import { UserProfile } from '../types/index.js';

export class UsersMenuFactory {
  static createList(): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text('🔍 بحث', 'users:search')
      .text('📋 القائمة', 'users:list')
      .row()
      .text('🔙 العودة', 'menu:main');

    return keyboard;
  }

  static createSearchResults(users: UserProfile[]): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    users.forEach((user, index) => {
      keyboard.text(`👤 ${user.username || user.telegramId}`, `users:view:${user.id}`);

      if (index % 2 === 1) {
        keyboard.row();
      }
    });

    keyboard.row().text('🔙 العودة', 'users:list');

    return keyboard;
  }

  static createRoleChange(user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text('👤 مستخدم', `users:role:${user.id}:USER`)
      .text('👨‍💼 مشرف', `users:role:${user.id}:MODERATOR`)
      .row()
      .text('👨‍💻 مدير', `users:role:${user.id}:ADMIN`)
      .text('👑 مدير عام', `users:role:${user.id}:SUPER_ADMIN`)
      .row()
      .text('🔙 العودة', `users:view:${user.id}`);

    return keyboard;
  }

  static createConfirm(action: string): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard.text('✅ نعم', `${action}:confirm`).text('❌ لا', `${action}:cancel`);

    return keyboard;
  }
}
