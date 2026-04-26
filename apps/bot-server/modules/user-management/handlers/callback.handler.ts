import { Context } from 'grammy';
import { UserService } from '../services/user.service.js';
import { ProfileMenuFactory } from '../menus/profile-menu.factory.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';
import { UserProfile } from '../types/index.js';
import { setUserState } from './text.handler.js';
import { handleUsersAction } from './users.callback.handler.js';

export async function handleCallbackQuery(ctx: Context): Promise<void> {
  try {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !callbackQuery.data) {
      await ctx.answerCallbackQuery('❌ Error: Invalid callback query');
      return;
    }

    const data = callbackQuery.data;
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.answerCallbackQuery('❌ Error: Could not identify user');
      return;
    }

    const telegramId = telegramUser.id.toString();

    // Parse callback data
    const [action, ...params] = data.split(':');

    // Get user profile
    const userResult = await UserService.getByTelegramId(telegramId);

    if (userResult.isErr()) {
      await ctx.answerCallbackQuery('❌ الملف الشخصي غير موجود');
      return;
    }

    const user = userResult.value;

    // Handle different actions
    switch (action) {
      case 'menu':
        await handleMenuAction(ctx, user, params);
        break;

      case 'profile':
        await handleProfileAction(ctx, user, params);
        break;

      case 'users':
        await handleUsersAction(ctx, user, params);
        break;

      default:
        await ctx.answerCallbackQuery('❌ إجراء غير معروف');
    }
  } catch {
    // Error logging will be implemented later
    await ctx.answerCallbackQuery('❌ حدث خطأ أثناء معالجة طلبك');
  }
}

async function handleMenuAction(ctx: Context, user: UserProfile, params: string[]): Promise<void> {
  const subAction = params[0];

  switch (subAction) {
    case 'main': {
      const mainKeyboard = MainMenuFactory.create(user);
      const welcomeMessage = `
👋 مرحباً ${user.username}!

🤖 مرحباً بك في Tempot - منصة الإدارة الذكية

📊 إحصائياتك:
👤 الدور: ${user.role}
🌍 اللغة: ${user.language}

🔧 ماذا تريد أن تفعل؟
      `.trim();

      if (ctx.callbackQuery?.message) {
        await ctx.editMessageText(welcomeMessage, {
          parse_mode: 'HTML',
          reply_markup: mainKeyboard,
        });
      }
      await ctx.answerCallbackQuery();
      break;
    }

    default:
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

async function handleProfileAction(
  ctx: Context,
  user: UserProfile,
  params: string[],
): Promise<void> {
  const subAction = params[0];

  switch (subAction) {
    case 'view':
      await handleProfileViewAction(ctx, user);
      break;

    case 'stats':
      await handleProfileStatsAction(ctx, user);
      break;

    case 'edit:name':
      await handleProfileEditNameAction(ctx);
      break;

    case 'edit:email':
      await handleProfileEditEmailAction(ctx);
      break;

    case 'edit:language':
      await handleProfileEditLanguageAction(ctx);
      break;

    default:
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

async function handleProfileViewAction(ctx: Context, user: UserProfile): Promise<void> {
  const profileKeyboard = ProfileMenuFactory.createView(user);
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

  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText(profileMessage, {
      parse_mode: 'HTML',
      reply_markup: profileKeyboard,
    });
  }
  await ctx.answerCallbackQuery();
}

async function handleProfileStatsAction(ctx: Context, user: UserProfile): Promise<void> {
  const statsResult = ProfileMenuFactory.createStats(user);
  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText(statsResult.message, {
      parse_mode: 'HTML',
      reply_markup: statsResult.keyboard,
    });
  }
  await ctx.answerCallbackQuery();
}

async function handleProfileEditNameAction(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) {
    await ctx.answerCallbackQuery('❌ Error: Could not identify user');
    return;
  }
  setUserState(telegramId, 'edit_name');
  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText('✏️ أدخل الاسم الجديد:', { parse_mode: 'HTML' });
  }
  await ctx.answerCallbackQuery();
}

async function handleProfileEditEmailAction(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) {
    await ctx.answerCallbackQuery('❌ Error: Could not identify user');
    return;
  }
  setUserState(telegramId, 'edit_email');
  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText('✏️ أدخل البريد الإلكتروني الجديد:', { parse_mode: 'HTML' });
  }
  await ctx.answerCallbackQuery();
}

async function handleProfileEditLanguageAction(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) {
    await ctx.answerCallbackQuery('❌ Error: Could not identify user');
    return;
  }
  setUserState(telegramId, 'edit_language');
  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText('✏️ أدخل اللغة الجديدة (ar أو en):', { parse_mode: 'HTML' });
  }
  await ctx.answerCallbackQuery();
}
