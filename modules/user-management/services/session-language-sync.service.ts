import type { Context } from 'grammy';
import { sessionContext } from '@tempot/shared';
import { getDeps } from '../deps.context.js';
import type { ModuleSessionProvider, ModuleSessionRecord } from '../types/module-deps.types.js';
import type { UserProfile } from '../types/index.js';

const CURRENT_SESSION_SCHEMA_VERSION = 1;

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

export async function syncProfileSession(ctx: Context, user: UserProfile): Promise<void> {
  const telegramId = ctx.from?.id.toString() ?? user.telegramId;
  const chatId = ctx.chat?.id.toString() ?? telegramId;

  await saveProfileSession({
    sessionProvider: getDeps().sessionProvider,
    user,
    chatId,
  });
}

export async function saveProfileSession(input: {
  readonly sessionProvider: ModuleSessionProvider;
  readonly user: Pick<UserProfile, 'telegramId' | 'role' | 'language'>;
  readonly chatId?: string;
}): Promise<void> {
  const { sessionProvider, user } = input;
  if (sessionProvider.saveSession === undefined) return;

  const chatId = input.chatId ?? user.telegramId;
  const existing = sessionFromProviderResult(
    await sessionProvider.getSession(user.telegramId, chatId),
  );
  const now = new Date();
  const session: ModuleSessionRecord =
    existing ??
    ({
      userId: user.telegramId,
      chatId,
      activeConversation: null,
      metadata: null,
      schemaVersion: CURRENT_SESSION_SCHEMA_VERSION,
      version: 0,
      createdAt: now,
      updatedAt: now,
    } as ModuleSessionRecord);

  await sessionProvider.saveSession({
    ...session,
    userId: user.telegramId,
    chatId,
    role: user.role,
    status: 'ACTIVE',
    language: user.language,
  });
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
    isRecord(value) &&
    typeof value['userId'] === 'string' &&
    typeof value['chatId'] === 'string' &&
    typeof value['role'] === 'string' &&
    typeof value['status'] === 'string' &&
    typeof value['language'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
