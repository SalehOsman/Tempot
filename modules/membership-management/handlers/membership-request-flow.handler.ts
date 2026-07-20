import { InlineKeyboard, type Context, type NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import type { MembershipRequestDraft } from '../services/membership-request-draft.store.js';

export const MEMBERSHIP_REASON_SKIP_CALLBACK = 'membership:request:reason:skip';

const noopNext: NextFunction = () => Promise.resolve();
const MOBILE_PATTERN = /^\+?[0-9][0-9 -]{6,18}[0-9]$/u;

export async function startMembershipRequestFlow(ctx: Context): Promise<void> {
  const { i18n, requestDrafts } = getDeps();
  const telegramUser = ctx.from;
  if (telegramUser === undefined) {
    await ctx.reply(i18n.t('membership-management.request.identity_missing'));
    return;
  }

  requestDrafts.start({
    telegramId: String(telegramUser.id),
    telegramUsername: telegramUser.username,
    telegramFirstName: telegramUser.first_name,
    telegramLastName: telegramUser.last_name,
    telegramLanguageCode: telegramUser.language_code,
  });
  await sendPrompt(ctx, 'membership-management.request.prompt.full_name');
}

export async function handleMembershipText(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const telegramId = resolveTelegramId(ctx);
  if (telegramId === null) {
    await next();
    return;
  }
  const draft = getDeps().requestDrafts.get(telegramId);
  if (draft === null) {
    await next();
    return;
  }

  const text = ctx.message?.text?.trim() ?? '';
  if (text === '') {
    await ctx.reply(getDeps().i18n.t('membership-management.request.validation.required'));
    return;
  }
  await continueDraft(ctx, draft, text);
}

export async function skipMembershipRequestReason(ctx: Context): Promise<void> {
  const telegramId = resolveTelegramId(ctx);
  if (telegramId === null) return replyIdentityMissing(ctx);
  const draft = getDeps().requestDrafts.get(telegramId);
  if (draft === null || draft.step !== 'requestMessage') {
    await ctx.reply(getDeps().i18n.t('membership-management.request.failed'));
    return;
  }
  await submitDraft(ctx, draft);
}

async function continueDraft(ctx: Context, draft: MembershipRequestDraft, text: string) {
  if (draft.step === 'fullName') return saveFullName(ctx, draft, text);
  if (draft.step === 'nickname') return saveNickname(ctx, draft, text);
  if (draft.step === 'mobileNumber') return saveMobileNumber(ctx, draft, text);
  await submitDraft(ctx, draft, text);
}

async function saveFullName(ctx: Context, draft: MembershipRequestDraft, text: string) {
  getDeps().requestDrafts.save({ ...draft, fullName: text, step: 'nickname' });
  await ctx.reply(getDeps().i18n.t('membership-management.request.prompt.nickname'));
}

async function saveNickname(ctx: Context, draft: MembershipRequestDraft, text: string) {
  getDeps().requestDrafts.save({ ...draft, nickname: text, step: 'mobileNumber' });
  await ctx.reply(getDeps().i18n.t('membership-management.request.prompt.mobile_number'));
}

async function saveMobileNumber(ctx: Context, draft: MembershipRequestDraft, text: string) {
  if (!MOBILE_PATTERN.test(text)) {
    await ctx.reply(getDeps().i18n.t('membership-management.request.validation.mobile_number'));
    return;
  }
  getDeps().requestDrafts.save({ ...draft, mobileNumber: text, step: 'requestMessage' });
  await ctx.reply(getDeps().i18n.t('membership-management.request.prompt.reason'), {
    reply_markup: createSkipReasonKeyboard(),
  });
}

async function submitDraft(
  ctx: Context,
  draft: MembershipRequestDraft,
  requestMessage?: string,
): Promise<void> {
  const { adminNotifier, i18n, membershipRequests, requestDrafts } = getDeps();
  const result = await membershipRequests.submit({
    telegramId: draft.telegramId,
    fullName: draft.fullName,
    nickname: draft.nickname,
    mobileNumber: draft.mobileNumber,
    telegramUsername: draft.telegramUsername,
    telegramFirstName: draft.telegramFirstName,
    telegramLastName: draft.telegramLastName,
    telegramLanguageCode: draft.telegramLanguageCode,
    requestMessage,
  });
  if (result.isErr()) {
    await ctx.reply(i18n.t('membership-management.request.failed'));
    return;
  }
  requestDrafts.clear(draft.telegramId);
  await adminNotifier.notifySubmitted(result.value);
  await ctx.reply(i18n.t('membership-management.request.submitted'), { parse_mode: 'HTML' });
}

function createSkipReasonKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(
    getDeps().i18n.t('membership-management.request.skip_reason_button'),
    MEMBERSHIP_REASON_SKIP_CALLBACK,
  );
}

async function sendPrompt(ctx: Context, key: string): Promise<void> {
  const text = getDeps().i18n.t(key);
  if (ctx.callbackQuery !== undefined) {
    await ctx.editMessageText(text, { parse_mode: 'HTML' });
    return;
  }
  await ctx.reply(text, { parse_mode: 'HTML' });
}

function resolveTelegramId(ctx: Context): string | null {
  return ctx.from?.id === undefined ? null : String(ctx.from.id);
}

async function replyIdentityMissing(ctx: Context): Promise<void> {
  await ctx.reply(getDeps().i18n.t('membership-management.request.identity_missing'));
}
