import type { Context } from 'grammy';
import { getDeps } from '../deps.context.js';

export async function requestMembershipCommand(ctx: Context): Promise<void> {
  const { i18n, membershipRequests } = getDeps();
  const telegramUser = ctx.from;
  if (telegramUser === undefined) {
    await ctx.reply(i18n.t('membership-management.request.identity_missing'));
    return;
  }

  const result = await membershipRequests.submit({
    telegramId: String(telegramUser.id),
    telegramUsername: telegramUser.username,
    telegramFirstName: telegramUser.first_name,
    telegramLastName: telegramUser.last_name,
    telegramLanguageCode: telegramUser.language_code,
  });

  if (result.isErr()) {
    await ctx.reply(i18n.t('membership-management.request.failed'));
    return;
  }

  await ctx.reply(i18n.t('membership-management.request.submitted'), {
    parse_mode: 'HTML',
  });
}
