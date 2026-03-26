import { InlineKeyboard } from 'grammy';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { validateLabel, detectLanguage, getCharLimit } from './label.validator.js';
import { encodeCallbackData } from '../callback-data/callback-data.encoder.js';
import { ROW_LIMITS } from '../constants.js';
import type { InlineButtonConfig } from '../types.js';

export interface TempotInlineKeyboard {
  button(config: InlineButtonConfig): Result<TempotInlineKeyboard, AppError>;
  row(): TempotInlineKeyboard;
  build(): Result<InlineKeyboard, AppError>;
  toGrammyKeyboard(): InlineKeyboard;
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
  const limit = getCharLimit('inline', language);
  const stripped = stripLeadingEmoji(label);
  return stripped.length > limit / 2;
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

      const isLong = isLongLabel(config.label);

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
