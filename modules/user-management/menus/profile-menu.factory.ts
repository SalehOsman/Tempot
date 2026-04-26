import { InlineKeyboard } from 'grammy';
import type { UserProfile } from '../types/index.js';

export class ProfileMenuFactory {

  /** عرض الملف الشخصي — كل الحقول */
  static createView(_user: UserProfile): InlineKeyboard {
    return new InlineKeyboard()
      .text('✏️ تعديل', 'profile:edit')
      .row()
      .text('📊 إحصائيات', 'profile:stats')
      .row()
      .text('🔙 العودة', 'menu:main');
  }

  /** قائمة التعديل — الحقول الأساسية */
  static createEdit(): InlineKeyboard {
    return new InlineKeyboard()
      .text('👤 الاسم', 'profile:edit:name')
      .text('📧 البريد', 'profile:edit:email')
      .row()
      .text('🌐 اللغة', 'profile:edit:language')
      .text('🎯 الدور', 'profile:edit:role')
      .row()
      .text('📋 البيانات الشخصية', 'profile:edit:personal')
      .row()
      .text('🔙 العودة', 'profile:view');
  }

  /** قائمة التعديل — البيانات الشخصية المصرية */
  static createEditPersonal(): InlineKeyboard {
    return new InlineKeyboard()
      .text('🪪 رقم الهوية', 'profile:edit:national_id')
      .row()
      .text('📱 رقم الجوال', 'profile:edit:mobile')
      .row()
      .text('🎂 تاريخ الميلاد', 'profile:edit:birth_date')
      .row()
      .text('👤 الجنس', 'profile:edit:gender')
      .row()
      .text('🗺️ المحافظة', 'profile:edit:governorate')
      .row()
      .text('🌍 رمز الدولة', 'profile:edit:country_code')
      .row()
      .text('🔙 العودة', 'profile:edit');
  }

  static createStats(user: UserProfile): { keyboard: InlineKeyboard; message: string } {
    const keyboard = new InlineKeyboard().text('🔙 العودة', 'profile:view');

    const formattedDate = user.createdAt.toLocaleDateString('ar-EG');
    const message = `
📊 إحصائياتك

📅 تاريخ التسجيل: ${formattedDate}
📨 الرسائل: ${user.messageCount ?? 0}
✅ المهام المكتملة: ${user.completedTasks?.toLocaleString('ar-EG') ?? '0'}
⏱️ الوقت النشط: ${user.activeTime ?? '0 ساعة'}
🌟 التقييم: ${user.rating ?? 'N/A'}
    `.trim();

    return { keyboard, message };
  }
}
