import { ValidationError } from '@tembot/shared-types';

export const TELEGRAM_LIMITS = {
  MAX_CALLBACK_BYTES: 36, // Budgeted within official 64B limit
  MAX_BUTTON_LABEL_LENGTH: 16,
  MAX_KEYBOARD_ROWS: 7,
  MAX_BUTTONS_PER_ROW: 3,
  MAX_MESSAGE_LENGTH: 32768,
  MAX_BLOCK_DEPTH: 16,
} as const;

export interface InlineButton {
  readonly text: string;
  readonly callbackData?: string;
  readonly url?: string;
  readonly webAppUrl?: string;
}

/**
 * Validates inline button layout and callback data budgets.
 */
export function validateButtonBudgets(rows: readonly (readonly InlineButton[])[]): void {
  if (rows.length > TELEGRAM_LIMITS.MAX_KEYBOARD_ROWS) {
    throw new ValidationError(
      `Keyboard rows (${rows.length}) exceed maximum allowable rows (${TELEGRAM_LIMITS.MAX_KEYBOARD_ROWS})`,
    );
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (row.length > TELEGRAM_LIMITS.MAX_BUTTONS_PER_ROW) {
      throw new ValidationError(
        `Row ${r + 1} has ${row.length} buttons, exceeding mobile limit of ${TELEGRAM_LIMITS.MAX_BUTTONS_PER_ROW}`,
      );
    }

    for (const btn of row) {
      if (btn.text.length > TELEGRAM_LIMITS.MAX_BUTTON_LABEL_LENGTH) {
        throw new ValidationError(
          `Button label "${btn.text}" exceeds ${TELEGRAM_LIMITS.MAX_BUTTON_LABEL_LENGTH} chars (would be truncated on mobile)`,
        );
      }

      if (btn.callbackData) {
        const bytes = new TextEncoder().encode(btn.callbackData).length;
        if (bytes > TELEGRAM_LIMITS.MAX_CALLBACK_BYTES) {
          throw new ValidationError(
            `Callback data "${btn.callbackData}" is ${bytes} bytes, exceeding budgeted limit of ${TELEGRAM_LIMITS.MAX_CALLBACK_BYTES} bytes`,
          );
        }
      }
    }
  }
}
