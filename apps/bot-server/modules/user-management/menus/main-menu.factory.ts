import { InlineKeyboard } from 'grammy';
import { UserProfile } from '../types/user.types';

export class MainMenuFactory {
  static create(user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    // Row 1: Quick Actions
    keyboard.text('👤 ملفي', 'profile:view').text('⚙️ إعدادات', 'settings:view').row();

    // Row 2: Secondary Actions
    keyboard.text('🔔 إشعارات', 'notifications:view').text('📨 رسائل', 'messages:view').row();

    // Row 3: Admin Actions (if admin)
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      keyboard.text('👥 مستخدمين', 'users:list').text('📊 إحصائيات', 'stats:view').row();
    }

    // Row 4: Help
    keyboard.text('❓ مساعدة', 'help:view');

    return keyboard;
  }
}
