import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AnswerCallbackOptions } from '../types.js';
import { UX_ERRORS } from '../errors.js';

interface CallbackContext {
  answerCallbackQuery(options: {
    readonly text?: string;
    readonly show_alert?: boolean;
  }): Promise<unknown>;
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
  try {
    await ctx.answerCallbackQuery({
      text: options?.text,
      show_alert: options?.showAlert,
    });
    return ok(undefined);
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      return ok(undefined);
    }

    return err(
      new AppError(UX_ERRORS.CALLBACK_QUERY_FAILED, {
        originalError: error,
      }),
    );
  }
}
