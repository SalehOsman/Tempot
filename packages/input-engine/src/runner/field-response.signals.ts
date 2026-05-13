import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { ACTION_CALLBACKS } from './action-buttons.builder.js';
import { extractCallbackData } from '../utils/callback-data.helper.js';
import { extractMessageText } from '../utils/message-text.helper.js';
import type { FieldContext } from './field.processor.js';

function isCancelSignal(response: unknown): boolean {
  const data = extractCallbackData(response);
  if (data?.includes(ACTION_CALLBACKS.CANCEL)) return true;
  return extractMessageText(response)?.trim().toLowerCase() === '/cancel';
}

export function isKeepCurrentSignal(response: unknown): boolean {
  const data = extractCallbackData(response);
  return data?.includes(ACTION_CALLBACKS.KEEP_CURRENT) === true;
}

export function isBackSignal(response: unknown): boolean {
  const data = extractCallbackData(response);
  return data?.includes(ACTION_CALLBACKS.BACK) === true;
}

export function checkCancelSignal(response: unknown, ctx: FieldContext): AppError | undefined {
  if (!ctx.allowCancel || !isCancelSignal(response)) return undefined;
  return new AppError(INPUT_ENGINE_ERRORS.FORM_CANCELLED, {
    reason: 'user_cancel',
    fieldName: ctx.fieldName,
  });
}
