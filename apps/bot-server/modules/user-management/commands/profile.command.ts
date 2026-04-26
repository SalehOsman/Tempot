import { Context } from 'grammy';
import { UserService } from '../services/user.service.js';
import { ProfileMenuFactory } from '../menus/profile-menu.factory.js';

export async function profileCommand(ctx: Context): Promise<void> {
  try {
    // Get user info from Telegram
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.reply('❌ Error: Could not identify user');
      return;
    }

    const telegramId = telegramUser.id.toString();

    // Get user profile
    const userResult = await UserService.getByTelegramId(telegramId);

    if (userResult.isErr()) {
      await ctx.reply('❌ الملف الشخصي غير موجود');
      return;
    }

    const user = userResult.value;

    // Create profile menu
    const keyboard = ProfileMenuFactory.createView(user);

    // Send profile message with menu
    const profileMessage = `
👤 ملفك الشخصي

📊 المعلومات:
👤 الاسم: ${user.username || 'غير محدد'}
📧 البريد الإلكتروني: ${user.email || 'غير محدد'}
🌍 اللغة: ${user.language}
🎯 الدور: ${user.role}
📅 تاريخ التسجيل: ${new Date(user.createdAt).toLocaleDateString('ar-EG')}

🔧 ماذا تريد أن تفعل؟
    `.trim();

    await ctx.reply(profileMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch {
    // Error logging will be implemented later
    await ctx.reply('❌ حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.');
  }
}
