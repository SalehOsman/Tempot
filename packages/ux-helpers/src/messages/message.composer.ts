import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { t } from '@tempot/i18n-core';
import { MAX_MESSAGE_LENGTH, EMOJI_BULLET } from '../constants.js';
import { UX_ERRORS } from '../errors.js';
import type { ComposerBuilder } from '../types.js';

const SEPARATOR_LINE = '───────────────';

export function createComposer(): ComposerBuilder {
  const sections: string[] = [];

  const builder: ComposerBuilder = {
    paragraph(key, interpolation) {
      sections.push(t(key, interpolation));
      return builder;
    },

    bulletList(items) {
      const formatted = items.map((item) => `${EMOJI_BULLET} ${item}`).join('\n');
      sections.push(formatted);
      return builder;
    },

    separator() {
      sections.push(SEPARATOR_LINE);
      return builder;
    },

    build(): Result<string, AppError> {
      const text = sections.join('\n\n');

      if (text.length > MAX_MESSAGE_LENGTH) {
        return err(
          new AppError(UX_ERRORS.MESSAGE_TOO_LONG, {
            length: text.length,
            limit: MAX_MESSAGE_LENGTH,
          }),
        );
      }

      return ok(text);
    },
  };

  return builder;
}
