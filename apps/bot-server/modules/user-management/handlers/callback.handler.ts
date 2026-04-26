import { Context } from 'grammy';
import { UserService } from '../services/user.service.js';
import { ProfileMenuFactory } from '../menus/profile-menu.factory.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';
import { UserProfile } from '../types/index.js';

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

    case 'edit':
      await handleProfileEditAction(ctx);
      break;

    case 'stats':
      await handleProfileStatsAction(ctx, user);
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

async function handleProfileEditAction(ctx: Context): Promise<void> {
  const editKeyboard = ProfileMenuFactory.createEdit();
  const editMessage = '✏️ اختر الحقل الذي تريد تعديله:';

  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText(editMessage, {
      parse_mode: 'HTML',
      reply_markup: editKeyboard,
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

async function handleUsersAction(ctx: Context, user: UserProfile, params: string[]): Promise<void> {
  // Check permissions
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    await ctx.answerCallbackQuery('⚠️ ليس لديك صلاحية للوصول إلى هذه الميزة');
    return;
  }

  const subAction = params[0];

  switch (subAction) {
    case 'list':
      await handleUsersListAction(ctx);
      break;

    case 'search':
      // Search functionality will be implemented later
      await ctx.answerCallbackQuery('🔍 البحث قيد التطوير...');
      break;

    case 'view': {
      const userId = params[1];
      // User view functionality will be implemented later
      await ctx.answerCallbackQuery(`👤 عرض المستخدم ${userId} قيد التطوير...`);
      break;
    }

    case 'role': {
      const targetUserId = params[1];
      const newRole = params[2];
      // Role change functionality will be implemented later
      await ctx.answerCallbackQuery(
        `🎯 تغيير دور المستخدم ${targetUserId} إلى ${newRole} قيد التطوير...`,
      );
      break;
    }

    default:
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

async function handleUsersListAction(ctx: Context): Promise<void> {
  const usersResult = await UserService.searchUsers('', 0, 10);

  if (usersResult.isErr()) {
    await ctx.answerCallbackQuery('❌ خطأ في جلب قائمة المستخدمين');
    return;
  }

  const users = usersResult.value;
  const listKeyboard = UsersMenuFactory.createList();

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

  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText(usersMessage, {
      parse_mode: 'HTML',
      reply_markup: listKeyboard,
    });
  }
  await ctx.answerCallbackQuery();
}
