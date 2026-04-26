import { Context } from 'grammy';
import { UserService } from '../services/user.service.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';

export async function usersCommand(ctx: Context): Promise<void> {
  try {
    // Get user info from Telegram
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.reply('❌ Error: Could not identify user');
      return;
    }

    const telegramId = telegramUser.id.toString();

    // Get user profile to check permissions
    const userResult = await UserService.getByTelegramId(telegramId);

    if (userResult.isErr()) {
      await ctx.reply('❌ الملف الشخصي غير موجود');
      return;
    }

    const user = userResult.value;

    // Check if user has permission to view users
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      await ctx.reply('⚠️ ليس لديك صلاحية للوصول إلى هذه الميزة');
      return;
    }

    // Get users list
    const usersResult = await UserService.searchUsers('', 0, 10);

    if (usersResult.isErr()) {
      await ctx.reply('❌ خطأ في جلب قائمة المستخدمين');
      return;
    }

    const users = usersResult.value;

    // Create users menu
    const keyboard = UsersMenuFactory.createList();

    // Send users list message with menu
    let usersMessage = `👥 إدارة المستخدمين\n\n`;

    if (users.length === 0) {
      usersMessage += '❌ لم يتم العثور على مستخدمين';
    } else {
      usersMessage += `📊 عدد المستخدمين: ${users.length}\n\n`;

      users.slice(0, 5).forEach((u, index) => {
        usersMessage += `${index + 1}. ${u.username || 'غير محدد'} (${u.role})\n`;
      });

      if (users.length > 5) {
        usersMessage += `\n... و ${users.length - 5} مستخدمين آخرين`;
      }
    }

    await ctx.reply(usersMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch {
    // Error logging will be implemented later
    await ctx.reply('❌ حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.');
  }
}
