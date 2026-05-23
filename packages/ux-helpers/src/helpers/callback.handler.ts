import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { logger } from '@tempot/logger';
import { getInteractionTrace, recordInteractionStep } from '@tempot/interaction-observability';
import type { AnswerCallbackOptions } from '../ux.types.js';
import { UX_ERRORS } from '../ux.errors.js';
import { uxToggle } from '../ux.toggle.js';

interface CallbackContext {
  answerCallbackQuery(options: {
    readonly text?: string;
    readonly show_alert?: boolean;
  }): Promise<unknown>;
}

async function recordCallbackAnswer(
  ctx: CallbackContext,
  status: 'succeeded' | 'skipped',
  reason?: string,
): Promise<void> {
  const trace = getInteractionTrace(ctx);
  const result = await recordInteractionStep(ctx, {
    stage: 'callback_answered',
    status,
    action: trace?.callbackData ?? trace?.command ?? 'message',
    responseType: 'answerCallbackQuery',
    reason,
  });
  if (result.isErr()) {
    logger.warn({
      code: 'ux-helpers.interaction_event_record_failed',
      stage: 'callback_answered',
      status,
      error: result.error.code,
    });
  }
}

function isTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('query is too old') || message.includes('query ID is invalid');
}

/** Answer a callback query, gracefully handling timeouts */
export async function answerCallback(
  ctx: CallbackContext,
  options?: AnswerCallbackOptions,
): AsyncResult<void, AppError> {
  const disabled = uxToggle.check();
  if (disabled) return disabled;

  try {
    await ctx.answerCallbackQuery({
      text: options?.text,
      show_alert: options?.showAlert,
    });
    await recordCallbackAnswer(ctx, 'succeeded');
    return ok(undefined);
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      await recordCallbackAnswer(ctx, 'skipped', 'callback_query_expired');
      return ok(undefined);
    }

    return err(
      new AppError(UX_ERRORS.CALLBACK_QUERY_FAILED, {
        originalError: error,
      }),
    );
  }
}
