/**
 * /profile command — عرض الملف الشخصي الكامل للمستخدم
 */

import type { Context } from 'grammy';
import { getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import { ProfileMenuFactory } from '../menus/profile-menu.factory.js';
import type { UserProfile } from '../types/index.js';

function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function needsLazyExtraction(user: UserProfile): boolean {
  if (!user.nationalId) return false;
  const isEgyptian = !user.countryCode || user.countryCode === '+20';
  if (!isEgyptian) return false;
  return !user.birthDate || !user.gender || !user.governorate;
}

function buildProfileMessage(user: UserProfile, i18n: ReturnType<typeof getI18n>): string {
  const undef = i18n.t('user-management.common.undefined');

  const birthDate = user.birthDate ? new Date(user.birthDate).toLocaleDateString('ar-EG') : undef;

  const age = user.birthDate
    ? i18n.t('user-management.profile.age_value', { age: calculateAge(new Date(user.birthDate)) })
    : undef;

  const gender = user.gender ? i18n.t(`user-management.gender.${user.gender}`) : undef;

  return i18n.t('user-management.profile.view_message', {
    username: user.username ?? undef,
    email: user.email ?? undef,
    language: i18n.t(`user-management.language.${user.language}`),
    role: i18n.t(`user-management.role.${user.role}`),
    createdAt: new Date(user.createdAt).toLocaleDateString('ar-EG'),
    nationalId: user.nationalId ?? undef,
    mobile: user.mobileNumber ?? undef,
    birthDate,
    age,
    gender,
    governorate: user.governorate ?? undef,
    countryCode: user.countryCode ?? undef,
  });
}

export async function profileCommand(ctx: Context): Promise<void> {
  const log = getLogger().child({ command: 'profile' });
  const i18n = getI18n();

  const telegramUser = ctx.from;
  if (!telegramUser) {
    log.warn({ msg: 'profile_command_no_user' });
    await ctx.reply(i18n.t('user-management.errors.no_user'));
    return;
  }

  const telegramId = telegramUser.id.toString();
  log.info({ msg: 'profile_command', telegramId });

  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) {
    log.warn({ msg: 'profile_not_found', telegramId, errorCode: userResult.error.code });
    await ctx.reply(i18n.t('user-management.profile.not_found'));
    return;
  }

  let user = userResult.value;

  // Lazy extraction: إذا الرقم القومي موجود لكن البيانات ناقصة + مصري → استخرج واحفظ
  if (needsLazyExtraction(user)) {
    log.info({ msg: 'lazy_extraction_triggered', userId: user.id });
    const extractResult = await getUserService().extractFromExistingNationalId(
      user.id,
      user.nationalId!,
    );
    if (extractResult.isOk() && extractResult.value) {
      // أعد تحميل البيانات بعد الاستخراج
      const refreshed = await getUserService().getByTelegramId(telegramId);
      if (refreshed.isOk()) user = refreshed.value;
    }
  }

  log.info({ msg: 'profile_command_ok', userId: user.id });

  await ctx.reply(buildProfileMessage(user, i18n), {
    parse_mode: 'HTML',
    reply_markup: ProfileMenuFactory.createView(user),
  });
}

export { buildProfileMessage };
