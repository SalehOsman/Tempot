import type { Context } from 'grammy';
import { sessionContext } from '@tempot/shared';
import { getDeps } from '../deps.context.js';
import type { ModuleSessionRecord } from '../types/module-deps.types.js';

export async function syncSessionLanguage(ctx: Context, lang: string): Promise<void> {
  const telegramId = ctx.from?.id.toString();
  if (telegramId === undefined) return;

  const chatId = ctx.chat?.id.toString() ?? telegramId;
  const sessionProvider = getDeps().sessionProvider;
  if (sessionProvider.saveSession === undefined) return;

  const session = sessionFromProviderResult(await sessionProvider.getSession(telegramId, chatId));
  if (session === null) return;

  await sessionProvider.saveSession({ ...session, language: lang });
}

export async function runWithProfileLanguage<T>(
  lang: string,
  operation: () => Promise<T>,
): Promise<T> {
  return sessionContext.run({ ...sessionContext.getStore(), locale: lang }, operation);
}

function sessionFromProviderResult(value: unknown): ModuleSessionRecord | null {
  if (!isRecord(value)) return null;
  if ('isOk' in value && typeof value.isOk === 'function') {
    return value.isOk() && isSessionRecord(value['value']) ? value['value'] : null;
  }
  return isSessionRecord(value) ? value : null;
}

function isSessionRecord(value: unknown): value is ModuleSessionRecord {
  return (
    isRecord(value) && typeof value['userId'] === 'string' && typeof value['chatId'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
