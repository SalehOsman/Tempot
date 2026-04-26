/**
 * UserStateService — إدارة حالة المستخدم الانتقالية (pending input)
 *
 * الحالات المدعومة:
 *   edit_name | edit_email | edit_language | edit_role
 *   edit_national_id | edit_mobile | edit_birth_date | edit_gender | edit_governorate | edit_country_code
 */

import { getDeps } from '../deps.context.js';

export type UserInputAction =
  | 'edit_name'
  | 'edit_email'
  | 'edit_language'
  | 'edit_role'
  | 'edit_national_id'
  | 'edit_mobile'
  | 'edit_birth_date'
  | 'edit_gender'
  | 'edit_governorate'
  | 'edit_country_code';

const STATE_TTL_MS = 5 * 60 * 1000;

export interface PendingInputState {
  action: UserInputAction;
  timestamp: number;
}

export async function setUserInputState(
  telegramId: string,
  chatId: string,
  action: UserInputAction,
): Promise<void> {
  const deps = getDeps();
  const sessionResult = await deps.sessionProvider.getSession(telegramId, chatId);

  if (sessionResult && typeof sessionResult === 'object' && 'isOk' in sessionResult) {
    const result = sessionResult as { isOk: () => boolean; value: { metadata: Record<string, unknown> | null; [k: string]: unknown } };
    if (result.isOk()) {
      const session = result.value;
      const state: PendingInputState = { action, timestamp: Date.now() };
      const metadata: Record<string, unknown> = {
        ...(session.metadata ?? {}),
        pendingInputState: state,
      };
      await deps.eventBus.publish('user-management.state.set', {
        telegramId,
        chatId,
        state,
        metadata,
      });
      return;
    }
  }

  localFallbackStore.set(telegramId, { action, timestamp: Date.now() });
}

export async function getUserInputState(
  telegramId: string,
  chatId: string,
): Promise<PendingInputState | null> {
  const deps = getDeps();
  const sessionResult = await deps.sessionProvider.getSession(telegramId, chatId);

  if (sessionResult && typeof sessionResult === 'object' && 'isOk' in sessionResult) {
    const result = sessionResult as { isOk: () => boolean; value: { metadata: Record<string, unknown> | null } };
    if (result.isOk()) {
      const meta = result.value.metadata;
      if (meta && typeof meta['pendingInputState'] === 'object' && meta['pendingInputState']) {
        const state = meta['pendingInputState'] as PendingInputState;
        if (Date.now() - state.timestamp <= STATE_TTL_MS) return state;
        await clearUserInputState(telegramId, chatId);
        return null;
      }
    }
  }

  const fallback = localFallbackStore.get(telegramId);
  if (fallback) {
    if (Date.now() - fallback.timestamp <= STATE_TTL_MS) return fallback;
    localFallbackStore.delete(telegramId);
  }
  return null;
}

export async function clearUserInputState(telegramId: string, chatId: string): Promise<void> {
  const deps = getDeps();
  localFallbackStore.delete(telegramId);
  await deps.eventBus.publish('user-management.state.clear', { telegramId, chatId });
}

const localFallbackStore = new Map<string, PendingInputState>();
