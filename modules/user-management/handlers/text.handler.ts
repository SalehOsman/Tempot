import type { Context } from 'grammy';
import { getDeps, getI18n, getLogger } from '../deps.context.js';
import type { UserProfile } from '../types/index.js';
import type { ModuleAuthorizationPolicy } from '../types/module-deps.types.js';
import { getUserService } from '../services/user-service.context.js';
import {
  getUserInputState,
  clearUserInputState,
  type PendingInputState,
} from './user-state.service.js';
import {
  handleEditName,
  handleEditEmail,
  handleEditLanguage,
  handleEditRole,
} from './text.editors.js';
import {
  handleEditNationalId,
  handleEditMobile,
  handleEditBirthDate,
  handleEditGender,
  handleEditGovernorate,
  handleEditCountryCode,
} from './text-egyptian.editors.js';

interface DispatchPayload {
  action: string;
  text: string;
}

async function dispatchTextAction(
  ctx: Context,
  user: UserProfile,
  payload: DispatchPayload,
): Promise<boolean> {
  const { action, text } = payload;
  switch (action) {
    case 'edit_name':
      return handleEditName(ctx, user, text);
    case 'edit_email':
      return handleEditEmail(ctx, user, text);
    case 'edit_language':
      return handleEditLanguage(ctx, user, text);
    case 'edit_role':
      return handleEditRole(ctx, user, text);
    case 'edit_national_id':
      return handleEditNationalId(ctx, user, text);
    case 'edit_mobile':
      return handleEditMobile(ctx, user, text);
    case 'edit_birth_date':
      return handleEditBirthDate(ctx, user, text);
    case 'edit_gender':
      return handleEditGender(ctx, user, text);
    case 'edit_governorate':
      return handleEditGovernorate(ctx, user, text);
    case 'edit_country_code':
      return handleEditCountryCode(ctx, user, text);
  }
  return false;
}

export async function handleTextInput(ctx: Context): Promise<void> {
  const log = getLogger().child({ handler: 'text' });
  const i18n = getI18n();

  const message = ctx.message;
  if (!message?.text) return;
  if (message.text.startsWith('/')) return;

  const text = message.text.trim();
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const telegramId = telegramUser.id.toString();
  const chatId = ctx.chat?.id.toString() ?? telegramId;

  const state = await getUserInputState(telegramId, chatId);
  if (!state) return;
  const policy = resolveAuthorizationPolicy(state);
  if (!(await getDeps().authorization.enforce(ctx, policy))) return;

  const userResult = await getUserService().getByTelegramId(telegramId);
  if (userResult.isErr()) {
    log.warn({ msg: 'text_handler_user_not_found', telegramId });
    await ctx.reply(i18n.t('user-management.profile.not_found'));
    return;
  }

  const editableUser = await resolveEditableUser(ctx, userResult.value, state);
  if (!editableUser) return;

  const updated = await dispatchTextAction(ctx, editableUser, { action: state.action, text });
  if (updated) await publishAdminUpdateEvent(userResult.value, state);
  await clearUserInputState(telegramId, chatId);
}

async function publishAdminUpdateEvent(
  actor: UserProfile,
  state: PendingInputState,
): Promise<void> {
  if (!state.targetUserId) return;
  await getDeps().eventBus.publish('user-management.user.admin_updated', {
    actorUserId: actor.id,
    targetUserId: state.targetUserId,
    action: state.action,
    status: 'success',
  });
}

async function resolveEditableUser(
  ctx: Context,
  actor: UserProfile,
  state: PendingInputState,
): Promise<UserProfile | null> {
  if (!state.targetUserId) return actor;
  const targetResult = await getUserService().getById(state.targetUserId);
  if (targetResult.isErr()) {
    await ctx.reply(getI18n().t('user-management.profile.not_found'));
    return null;
  }
  return targetResult.value;
}

function resolveAuthorizationPolicy(state: PendingInputState): ModuleAuthorizationPolicy {
  if (state.action === 'edit_role') {
    return {
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'roles',
    };
  }
  if (state.targetUserId) {
    return {
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'users',
    };
  }
  return {
    module: 'user-management',
    classification: 'protected',
    action: 'update',
    subject: 'profile',
  };
}
