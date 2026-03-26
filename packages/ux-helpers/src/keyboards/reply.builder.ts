import { Keyboard } from 'grammy';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { validateLabel, isLongLabel } from './label.validator.js';
import { ROW_LIMITS } from '../constants.js';

export interface TempotReplyKeyboard {
  button(label: string): Result<TempotReplyKeyboard, AppError>;
  row(): TempotReplyKeyboard;
  oneTime(): TempotReplyKeyboard;
  resized(): TempotReplyKeyboard;
  build(): Result<Keyboard, AppError>;
  toGrammyKeyboard(): Keyboard;
}

/** Insert a button with automatic row management */
function addReplyButton(keyboard: Keyboard, label: string, currentRowLength: number): number {
  const isLong = isLongLabel(label, 'reply');

  if (isLong && currentRowLength > 0) {
    keyboard.row();
    currentRowLength = 0;
  }

  if (currentRowLength >= ROW_LIMITS.reply) {
    keyboard.row();
    currentRowLength = 0;
  }

  keyboard.text(label);
  currentRowLength++;

  if (isLong) {
    currentRowLength = ROW_LIMITS.reply;
  }

  return currentRowLength;
}

export function createReplyKeyboard(): TempotReplyKeyboard {
  const keyboard = new Keyboard();
  let currentRowLength = 0;

  const wrapper: TempotReplyKeyboard = {
    button(label: string): Result<TempotReplyKeyboard, AppError> {
      const labelResult = validateLabel(label, 'reply');
      if (labelResult.isErr()) return err(labelResult.error);

      currentRowLength = addReplyButton(keyboard, label, currentRowLength);
      return ok(wrapper);
    },

    row(): TempotReplyKeyboard {
      keyboard.row();
      currentRowLength = 0;
      return wrapper;
    },

    oneTime(): TempotReplyKeyboard {
      keyboard.oneTime();
      return wrapper;
    },

    resized(): TempotReplyKeyboard {
      keyboard.resized();
      return wrapper;
    },

    build(): Result<Keyboard, AppError> {
      return ok(keyboard);
    },

    toGrammyKeyboard(): Keyboard {
      return keyboard;
    },
  };

  return wrapper;
}
