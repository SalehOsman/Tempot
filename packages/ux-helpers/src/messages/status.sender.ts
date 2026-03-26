import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { StatusSendOptions } from '../types.js';
import { formatLoading, formatSuccess, formatError, formatWarning } from './status.formatter.js';
import { editOrSend } from '../helpers/golden-rule.fallback.js';

type EditableContext = Parameters<typeof editOrSend>[0];

/** Send a loading status message via editOrSend */
export async function sendLoading(
  ctx: EditableContext,
  options: StatusSendOptions,
): AsyncResult<void, AppError> {
  const text = formatLoading({
    key: options.key,
    interpolation: options.interpolation,
  });
  return editOrSend(ctx, { text, replyMarkup: options.keyboard });
}

/** Send a success status message via editOrSend */
export async function sendSuccess(
  ctx: EditableContext,
  options: StatusSendOptions,
): AsyncResult<void, AppError> {
  const text = formatSuccess({
    key: options.key,
    interpolation: options.interpolation,
  });
  return editOrSend(ctx, { text, replyMarkup: options.keyboard });
}

/** Send an error status message via editOrSend */
export async function sendError(
  ctx: EditableContext,
  options: StatusSendOptions,
): AsyncResult<void, AppError> {
  const text = formatError({
    key: options.key,
    interpolation: options.interpolation,
  });
  return editOrSend(ctx, { text, replyMarkup: options.keyboard });
}

/** Send a warning status message via editOrSend */
export async function sendWarning(
  ctx: EditableContext,
  options: StatusSendOptions,
): AsyncResult<void, AppError> {
  const text = formatWarning({
    key: options.key,
    interpolation: options.interpolation,
  });
  return editOrSend(ctx, { text, replyMarkup: options.keyboard });
}
