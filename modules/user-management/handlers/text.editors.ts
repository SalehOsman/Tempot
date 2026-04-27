import type { Context } from 'grammy';
import { RoleEnum } from '@tempot/auth-core';
import { getI18n, getLogger } from '../deps.context.js';
import { getUserService } from '../services/user-service.context.js';
import type { UserProfile } from '../types/index.js';

export async function replyUpdated(ctx: Context, fieldKey: string, value: string): Promise<void> {
  const i18n = getI18n();
  await ctx.reply(
    i18n.t('user-management.profile.updated', {
      field: i18n.t(`user-management.profile.field.${fieldKey}`),
      value,
    }),
    { parse_mode: 'HTML' },
  );
}

export async function replyError(
  ctx: Context,
  msg: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-editors' });
  log.error({ msg, ...extra });
  await ctx.reply(i18n.t('user-management.profile.update_error'));
}

export async function handleEditName(ctx: Context, user: UserProfile, text: string): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-editors' });
  if (text.length === 0) {
    await ctx.reply(i18n.t('user-management.validation.name.required'));
    return;
  }
  if (text.length > 50) {
    await ctx.reply(i18n.t('user-management.validation.name.too_long'));
    return;
  }

  const result = await getUserService().updateUsername(user.id, text);
  if (result.isErr()) {
    await replyError(ctx, 'edit_name_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'name_updated', userId: user.id });
  await replyUpdated(ctx, 'name', text);
}

export async function handleEditEmail(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-editors' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    await ctx.reply(i18n.t('user-management.validation.email.invalid'));
    return;
  }
  if (text.length > 255) {
    await ctx.reply(i18n.t('user-management.validation.email.too_long'));
    return;
  }

  const result = await getUserService().updateEmail(user.id, text);
  if (result.isErr()) {
    await replyError(ctx, 'edit_email_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'email_updated', userId: user.id });
  await replyUpdated(ctx, 'email', text);
}

export async function handleEditLanguage(
  ctx: Context,
  user: UserProfile,
  text: string,
): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-editors' });
  const VALID = ['ar', 'en'] as const;
  const lang = text.toLowerCase();
  if (!VALID.includes(lang as (typeof VALID)[number])) {
    await ctx.reply(
      i18n.t('user-management.validation.language.invalid', { valid: VALID.join(', ') }),
    );
    return;
  }

  const result = await getUserService().updateLanguage(user.id, lang);
  if (result.isErr()) {
    await replyError(ctx, 'edit_language_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'language_updated', userId: user.id });
  await replyUpdated(ctx, 'language', i18n.t(`user-management.language.${lang}`));
}

export async function handleEditRole(ctx: Context, user: UserProfile, text: string): Promise<void> {
  const i18n = getI18n();
  const log = getLogger().child({ handler: 'text-editors' });
  const VALID: RoleEnum[] = [RoleEnum.USER, RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN];
  const role = text.toUpperCase() as RoleEnum;
  if (!VALID.includes(role)) {
    await ctx.reply(i18n.t('user-management.validation.role.invalid', { valid: VALID.join(', ') }));
    return;
  }

  const result = await getUserService().updateRole(user.id, role);
  if (result.isErr()) {
    await replyError(ctx, 'edit_role_failed', { userId: user.id });
    return;
  }

  log.info({ msg: 'role_updated', userId: user.id });
  await replyUpdated(ctx, 'role', i18n.t(`user-management.role.${role}`));
}
