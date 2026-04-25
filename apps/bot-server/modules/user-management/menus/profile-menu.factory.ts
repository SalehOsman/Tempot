import { InlineKeyboard } from 'grammy';
import { UserProfile } from '../types/user.types';

export class ProfileMenuFactory {
  static createView(_user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text('✏️ تعديل', 'profile:edit')
      .row()
      .text('📊 إحصائيات', 'profile:stats')
      .row()
      .text('🔙 العودة', 'menu:main');

    return keyboard;
  }

  static createEdit(): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard
      .text('👤 الاسم', 'profile:edit:name')
      .text('📧 البريد', 'profile:edit:email')
      .row()
      .text('🌐 اللغة', 'profile:edit:language')
      .text('🎯 الدور', 'profile:edit:role')
      .row()
      .text('🔙 العودة', 'profile:view');

    return keyboard;
  }

  static createStats(_user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard.text('🔙 العودة', 'profile:view');

    return keyboard;
  }
}
