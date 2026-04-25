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

  static createStats(user: UserProfile): { keyboard: InlineKeyboard; message: string } {
    const keyboard = new InlineKeyboard();

    const formattedDate = user.createdAt.toLocaleDateString('ar-EG');
    const formattedTasks = user.completedTasks?.toLocaleString('ar-EG') || '0';

    const message = `
📊 إحصائياتك

📨 الرسائل: ${user.messageCount || 0}
✅ المهام المكتملة: ${formattedTasks}
⏱️ الوقت النشط: ${user.activeTime || '0 ساعة'}
🌟 التقييم: ${user.rating || 'N/A'}
📅 انضم: ${formattedDate}
`;

    keyboard.text('🔙 العودة', 'profile:view');

    return { keyboard, message };
  }
}
