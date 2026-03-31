import { InlineKeyboard } from 'grammy';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { validateLabel, isLongLabel } from './label.validator.js';
import { encodeCallbackData } from '../callback-data/callback-data.encoder.js';
import { ROW_LIMITS } from '../ux.constants.js';
import type { InlineButtonConfig } from '../ux.types.js';

export interface TempotInlineKeyboard {
  button(config: InlineButtonConfig): Result<TempotInlineKeyboard, AppError>;
  row(): TempotInlineKeyboard;
  build(): Result<InlineKeyboard, AppError>;
  toGrammyKeyboard(): InlineKeyboard;
}

/** Insert an inline button with automatic row management */
function addInlineButton(
  keyboard: InlineKeyboard,
  config: InlineButtonConfig,
  currentRowLength: number,
): number {
  const isLong = isLongLabel(config.label, 'inline');

  if (isLong && currentRowLength > 0) {
    keyboard.row();
    currentRowLength = 0;
  }

  if (currentRowLength >= ROW_LIMITS.inline) {
    keyboard.row();
    currentRowLength = 0;
  }

  keyboard.text(config.label, config.callbackData);
  currentRowLength++;

  if (isLong) {
    currentRowLength = ROW_LIMITS.inline;
  }

  return currentRowLength;
}

export function createInlineKeyboard(): TempotInlineKeyboard {
  const keyboard = new InlineKeyboard();
  let currentRowLength = 0;

  const wrapper: TempotInlineKeyboard = {
    button(config: InlineButtonConfig): Result<TempotInlineKeyboard, AppError> {
      const labelResult = validateLabel(config.label, 'inline');
      if (labelResult.isErr()) return err(labelResult.error);

      const cbResult = encodeCallbackData([config.callbackData]);
      if (cbResult.isErr()) return err(cbResult.error);

      currentRowLength = addInlineButton(keyboard, config, currentRowLength);
      return ok(wrapper);
    },

    row(): TempotInlineKeyboard {
      keyboard.row();
      currentRowLength = 0;
      return wrapper;
    },

    build(): Result<InlineKeyboard, AppError> {
      return ok(keyboard);
    },

    toGrammyKeyboard(): InlineKeyboard {
      return keyboard;
    },
  };

  return wrapper;
}
