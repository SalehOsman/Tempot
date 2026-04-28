import type { Context } from 'grammy';
import { getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import type { UserProfile } from '../types/index.js';
import { replyUpdated, replyError } from './text.editors.js';

const ARABIC_MALE = '\u0630\u0643\u0631';
const ARABIC_FEMALE = '\u0623\u0646\u062b\u0649';

export async function handleEditNationalId(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-egyptian-editors' });
  if (!/^[123]\d{13}$/.test(text)) {
    await ctx.reply(i18n.t('user-management.validation.national_id.invalid'));
    return;
  }

  const result = await getUserService().updateNationalId(user.id, text, user.countryCode);
  if (result.isErr()) {
    await replyError(ctx, 'edit_national_id_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'national_id_updated', userId: user.id, extracted: result.value.extracted });

  if (result.value.extracted && result.value.data) {
    const data = result.value.data;
    await ctx.reply(
      i18n.t('user-management.profile.national_id_extracted', {
        gender: i18n.t(`user-management.gender.${data.gender}`),
        birthDate: data.birthDate.toLocaleDateString('ar-EG'),
        governorate: data.governorate,
      }),
      { parse_mode: 'HTML' },
    );
  } else {
    await ctx.reply(i18n.t('user-management.profile.national_id_saved_only'), {
      parse_mode: 'HTML',
    });
  }
}

export async function handleEditMobile(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-egyptian-editors' });
  const clean = text.replace(/[\s-]/g, '');
  if (!/^(\+?20)?01[0125]\d{8}$/.test(clean)) {
    await ctx.reply(i18n.t('user-management.validation.mobile.invalid'));
    return;
  }

  const result = await getUserService().updateMobileNumber(user.id, clean);
  if (result.isErr()) {
    await replyError(ctx, 'edit_mobile_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'mobile_updated', userId: user.id });
  await replyUpdated(ctx, 'mobile', clean);
}

export async function handleEditBirthDate(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-egyptian-editors' });
  let date: Date | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    date = new Date(text);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split('/');
    date = new Date(`${year}-${month}-${day}`);
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
  if (result.isErr()) {
    await replyError(ctx, 'edit_birth_date_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'birth_date_updated', userId: user.id });
  await replyUpdated(ctx, 'birth_date', date.toLocaleDateString('ar-EG'));
}

export async function handleEditGender(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-egyptian-editors' });
  const input = text.toLowerCase().trim();

  let gender: 'male' | 'female' | null = null;
  if (['male', ARABIC_MALE, 'm'].includes(input)) gender = 'male';
  else if (['female', ARABIC_FEMALE, 'f'].includes(input)) gender = 'female';

  if (!gender) {
    await ctx.reply(i18n.t('user-management.validation.gender.invalid'));
    return;
  }

  const result = await getUserService().updateGender(user.id, gender);
  if (result.isErr()) {
    await replyError(ctx, 'edit_gender_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'gender_updated', userId: user.id });
  await replyUpdated(ctx, 'gender', i18n.t(`user-management.gender.${gender}`));
}

export async function handleEditGovernorate(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-egyptian-editors' });

  const input = text.trim();
  if (input.length < 2 || input.length > 50) {
    await ctx.reply(i18n.t('user-management.validation.governorate.invalid'));
    return;
  }

  const result = await getUserService().updateGovernorate(user.id, input);
  if (result.isErr()) {
    await replyError(ctx, 'edit_governorate_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'governorate_updated', userId: user.id });
  await replyUpdated(ctx, 'governorate', input);
}

export async function handleEditCountryCode(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-egyptian-editors' });
  const clean = text.trim().startsWith('+') ? text.trim() : `+${text.trim()}`;
  if (!/^\+\d{1,4}$/.test(clean)) {
    await ctx.reply(i18n.t('user-management.validation.country_code.invalid'));
    return;
  }

  const result = await getUserService().updateCountryCode(user.id, clean);
  if (result.isErr()) {
    await replyError(ctx, 'edit_country_code_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'country_code_updated', userId: user.id });
  await replyUpdated(ctx, 'country_code', clean);
}
