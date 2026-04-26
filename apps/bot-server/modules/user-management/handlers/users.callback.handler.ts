import { Context } from 'grammy';
import { UserService } from '../services/user.service.js';
import { UsersMenuFactory } from '../menus/users-menu.factory.js';
import { UserProfile } from '../types/index.js';

export async function handleUsersAction(
  ctx: Context,
  user: UserProfile,
  params: string[],
): Promise<void> {
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
