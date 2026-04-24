import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { ACTION_CALLBACKS } from './action-buttons.builder.js';
import { extractCallbackData } from '../utils/callback-data.helper.js';

/** Detect cancel signal from user response */
export function isCancelSignal(response: unknown): boolean {
  const data = extractCallbackData(response);
  if (data?.includes(ACTION_CALLBACKS.CANCEL)) return true;
  if (response !== null && response !== undefined) {
    const msg = response as Record<string, unknown>;
    if (typeof msg['text'] === 'string' && msg['text'].trim().toLowerCase() === '/cancel') {
      return true;
    }
  }
  return false;
}

/** Detect keep-current signal from user response */
export function isKeepCurrentSignal(response: unknown): boolean {
  const data = extractCallbackData(response);
  return data?.includes(ACTION_CALLBACKS.KEEP_CURRENT) === true;
}

/** Detect back navigation signal from user response */
export function isBackSignal(response: unknown): boolean {
  const data = extractCallbackData(response);
  return data?.includes(ACTION_CALLBACKS.BACK) === true;
}

/** Check for cancel signal and return cancel error if detected */
export function checkCancelSignal(
  response: unknown,
  allowCancel: boolean,
  fieldName: string,
): AppError | undefined {
  if (!allowCancel || !isCancelSignal(response)) return undefined;
  return new AppError(INPUT_ENGINE_ERRORS.FORM_CANCELLED, {
    reason: 'user_cancel',
    fieldName,
  });
}
