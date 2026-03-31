import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { FeedbackOptions } from '../ux.types.js';
import { sendLoading, sendSuccess, sendError } from '../messages/status.sender.js';

type EditableContext = Parameters<typeof sendLoading>[0];

/** Orchestrate the loading-action-result feedback flow */
export async function executeFeedback<T>(
  ctx: EditableContext,
  options: FeedbackOptions<T>,
): AsyncResult<T, AppError> {
  await sendLoading(ctx, { key: options.loadingKey });

  const result = await options.action();

  if (result.isOk()) {
    await sendSuccess(ctx, {
      key: options.successKey,
      keyboard: options.keyboard,
    });
  } else {
    await sendError(ctx, {
      key: `errors.${result.error.code}`,
    });
  }

  return result;
}
