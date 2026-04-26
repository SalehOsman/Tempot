/**
 * Text Input Handler — يعالج الـ input النصي من المستخدم
 *
 * الحقول المدعومة:
 *   name | email | language | role
 *   national_id | mobile | birth_date | gender | governorate | country_code
 */

import type { Context } from 'grammy';
import { RoleEnum } from '@tempot/auth-core';
import { getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import { getUserInputState, clearUserInputState } from './user-state.service.js';
import type { UserProfile } from '../types/index.js';

export async function handleTextInput(ctx: Context): Promise<void> {
  const log = getLogger().child({ handler: 'text' });
  const i18n = getI18n();

  const message = ctx.message;
  if (!message?.text) return;

  // تجاهل الأوامر
  if (message.text.startsWith('/')) return;

  const text = message.text.trim();
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const telegramId = telegramUser.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;

  const state = await getUserInputState(telegramId, chatId);

  if (!state) return; // لا توجد حالة انتظار — تجاهل بصمت

  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) {
    log.warn({ msg: 'text_handler_user_not_found', telegramId });
    await ctx.reply(i18n.t('user-management.profile.not_found'));
    return;
  }

  const user = userResult.value;

  switch (state.action) {
    case 'edit_name':        await handleEditName(ctx, user, text, i18n, log);        break;
    case 'edit_email':       await handleEditEmail(ctx, user, text, i18n, log);       break;
    case 'edit_language':    await handleEditLanguage(ctx, user, text, i18n, log);    break;
    case 'edit_role':        await handleEditRole(ctx, user, text, i18n, log);        break;
    case 'edit_national_id': await handleEditNationalId(ctx, user, text, i18n, log); break;
    case 'edit_mobile':      await handleEditMobile(ctx, user, text, i18n, log);      break;
    case 'edit_birth_date':  await handleEditBirthDate(ctx, user, text, i18n, log);  break;
    case 'edit_gender':      await handleEditGender(ctx, user, text, i18n, log);      break;
    case 'edit_governorate': await handleEditGovernorate(ctx, user, text, i18n, log);break;
    case 'edit_country_code':await handleEditCountryCode(ctx, user, text, i18n, log);break;
  }

  await clearUserInputState(telegramId, chatId);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Logger = ReturnType<ReturnType<typeof getLogger>['child']>;
type I18n = ReturnType<typeof getI18n>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function replyUpdated(
  ctx: Context,
  i18n: I18n,
  fieldKey: string,
  value: string,
): Promise<void> {
  await ctx.reply(
    i18n.t('user-management.profile.updated', {
      field: i18n.t(`user-management.profile.field.${fieldKey}`),
      value,
    }),
    { parse_mode: 'HTML' },
  );
}

async function replyError(
  ctx: Context,
  i18n: I18n,
  log: Logger,
  msg: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  log.error({ msg, ...extra });
  await ctx.reply(i18n.t('user-management.profile.update_error'));
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleEditName(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  if (text.length === 0) { await ctx.reply(i18n.t('user-management.validation.name.required')); return; }
  if (text.length > 50)  { await ctx.reply(i18n.t('user-management.validation.name.too_long')); return; }

  const result = await getUserService().updateUsername(user.id, text);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_name_failed', { userId: user.id }); return; }

  log.info({ msg: 'name_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'name', text);
}

async function handleEditEmail(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) { await ctx.reply(i18n.t('user-management.validation.email.invalid')); return; }
  if (text.length > 255) { await ctx.reply(i18n.t('user-management.validation.email.too_long')); return; }

  const result = await getUserService().updateEmail(user.id, text);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_email_failed', { userId: user.id }); return; }

  log.info({ msg: 'email_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'email', text);
}

async function handleEditLanguage(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  const VALID = ['ar', 'en'] as const;
  const lang = text.toLowerCase();
  if (!VALID.includes(lang as typeof VALID[number])) {
    await ctx.reply(i18n.t('user-management.validation.language.invalid', { valid: VALID.join(', ') }));
    return;
  }

  const result = await getUserService().updateLanguage(user.id, lang);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_language_failed', { userId: user.id }); return; }

  log.info({ msg: 'language_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'language', i18n.t(`user-management.language.${lang}`));
}

async function handleEditRole(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  const VALID: RoleEnum[] = [RoleEnum.USER, RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN];
  const role = text.toUpperCase() as RoleEnum;
  if (!VALID.includes(role)) {
    await ctx.reply(i18n.t('user-management.validation.role.invalid', { valid: VALID.join(', ') }));
    return;
  }

  const result = await getUserService().updateRole(user.id, role);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_role_failed', { userId: user.id }); return; }

  log.info({ msg: 'role_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'role', i18n.t(`user-management.role.${role}`));
}

// ─── الحقول المصرية الجديدة ──────────────────────────────────────────────────

async function handleEditNationalId(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  // رقم الهوية المصري: 14 رقم تبدأ بـ 1 أو 2 أو 3
  if (!/^[123]\d{13}$/.test(text)) {
    await ctx.reply(i18n.t('user-management.validation.national_id.invalid'));
    return;
  }

  const result = await getUserService().updateNationalId(user.id, text);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_national_id_failed', { userId: user.id }); return; }

  log.info({ msg: 'national_id_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'national_id', text);
}

async function handleEditMobile(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  // رقم جوال مصري: يبدأ بـ 01 ثم 0-2-5 ثم 8 أرقام
  const clean = text.replace(/[\s\-]/g, '');
  if (!/^(\+?20)?01[0125]\d{8}$/.test(clean)) {
    await ctx.reply(i18n.t('user-management.validation.mobile.invalid'));
    return;
  }

  const result = await getUserService().updateMobileNumber(user.id, clean);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_mobile_failed', { userId: user.id }); return; }

  log.info({ msg: 'mobile_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'mobile', clean);
}

async function handleEditBirthDate(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  // قبول صيغ: YYYY-MM-DD أو DD/MM/YYYY
  let date: Date | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    date = new Date(text);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [d, m, y] = text.split('/');
    date = new Date(`${y}-${m}-${d}`);
  }

  if (!date || isNaN(date.getTime())) {
    await ctx.reply(i18n.t('user-management.validation.birth_date.invalid'));
    return;
  }

  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();
  if (age < 10 || age > 120) {
    await ctx.reply(i18n.t('user-management.validation.birth_date.out_of_range'));
    return;
  }

  const result = await getUserService().updateBirthDate(user.id, date);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_birth_date_failed', { userId: user.id }); return; }

  log.info({ msg: 'birth_date_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'birth_date', date.toLocaleDateString('ar-EG'));
}

async function handleEditGender(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  const VALID_GENDERS = ['male', 'female', 'ذكر', 'أنثى', 'm', 'f'] as const;
  const input = text.toLowerCase().trim();

  let gender: 'male' | 'female' | null = null;
  if (['male', 'ذكر', 'm'].includes(input)) gender = 'male';
  else if (['female', 'أنثى', 'f'].includes(input)) gender = 'female';

  if (!gender) {
    await ctx.reply(i18n.t('user-management.validation.gender.invalid', { valid: VALID_GENDERS.slice(0, 4).join(' / ') }));
    return;
  }

  const result = await getUserService().updateGender(user.id, gender);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_gender_failed', { userId: user.id }); return; }

  log.info({ msg: 'gender_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'gender', i18n.t(`user-management.gender.${gender}`));
}

async function handleEditGovernorate(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  const EGYPTIAN_GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
    'دمياط', 'جنوب سيناء', 'شمال سيناء', 'سوهاج', 'قنا', 'كفر الشيخ',
    'مطروح', 'الأقصر', 'الشرقية', 'السادات',
  ];

  const input = text.trim();
  if (input.length < 2 || input.length > 50) {
    await ctx.reply(i18n.t('user-management.validation.governorate.invalid'));
    return;
  }

  const result = await getUserService().updateGovernorate(user.id, input);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_governorate_failed', { userId: user.id }); return; }

  log.info({ msg: 'governorate_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'governorate', input);

  // إرشاد للمحافظات إذا كان الإدخال غير مألوف
  if (!EGYPTIAN_GOVERNORATES.includes(input)) {
    await ctx.reply(i18n.t('user-management.validation.governorate.hint'));
  }
}

async function handleEditCountryCode(ctx: Context, user: UserProfile, text: string, i18n: I18n, log: Logger): Promise<void> {
  const clean = text.trim().startsWith('+') ? text.trim() : `+${text.trim()}`;
  if (!/^\+\d{1,4}$/.test(clean)) {
    await ctx.reply(i18n.t('user-management.validation.country_code.invalid'));
    return;
  }

  const result = await getUserService().updateCountryCode(user.id, clean);
  if (result.isErr()) { await replyError(ctx, i18n, log, 'edit_country_code_failed', { userId: user.id }); return; }

  log.info({ msg: 'country_code_updated', userId: user.id });
  await replyUpdated(ctx, i18n, 'country_code', clean);
}
