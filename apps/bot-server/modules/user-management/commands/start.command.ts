import { Context } from 'grammy';
import { UserService } from '../services/user.service.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';

export async function startCommand(ctx: Context): Promise<void> {
  try {
    // Get user info from Telegram
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.reply('❌ Error: Could not identify user');
      return;
    }

    const telegramId = telegramUser.id.toString();

    // Get or create user profile
    const userResult = await UserService.getByTelegramId(telegramId);

    if (userResult.isErr()) {
      // User doesn't exist, create new user
      // User creation will be implemented later
      await ctx.reply('👋 مرحباً بك في Tempot\n\n⚠️ يرجى التسجيل أولاً باستخدام /register');
      return;
    }

    const user = userResult.value;

    // Create main menu
    const keyboard = MainMenuFactory.create(user);

    // Send welcome message with menu
    const welcomeMessage = `
👋 مرحباً ${user.username || telegramUser.first_name}!

🤖 مرحباً بك في Tempot - منصة الإدارة الذكية

📊 إحصائياتك:
👤 الدور: ${user.role}
🌍 اللغة: ${user.language}

🔧 ماذا تريد أن تفعل؟
    `.trim();

    await ctx.reply(welcomeMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch {
    // Error logging will be implemented later
    await ctx.reply('❌ حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.');
  }
}
