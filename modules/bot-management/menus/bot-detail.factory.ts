import type { ManagedBot } from '../types/bot.types.js';
import type { BotListResult } from '../services/bot.service.js';

export function formatBotListMessage(
  t: (key: string, options?: Record<string, unknown>) => string,
  result: BotListResult,
): string {
  if (result.totalCount === 0) return t('bot-management.menu.empty');

  const rows = result.bots.map((bot, index) =>
    t('bot-management.menu.row', {
      index: index + 1 + result.page * result.pageSize,
      name: bot.displayName,
      username: bot.telegramUsername,
      status: t(`bot-management.status.${bot.status}`),
    }),
  );

  return [t('bot-management.menu.list_title', { count: result.totalCount }), ...rows].join('\n');
}

export function formatBotDetailMessage(
  t: (key: string, options?: Record<string, unknown>) => string,
  bot: ManagedBot,
): string {
  return t('bot-management.detail.view', {
    name: bot.displayName,
    username: bot.telegramUsername,
    status: t(`bot-management.status.${bot.status}`),
    runtimeMode: bot.runtimeMode,
    ownerId: bot.ownerId,
    locale: bot.defaultLocale,
    country: bot.defaultCountry,
    timezone: bot.timezone,
    health: t(`bot-management.health.${bot.healthStatus}`),
    credential: bot.tokenRedacted,
  });
}
