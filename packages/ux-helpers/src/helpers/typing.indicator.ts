import { ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import { logger } from '@tempot/logger';

interface TypingContext {
  replyWithChatAction(action: string): Promise<unknown>;
}

/** Send typing indicator (best-effort, never fails) */
export async function showTyping(ctx: TypingContext): AsyncResult<void, AppError> {
  try {
    await ctx.replyWithChatAction('typing');
  } catch (error: unknown) {
    logger.warn({ error }, 'Failed to send typing indicator');
  }

  return ok(undefined);
}
