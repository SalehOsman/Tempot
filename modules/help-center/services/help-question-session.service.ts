import type { Context } from 'grammy';

const AWAITING_KEY = 'helpCenterAwaitingQuestion';

export interface HelpSessionRecord {
  readonly userId: string;
  readonly chatId: string;
  readonly role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  readonly status: 'ACTIVE' | 'BANNED' | 'PENDING';
  readonly language: string;
  readonly activeConversation: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly schemaVersion: number;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface HelpSessionProvider {
  readonly getSession: (userId: string, chatId: string) => Promise<unknown>;
  readonly saveSession?: (session: HelpSessionRecord) => Promise<unknown>;
}

export async function markAwaitingQuestion(
  ctx: Context,
  provider: HelpSessionProvider,
): Promise<void> {
  await saveQuestionState(ctx, provider, true);
}

export async function consumeAwaitingQuestion(
  ctx: Context,
  provider: HelpSessionProvider,
): Promise<boolean> {
  const session = await readSession(ctx, provider);
  if (!session || session.metadata?.[AWAITING_KEY] !== true) return false;
  await saveSession(provider, session, false);
  return true;
}

async function saveQuestionState(
  ctx: Context,
  provider: HelpSessionProvider,
  awaiting: boolean,
): Promise<void> {
  const session = await readSession(ctx, provider);
  if (!session) return;
  await saveSession(provider, session, awaiting);
}

async function readSession(
  ctx: Context,
  provider: HelpSessionProvider,
): Promise<HelpSessionRecord | null> {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (userId === undefined || chatId === undefined) return null;
  const value = await provider.getSession(String(userId), String(chatId));
  const session = readResultValue(value) ?? value;
  return isHelpSession(session) ? session : null;
}

async function saveSession(
  provider: HelpSessionProvider,
  session: HelpSessionRecord,
  awaiting: boolean,
): Promise<void> {
  if (!provider.saveSession) return;
  await provider.saveSession({
    ...session,
    metadata: { ...(session.metadata ?? {}), [AWAITING_KEY]: awaiting },
  });
}

function readResultValue(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  const isOk = value['isOk'];
  if (typeof isOk !== 'function' || isOk.call(value) !== true) return undefined;
  return value['value'];
}

function isHelpSession(value: unknown): value is HelpSessionRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value['userId'] === 'string' &&
    typeof value['chatId'] === 'string' &&
    typeof value['language'] === 'string' &&
    isRecord(value['metadata'] ?? {})
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
