import { InlineKeyboard } from 'grammy';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { t } from '@tempot/i18n-core';
import { encodeWithExpiry } from '../callback-data/callback-data.encoder.js';
import { CONFIRMATION_EXPIRY_MINUTES } from '../ux.constants.js';
import type { ConfirmationOptions, ConfirmationResult } from '../ux.types.js';

export function createConfirmation(
  options: ConfirmationOptions,
): Result<ConfirmationResult, AppError> {
  const { actionNameKey, cancelKey, callbackPrefix, isIrreversible } = options;

  // Encode confirm callback with expiry
  const confirmResult = encodeWithExpiry([callbackPrefix, 'confirm'], CONFIRMATION_EXPIRY_MINUTES);

  if (confirmResult.isErr()) {
    return err(confirmResult.error);
  }

  const cancelData = `${callbackPrefix}:cancel`;
  const cancelText = t(cancelKey ?? 'common.buttons.cancel');
  const actionText = t(actionNameKey);

  const keyboard = new InlineKeyboard();
  // RTL ordering: Cancel FIRST (left), Confirm SECOND (right)
  keyboard.text(cancelText, cancelData);
  keyboard.text(actionText, confirmResult.value);

  const result: ConfirmationResult = {
    keyboard,
    warningText: isIrreversible ? t('common.confirmation.irreversible_warning') : undefined,
  };

  return ok(result);
}
