import { Keyboard } from 'grammy';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { validateLabel, detectLanguage, getCharLimit } from './label.validator.js';
import { ROW_LIMITS } from '../constants.js';

export interface TempotReplyKeyboard {
  button(label: string): Result<TempotReplyKeyboard, AppError>;
  row(): TempotReplyKeyboard;
  oneTime(): TempotReplyKeyboard;
  resized(): TempotReplyKeyboard;
  build(): Result<Keyboard, AppError>;
  toGrammyKeyboard(): Keyboard;
}

function isAlphabetic(code: number): boolean {
  return (
    (code >= 0x0041 && code <= 0x005a) ||
    (code >= 0x0061 && code <= 0x007a) ||
    (code >= 0x0600 && code <= 0x06ff) ||
    (code >= 0x0750 && code <= 0x077f) ||
    (code >= 0x08a0 && code <= 0x08ff)
  );
}

function stripLeadingEmoji(text: string): string {
  let i = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) break;
    if (isAlphabetic(code)) break;
    i += char.length;
  }
  return text.slice(i).trim();
}

function isLongLabel(label: string): boolean {
  const language = detectLanguage(label);
  const limit = getCharLimit('reply', language);
  const stripped = stripLeadingEmoji(label);
  return stripped.length > limit / 2;
}

export function createReplyKeyboard(): TempotReplyKeyboard {
  const keyboard = new Keyboard();
  let currentRowLength = 0;

  const wrapper: TempotReplyKeyboard = {
    button(label: string): Result<TempotReplyKeyboard, AppError> {
      const labelResult = validateLabel(label, 'reply');
      if (labelResult.isErr()) return err(labelResult.error);

      const isLong = isLongLabel(label);

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
