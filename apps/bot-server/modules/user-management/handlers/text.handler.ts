import { Context } from 'grammy';
import { UserService } from '../services/user.service.js';
import { UserProfile } from '../types/index.js';

interface UserState {
  action: 'edit_name' | 'edit_email' | 'edit_language' | null;
  timestamp: number;
}

const userStates = new Map<string, UserState>();

export async function handleTextInput(ctx: Context): Promise<void> {
  try {
    const message = ctx.message;
    if (!message || !message.text) {
      await ctx.reply('❌ Error: Invalid message');
      return;
    }

    const text = message.text.trim();
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.reply('❌ Error: Could not identify user');
      return;
    }

    const telegramId = telegramUser.id.toString();

    // Get user state
    const userState = userStates.get(telegramId);

    // If no active state, ignore text input
    if (!userState || !userState.action) {
      await ctx.reply('❌ لا يوجد إجراء نشط. يرجى استخدام الأزرار للتنقل.');
      return;
    }

    // Check if state is expired (5 minutes)
    const now = Date.now();
    if (now - userState.timestamp > 5 * 60 * 1000) {
      userStates.delete(telegramId);
      await ctx.reply('⏱️ انتهت صلاحية الإجراء. يرجى المحاولة مرة أخرى.');
      return;
    }

    // Get user profile
    const userResult = await UserService.getByTelegramId(telegramId);

    if (userResult.isErr()) {
      await ctx.reply('❌ الملف الشخصي غير موجود');
      return;
    }

    const user = userResult.value;

    // Handle different actions
    switch (userState.action) {
      case 'edit_name':
        await handleEditName(ctx, user, text);
        break;

      case 'edit_email':
        await handleEditEmail(ctx, user, text);
        break;

      case 'edit_language':
        await handleEditLanguage(ctx, user, text);
        break;

      default:
        await ctx.reply('❌ إجراء غير معروف');
    }

    // Clear user state
    userStates.delete(telegramId);
  } catch {
    // Error logging will be implemented later
    await ctx.reply('❌ حدث خطأ أثناء معالجة طلبك');
  }
}

async function handleEditName(ctx: Context, user: UserProfile, text: string): Promise<void> {
  // Validate name
  if (!text || text.length === 0) {
    await ctx.reply('❌ الاسم لا يمكن أن يكون فارغاً');
    return;
  }

  if (text.length > 50) {
    await ctx.reply('❌ الاسم طويل جداً (حد أقصى 50 حرف)');
    return;
  }

  // Update username
  const updateResult = await UserService.updateUsername(user.id, text);

  if (updateResult.isErr()) {
    await ctx.reply('❌ خطأ في تحديث الاسم');
    return;
  }

  await ctx.reply(`✅ تم تحديث الاسم بنجاح!\n\n👤 الاسم الجديد: ${text}`);
}

async function handleEditEmail(ctx: Context, user: UserProfile, text: string): Promise<void> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(text)) {
    await ctx.reply('❌ البريد الإلكتروني غير صالح');
    return;
  }

  if (text.length > 255) {
    await ctx.reply('❌ البريد الإلكتروني طويل جداً (حد أقصى 255 حرف)');
    return;
  }

  // Update email
  const updateResult = await UserService.updateEmail(user.id, text);

  if (updateResult.isErr()) {
    await ctx.reply('❌ خطأ في تحديث البريد الإلكتروني');
    return;
  }

  await ctx.reply(`✅ تم تحديث البريد الإلكتروني بنجاح!\n\n📧 البريد الجديد: ${text}`);
}

async function handleEditLanguage(ctx: Context, user: UserProfile, text: string): Promise<void> {
  // Validate language
  const validLanguages = ['ar', 'en'];
  if (!validLanguages.includes(text.toLowerCase())) {
    await ctx.reply('❌ اللغة غير صالحة. اللغات المتاحة: ar, en');
    return;
  }

  const language = text.toLowerCase();

  // Update language
  const updateResult = await UserService.updateLanguage(user.id, language);

  if (updateResult.isErr()) {
    await ctx.reply('❌ خطأ في تحديث اللغة');
    return;
  }

  const languageName = language === 'ar' ? 'العربية' : 'English';
  await ctx.reply(`✅ تم تحديث اللغة بنجاح!\n\n🌍 اللغة الجديدة: ${languageName}`);
}

export function setUserState(telegramId: string, action: UserState['action']): void {
  if (action) {
    userStates.set(telegramId, {
      action,
      timestamp: Date.now(),
    });
  } else {
    userStates.delete(telegramId);
  }
}

export function getUserState(telegramId: string): UserState | undefined {
  return userStates.get(telegramId);
}
