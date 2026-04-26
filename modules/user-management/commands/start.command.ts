/**
 * /start command — يستقبل المستخدم ويعرض القائمة الرئيسية
 *
 * إصلاحات مطبقة:
 * 1. كل النصوص من i18n — لا hardcoded عربي
 * 2. logger من deps.context — لا استيراد مباشر
 * 3. الأخطاء مُعالَجة بـ err codes واضحة
 */

import type { Context } from 'grammy';
import { getDeps, getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import { MainMenuFactory } from '../menus/main-menu.factory.js';

export async function startCommand(ctx: Context): Promise<void> {
  const log = getLogger().child({ command: 'start' });
  const i18n = getI18n();

  const telegramUser = ctx.from;
  if (!telegramUser) {
    log.warn({ msg: 'start_command_no_user' });
    await ctx.reply(i18n.t('user-management.errors.no_user'));
    return;
  }

  const telegramId = telegramUser.id.toString();
  log.info({ msg: 'start_command', telegramId });

  const userResult = await getUserService().getByTelegramId(telegramId);

  if (userResult.isErr()) {
    log.warn({ msg: 'start_user_not_found', telegramId, errorCode: userResult.error.code });
    await ctx.reply(i18n.t('user-management.errors.register_first'));
    return;
  }

  const user = userResult.value;
  const keyboard = MainMenuFactory.create(user);

  const displayName = user.username ?? telegramUser.first_name;

  await ctx.reply(
    i18n.t('user-management.menu.welcome', {
      name: displayName,
      role: i18n.t(`user-management.role.${user.role}`),
      language: i18n.t(`user-management.language.${user.language}`),
    }),
    { parse_mode: 'HTML', reply_markup: keyboard },
  );

  log.info({ msg: 'start_command_ok', userId: user.id });

  // نشر event للـ session warming
  await getDeps().eventBus.publish('user-management.user.started', {
    userId: user.id,
    telegramId,
    role: user.role,
  });
}
